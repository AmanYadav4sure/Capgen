import nextEnv from '@next/env';
import pg from 'pg';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateLegacyExport } from '../lib/legacy-import.mjs';

nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const file = process.argv.find((arg) => arg.startsWith('--file='))?.slice(7);
if (!file) throw new Error('Use --file=path-to-reviewed-export.json. Default is validation-only.');
if ((await stat(file)).size > 25 * 1024 * 1024)
  throw new Error('Split exports larger than 25 MiB into reviewed batches.');
const raw = await readFile(file),
  data = validateLegacyExport(JSON.parse(raw.toString()));
const counts = {
  users: data.users.length,
  projects: data.projects.length,
  billingEvents: data.billingEvents.length,
};
if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify({ dryRun: true, ...counts }));
  process.exit(0);
}
const context = JSON.parse(await readFile(new URL('../.neon', import.meta.url), 'utf8'));
if (!process.argv.includes('--confirm-project=' + context.projectId))
  throw new Error('Confirm the target with --confirm-project=' + context.projectId);
const url = new URL(process.env.DATABASE_URL_UNPOOLED);
if (url.hostname.includes('-pooler')) throw new Error('Use the direct connection for imports.');
url.searchParams.set('sslmode', 'verify-full');
const client = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 15000 });
try {
  await client.connect();
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended('capgen-legacy-import',0))");
  const hash = createHash('sha256').update(raw).digest('hex');
  if (
    (await client.query('SELECT 1 FROM legacy_import_receipts WHERE batch_hash=$1', [hash]))
      .rowCount
  ) {
    await client.query('ROLLBACK');
    console.log('This exact export was already imported; no values changed.');
  } else {
    // Plain INSERT deliberately refuses pre-existing accounts/projects: never overwrite a live balance.
    for (const user of data.users)
      await client.query(
        'INSERT INTO app_users(uid,email,name,credits,plan,is_pro,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          user.uid,
          user.email,
          user.name,
          user.credits,
          user.plan,
          user.isPro,
          user.createdAt,
          user.updatedAt,
        ],
      );
    for (const project of data.projects)
      await client.query(
        'INSERT INTO projects(id,user_id,title,transcript_text,words,style_settings,has_deducted_credit,revision,created_at,updated_at) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,$10)',
        [
          project.id,
          project.userId,
          project.title,
          project.transcriptText,
          JSON.stringify(project.words),
          JSON.stringify(project.styleSettings),
          project.hasDeductedCredit,
          project.revision ?? 0,
          project.createdAt,
          project.updatedAt,
        ],
      );
    for (const event of data.billingEvents)
      await client.query(
        'INSERT INTO billing_events(event_id,user_id,credits,plan,applied_at) VALUES($1,$2,$3,$4,$5)',
        [event.deliveryIdHash, event.userId, event.credits, event.plan, event.appliedAt],
      );
    await client.query(
      'INSERT INTO legacy_import_receipts(batch_hash,user_count,project_count,event_count) VALUES($1,$2,$3,$4)',
      [hash, counts.users, counts.projects, counts.billingEvents],
    );
    await client.query('COMMIT');
    console.log(JSON.stringify({ imported: true, ...counts }));
  }
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error(
    'Import rolled back. No existing balance was overwritten. ' +
      (error?.code || 'Check the reviewed export.'),
  );
  process.exitCode = 1;
} finally {
  await client.end();
}

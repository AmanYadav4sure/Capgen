import nextEnv from '@next/env';
import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const url = process.env.DATABASE_URL_UNPOOLED;
if (!url)
  throw new Error('Set DATABASE_URL_UNPOOLED for migrations. No pooled fallback is allowed.');
if (new URL(url).hostname.includes('-pooler'))
  throw new Error('Migrations require the direct Neon connection.');
const migrationUrl = new URL(url);
if (migrationUrl.hostname.endsWith('.neon.tech'))
  migrationUrl.searchParams.set('sslmode', 'verify-full');
const client = new pg.Client({
  connectionString: migrationUrl.toString(),
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
});
try {
  await client.connect();
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended('capgen-schema',0))");
  await client.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const directory = new URL('../db/migrations/', import.meta.url);
  for (const name of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
    const sql = await readFile(new URL(name, directory), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const previous = (
      await client.query('SELECT checksum FROM schema_migrations WHERE name=$1', [name])
    ).rows[0];
    if (previous) {
      if (previous.checksum !== checksum) throw new Error('An applied migration changed: ' + name);
      continue;
    }
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)', [
      name,
      checksum,
    ]);
    console.log('Applied ' + name);
  }
  await client.query('COMMIT');
  console.log('Capgen schema is current on ' + new URL(url).hostname);
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error(
    'Migration failed; rolled back. ' +
      (error?.code || 'Check the connection and migration files.'),
  );
  process.exitCode = 1;
} finally {
  await client.end();
}

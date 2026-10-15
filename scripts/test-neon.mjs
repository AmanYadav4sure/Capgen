import nextEnv from '@next/env';
import pg from 'pg';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { loadTs } from './test-support.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const context = JSON.parse(await readFile(new URL('../.neon', import.meta.url), 'utf8'));
assert.equal(context.projectId, 'rapid-wave-79375162', 'Only the new Capgen project is in scope.');
assert.equal(
  context.branch,
  'development',
  'Run database tests on the isolated development branch.',
);
const url = new URL(process.env.DATABASE_URL_UNPOOLED);
assert.equal(
  url.hostname,
  'ep-small-hall-a12wq1pd.ap-southeast-1.aws.neon.tech',
  'Unexpected database target.',
);
url.searchParams.set('sslmode', 'verify-full');
const schema = 'qa_capgen_' + randomBytes(8).toString('hex');
assert.match(schema, /^qa_capgen_[a-f0-9]{16}$/);
const admin = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 15000 });
const checks = [];
let pool;
let created = false;
const check = async (label, operation) => {
  await operation();
  checks.push(label);
  console.log('PASS ' + label);
};
try {
  await admin.connect();
  await admin.query('CREATE SCHEMA "' + schema + '"');
  created = true;
  pool = new pg.Pool({
    connectionString: url.toString(),
    options: '-c search_path=' + schema + ',public',
    max: 8,
    connectionTimeoutMillis: 15000,
  });
  await pool.query(
    await readFile(new URL('../db/migrations/001_neon_accounts.sql', import.meta.url), 'utf8'),
  );
  await pool.query(
    await readFile(
      new URL('../db/migrations/002_legacy_import_receipts.sql', import.meta.url),
      'utf8',
    ),
  );
  const database = {
    database: () => pool,
    transaction: async (operation) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await operation(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
  const load = loadTs({ mocks: { 'lib/server/database.ts': database } });
  const identity = load('lib/server/identity.ts'),
    repository = load('lib/server/repository.ts'),
    billing = load('lib/server/billing.ts'),
    limits = load('lib/server/auth-state.ts');
  let alice, bob;
  const aliceInput = {
    id: 'user_qa_alice',
    email: 'alice@capgen-qa.example.test',
    name: 'QA Alice',
    verified: true,
  };
  const project = {
    id: 'qa-project',
    title: 'Caption test',
    words: [{ word: 'नमस्ते', start: 0, end: 1 }],
    styleSettings: { aspectRatio: '9:16' },
  };
  await check('Concurrent identity provisioning grants five credits once', async () => {
    const result = await Promise.all(
      Array.from({ length: 5 }, () => identity.provisionIdentity(aliceInput)),
    );
    alice = result[0];
    assert.ok(result.every((user) => user.uid === alice.uid));
    assert.equal((await repository.profileFor(alice)).credits, 5);
    bob = await identity.provisionIdentity({
      id: 'user_qa_bob',
      email: 'bob@capgen-qa.example.test',
      name: 'QA Bob',
      verified: true,
    });
  });
  await check('Verified legacy account linking preserves ID, paid balance and plan', async () => {
    await pool.query(
      "INSERT INTO app_users(uid,email,name,credits,plan,is_pro) VALUES('legacy_import','legacy@capgen-qa.example.test','Existing',87,'pro',true)",
    );
    const linked = await identity.provisionIdentity({
      id: 'user_qa_legacy',
      email: 'legacy@capgen-qa.example.test',
      name: 'Changed',
      verified: true,
    });
    assert.equal(linked.uid, 'legacy_import');
    assert.equal((await repository.profileFor(linked)).credits, 87);
    await assert.rejects(
      identity.provisionIdentity({
        id: 'user_qa_impostor',
        email: 'legacy@capgen-qa.example.test',
        name: 'Impostor',
        verified: true,
      }),
      /existing account/,
    );
  });
  await check(
    'Project values round-trip; ownership and credited flags cannot be forged',
    async () => {
      const saved = await repository.saveProject(alice, {
        ...project,
        userId: bob.uid,
        hasDeductedCredit: true,
        videoUrl: 'blob:discard',
      });
      assert.equal(saved.userId, alice.uid);
      assert.equal(saved.hasDeductedCredit, false);
      assert.equal(saved.videoUrl, null);
      assert.equal(saved.words[0].word, 'नमस्ते');
      assert.equal((await repository.getProject(alice, project.id)).revision, 1);
    },
  );
  await check('Cross-account read, write, delete, pagination and export are rejected', async () => {
    for (const operation of [
      () => repository.getProject(bob, project.id),
      () => repository.saveProject(bob, project),
      () => repository.deleteProject(bob, project.id),
      () => repository.recordExport(bob, project.id),
      () => repository.listProjects(bob, project.id),
    ])
      await assert.rejects(operation(), /not found/);
  });
  await check('Competing saves reject stale revisions without overwriting data', async () => {
    const results = await Promise.allSettled([
      repository.saveProject(alice, { ...project, title: 'One', revision: 1 }),
      repository.saveProject(alice, { ...project, title: 'Two', revision: 1 }),
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal((await repository.getProject(alice, project.id)).revision, 2);
  });
  await check(
    'Concurrent exports consume exactly one credit and saves preserve the flag',
    async () => {
      const credits = await Promise.all(
        Array.from({ length: 5 }, () => repository.recordExport(alice, project.id)),
      );
      assert.deepEqual(credits, [4, 4, 4, 4, 4]);
      assert.equal(
        (await repository.saveProject(alice, { ...project, revision: 2, hasDeductedCredit: false }))
          .hasDeductedCredit,
        true,
      );
    },
  );
  await check('Separate simultaneous exports cannot overdraw an account', async () => {
    await repository.saveProject(bob, { ...project, id: 'bob-one' });
    await repository.saveProject(bob, { ...project, id: 'bob-two' });
    await pool.query('UPDATE app_users SET credits=1 WHERE uid=$1', [bob.uid]);
    const results = await Promise.allSettled([
      repository.recordExport(bob, 'bob-one'),
      repository.recordExport(bob, 'bob-two'),
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal((await repository.profileFor(bob)).credits, 0);
  });
  await check('Webhook retries are atomic and never grant an orphan account', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () =>
        billing.applyBillingEvent('qa-event', alice.uid, 1500, 'pro'),
      ),
    );
    assert.equal((await repository.profileFor(alice)).credits, 1504);
    assert.equal(
      (await pool.query('SELECT count(*)::int AS count FROM billing_events')).rows[0].count,
      1,
    );
    await assert.rejects(billing.applyBillingEvent('qa-orphan', 'unknown_user', 300), /restored/);
  });
  await check('Request rate limits are shared and atomic', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => limits.rateLimit('qa-shared', 3, 60000)),
    );
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 3);
  });
  await check('Stable pagination retains 52 distinct records without duplicates', async () => {
    await pool.query(
      "INSERT INTO projects(id,user_id,title,words,style_settings) SELECT 'page-'||n,$1,'Page '||n,'[]'::jsonb,'{}'::jsonb FROM generate_series(1,52) AS n",
      [alice.uid],
    );
    const first = await repository.listProjects(alice);
    assert.equal(first.length, 51);
    const next = await repository.listProjects(alice, first[49].id);
    assert.equal(new Set([...first.slice(0, 50), ...next].map((project) => project.id)).size, 53);
  });
  await check('Invalid input cannot be persisted and successful deletion is real', async () => {
    await assert.rejects(repository.saveProject(alice, { ...project, title: ' ', revision: 3 }));
    await repository.deleteProject(alice, project.id);
    await assert.rejects(repository.getProject(alice, project.id), /not found/);
  });
  await check(
    'Legacy import preserves paid credits, export flags and webhook deduplication',
    async () => {
      const args = [
        fileURLToPath(new URL('./import-legacy.mjs', import.meta.url)),
        '--file=' + fileURLToPath(new URL('./fixtures/legacy-account.json', import.meta.url)),
        '--apply',
        '--confirm-project=' + context.projectId,
      ];
      const env = { ...process.env, PGOPTIONS: '-c search_path=' + schema + ',public' };
      execFileSync(process.execPath, args, { env, stdio: 'pipe' });
      const repeated = execFileSync(process.execPath, args, { env, encoding: 'utf8' });
      assert.match(repeated, /already imported/);
      const account = await identity.provisionIdentity({
        id: 'user_qa_imported',
        email: 'import@capgen-qa.example.test',
        name: 'Imported',
        verified: true,
      });
      assert.equal(account.uid, 'legacy_fixture_user');
      assert.equal((await repository.profileFor(account)).credits, 42);
      assert.equal(await repository.recordExport(account, 'imported-project'), 42);
      await billing.applyBillingEvent('imported-delivery', account.uid, 300);
      assert.equal((await repository.profileFor(account)).credits, 42);
    },
  );
  await mkdir(new URL('../quality-evidence/', import.meta.url), { recursive: true });
  await writeFile(
    new URL('../quality-evidence/neon-database.json', import.meta.url),
    JSON.stringify(
      {
        projectId: context.projectId,
        branch: context.branch,
        fixture:
          'Isolated temporary SQL schema; synthetic identities only. No Clerk users created.',
        checks,
        passed: true,
      },
      null,
      2,
    ),
  );
} finally {
  if (pool) await pool.end();
  if (created && /^qa_capgen_[a-f0-9]{16}$/.test(schema))
    await admin.query('DROP SCHEMA "' + schema + '" CASCADE');
  await admin.end();
}

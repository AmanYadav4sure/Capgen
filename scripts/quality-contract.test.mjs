import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { loadTs } from './test-support.mjs';
import { validateLegacyExport } from '../lib/legacy-import.mjs';

const guest = () => {
  const load = loadTs({
    mocks: {
      'lib/server/session.ts': {
        async accountSession() {
          throw new (load('lib/server/http.ts').ApiError)(401, 'Sign in to continue.');
        },
      },
    },
  });
  return load;
};
test('all private APIs reject guests before storage or paid providers', async () => {
  const load = guest();
  for (const [file, method, context] of [
    ['app/api/profile/route.ts', 'GET'],
    ['app/api/projects/route.ts', 'GET'],
    ['app/api/projects/route.ts', 'POST'],
    ['app/api/projects/[id]/route.ts', 'DELETE', { params: Promise.resolve({ id: 'private' }) }],
    [
      'app/api/projects/[id]/export/route.ts',
      'POST',
      { params: Promise.resolve({ id: 'private' }) },
    ],
    ['app/api/transcribe/route.ts', 'POST'],
  ]) {
    const response = await load(file)[method](
      new Request('http://localhost/api/private', { method }),
      context,
    );
    assert.equal(response.status, 401, file);
  }
});
test('retired email-code routes cannot issue a session', async () => {
  const load = loadTs();
  for (const file of ['app/api/auth/send-code/route.ts', 'app/api/auth/verify/route.ts']) {
    const response = await load(file).POST(new Request('http://localhost', { method: 'POST' }));
    assert.equal(response.status, 410);
    assert.equal(response.headers.get('set-cookie'), null);
  }
});
test('server session requires verified Clerk auth and ignores legacy cookies', async () => {
  let calls = 0;
  const session = loadTs({
    env: {
      CLERK_SECRET_KEY: 'synthetic-only',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'synthetic-only',
    },
    mocks: {
      '@clerk/nextjs/server': { auth: async () => ({ isAuthenticated: false, userId: null }) },
      'lib/server/database.ts': {
        database() {
          calls++;
          throw Error('Must not touch database');
        },
      },
    },
  })('lib/server/session.ts');
  await assert.rejects(session.accountSession(), /expired/);
  assert.equal(calls, 0);
});
test('pending Clerk sessions cannot open private data', async () => {
  const session = loadTs({
    env: {
      CLERK_SECRET_KEY: 'synthetic-only',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'synthetic-only',
    },
    mocks: {
      '@clerk/nextjs/server': {
        auth: async () => ({
          isAuthenticated: false,
          userId: 'user_pending',
          sessionStatus: 'pending',
        }),
      },
    },
  })('lib/server/session.ts');
  await assert.rejects(session.accountSession(), /expired/);
});
test('unconfigured Clerk and Neon fail closed with actionable messages', async () => {
  const session = loadTs({ env: { CLERK_SECRET_KEY: '' } })('lib/server/session.ts');
  await assert.rejects(session.accountSession(), /Sign-in is not configured/);
  const db = loadTs({ env: { DATABASE_URL: '' } })('lib/server/database.ts');
  assert.throws(() => db.database(), /storage is not connected/);
});
test('unverified primary email cannot claim an imported account', async () => {
  const identity = loadTs()('lib/server/identity.ts');
  await assert.rejects(
    identity.provisionIdentity({
      id: 'user_unverified',
      email: 'owner@example.test',
      name: 'Not owner',
      verified: false,
    }),
    /Verify your primary email/,
  );
  assert.equal(
    identity.legacyAccountId(' Person@Example.test '),
    identity.legacyAccountId('person@example.test'),
  );
});
test('origins and bounded JSON protect mutation boundaries', async () => {
  const http = loadTs()('lib/server/http.ts');
  assert.throws(
    () =>
      http.sameOrigin(
        new Request('https://www.capgen.app/api/projects', {
          headers: { Origin: 'https://attacker.example' },
        }),
      ),
    /must come from/,
  );
  await assert.rejects(
    http.jsonBody(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '[]',
      }),
    ),
    /JSON object/,
  );
  await assert.rejects(
    http.jsonBody(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'x'.repeat(100),
      }),
      50,
    ),
    /too large/,
  );
});
test('project input rejects malformed identifiers, timestamps and style values', () => {
  const input = loadTs()('lib/server/project-validation.ts');
  const valid = {
    title: 'Captions',
    words: [{ word: 'नमस्ते', start: 0, end: 1 }],
    styleSettings: { aspectRatio: '9:16' },
  };
  assert.equal(input.projectInput(valid).words[0].word, 'नमस्ते');
  for (const value of [
    { ...valid, title: ' ' },
    { ...valid, words: [{ word: 'x', start: -1, end: 1 }] },
    { ...valid, styleSettings: { aspectRatio: 'wrong' } },
    { ...valid, styleSettings: { fontSize: Infinity } },
  ])
    assert.throws(() => input.projectInput(value));
  assert.throws(() => input.projectId('../private'));
});
test('signed Dodo deliveries verify before granting; tampering and expiry fail', async () => {
  let applied = 0;
  const key = crypto.randomBytes(32),
    timestamp = String(Math.floor(Date.now() / 1000));
  const body = JSON.stringify({
    type: 'subscription.renewed',
    data: { metadata: { user_id: 'em_fixture', plan: 'pro' } },
  });
  const load = loadTs({
    env: { DODO_PAYMENTS_WEBHOOK_KEY: 'whsec_' + key.toString('base64') },
    mocks: {
      'lib/server/billing.ts': {
        async applyBillingEvent(id, uid, credits) {
          assert.equal(id, 'fixture-event');
          assert.equal(uid, 'em_fixture');
          assert.equal(credits, 1500);
          applied++;
        },
      },
    },
  });
  const handler = load('app/api/dodo/webhook/route.ts');
  const send = (text, time = timestamp) => {
    const signature = crypto
      .createHmac('sha256', key)
      .update('fixture-event.' + timestamp + '.' + body)
      .digest('base64');
    return handler.POST(
      new Request('http://localhost/api/dodo/webhook', {
        method: 'POST',
        body: text,
        headers: {
          'webhook-id': 'fixture-event',
          'webhook-timestamp': time,
          'webhook-signature': 'v1,' + signature,
        },
      }),
    );
  };
  assert.equal((await send(body)).status, 200);
  assert.equal((await send(body + ' ')).status, 401);
  assert.equal((await send(body, String(Number(timestamp) - 600))).status, 401);
  assert.equal(applied, 1);
  const unavailable = loadTs()('app/api/dodo/webhook/route.ts');
  assert.equal(
    (await unavailable.POST(new Request('http://localhost', { method: 'POST', body: '{}' })))
      .status,
    503,
  );
});
test('browser save adapter serializes revisions and reports failed saves', async () => {
  const revisions = [];
  let fail = false;
  const load = loadTs({
    globals: {
      fetch: async (_url, options) => {
        const body = JSON.parse(options.body);
        revisions.push(body.revision);
        return new Response(
          JSON.stringify(
            fail ? { error: 'Unavailable' } : { project: { ...body, revision: body.revision + 1 } },
          ),
          { status: fail ? 503 : 200 },
        );
      },
    },
  });
  const adapter = load('lib/data.ts');
  await Promise.all([
    adapter.saveProject({ id: 'serial', title: 'First' }),
    adapter.saveProject({ id: 'serial', title: 'Second' }),
  ]);
  assert.deepEqual(revisions, [0, 1]);
  fail = true;
  const result = await adapter.saveProject({ id: 'serial', title: 'Unsaved' });
  assert.equal(result.data, null);
  assert.equal(result.isLocal, false);
  assert.match(result.error.message, /Unavailable/);
});
test('legacy import validation refuses ownerless data and invalid balances', () => {
  assert.equal(
    validateLegacyExport({ version: 1, users: [], projects: [], billingEvents: [] }).version,
    1,
  );
  assert.throws(
    () =>
      validateLegacyExport({
        version: 1,
        users: [
          {
            uid: 'old',
            email: 'a@example.test',
            name: 'A',
            credits: -1,
            plan: 'free',
            isPro: false,
          },
        ],
        projects: [],
        billingEvents: [],
      }),
    /Invalid legacy export/,
  );
  assert.throws(
    () =>
      validateLegacyExport({
        version: 1,
        users: [],
        projects: [{ id: 'private', userId: 'unknown' }],
        billingEvents: [],
      }),
    /missing owner/,
  );
});

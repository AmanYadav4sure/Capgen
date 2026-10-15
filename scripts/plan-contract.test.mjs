import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the server mapping with synthetic configuration; no provider API or credentials.
function loadResolver(env) {
  const source = readFileSync(new URL('../lib/dodo.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    module: { exports },
    exports,
    process: { env },
    require: () => class DodoStub {},
  });
  return exports.resolvePlan;
}

const ids = { DODO_PRODUCT_PRO_ID: 'configured-pro', DODO_PRODUCT_TEAM_ID: 'configured-team' };
test('public checkout plan names select only configured products', () => {
  const resolve = loadResolver(ids);
  assert.equal(resolve('pro').productId, ids.DODO_PRODUCT_PRO_ID);
  assert.equal(resolve('team').productId, ids.DODO_PRODUCT_TEAM_ID);
  assert.equal(resolve('pro').plan, 'pro');
  assert.equal(resolve('team').plan, 'team');
});
test('provider product IDs retain webhook compatibility', () => {
  const resolve = loadResolver(ids);
  assert.equal(resolve(ids.DODO_PRODUCT_PRO_ID).plan, 'pro');
  assert.equal(resolve(ids.DODO_PRODUCT_TEAM_ID).plan, 'team');
});
test('unknown or unconfigured products cannot start checkout', () => {
  assert.equal(loadResolver(ids)('unapproved-product'), null);
  assert.equal(loadResolver({})('pro'), null);
  assert.equal(loadResolver({})('team'), null);
});

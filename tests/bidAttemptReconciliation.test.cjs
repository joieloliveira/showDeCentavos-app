const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const modules = {};
for (const name of ['bidAttemptState','bidAttemptReconciliation']) {
  const source = fs.readFileSync(path.join(__dirname, '../services/' + name + '.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(js, { module, exports: module.exports, require: (p) => modules[p.replace('./','')] });
  modules[name] = module.exports;
}
const resolve = modules.bidAttemptReconciliation.resolvePendingBid;
const user = '507f1f77bcf86cd799439011';
const auction = '507f1f77bcf86cd799439012';
const bidId = '507f1f77bcf86cd799439013';
const key = '123e4567-e89b-42d3-a456-426614174000';
const reconciling = { status: 'reconciling', key };
const bid = { _id: bidId, user, auction, idempotencyKey: key };
test('matching record confirms original attempt', () => {
  const state = resolve(reconciling, key, user, auction, { status: 'found', bid });
  assert.equal(state.status, 'confirmed');
  assert.equal(state.bidId, bidId);
});
test('404 remains uncertain, never resets or retries', () => {
  assert.equal(resolve(reconciling, key, user, auction, { status: 'not_found' }).status, 'uncertain');
});
test('outage remains uncertain', () => {
  assert.equal(resolve(reconciling, key, user, auction, { status: 'unavailable' }).status, 'uncertain');
});
test('foreign user cannot confirm bid', () => {
  assert.equal(resolve(reconciling, key, user, auction, { status: 'found', bid: { ...bid, user: bidId } }).status, 'uncertain');
});
test('foreign auction cannot confirm bid', () => {
  assert.equal(resolve(reconciling, key, user, auction, { status: 'found', bid: { ...bid, auction: bidId } }).status, 'uncertain');
});
test('different idempotency key cannot confirm bid', () => {
  assert.equal(resolve(reconciling, key, user, auction, { status: 'found', bid: { ...bid, idempotencyKey: '123e4567-e89b-42d3-a456-426614174001' } }).status, 'uncertain');
});
test('stale response does not overwrite a confirmed attempt', () => {
  const confirmed = { status: 'confirmed', key, bidId };
  assert.equal(resolve(confirmed, key, user, auction, { status: 'not_found' }), confirmed);
});
test('foreign key response does not affect active reconciliation', () => {
  assert.equal(resolve(reconciling, '123e4567-e89b-42d3-a456-426614174001', user, auction, { status: 'found', bid }), reconciling);
});

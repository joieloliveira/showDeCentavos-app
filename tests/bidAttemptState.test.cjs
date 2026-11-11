const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../services/bidAttemptState.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
vm.runInNewContext(js, { module: mod, exports: mod.exports });
const { transitionBidAttempt: next } = mod.exports;
const key = '123e4567-e89b-42d3-a456-426614174000';
const other = '123e4567-e89b-42d3-a456-426614174001';
const idle = { status: 'idle' };
const submitting = next(idle, { type: 'begin', key });

test('begin creates exactly one submitting attempt', () => {
  assert.equal(submitting.status, 'submitting');
  assert.equal(next(submitting, { type: 'begin', key: other }), submitting);
});
test('uncertain outcome retains original key and blocks reset or new attempt', () => {
  const state = next(submitting, { type: 'uncertain', key, message: 'timeout' });
  assert.equal(state.key, key);
  assert.equal(next(state, { type: 'reset' }), state);
  assert.equal(next(state, { type: 'begin', key: other }), state);
});
test('reconciliation 404 stays uncertain and never permits automatic new attempt', () => {
  const uncertain = next(submitting, { type: 'uncertain', key, message: 'timeout' });
  const reconciling = next(uncertain, { type: 'reconcile', key });
  const missing = next(reconciling, { type: 'not_found', key });
  assert.equal(reconciling.status, 'reconciling');
  assert.equal(missing.status, 'uncertain');
  assert.equal(missing.key, key);
  assert.equal(next(missing, { type: 'begin', key: other }), missing);
});
test('successful reconciliation confirms the original attempt', () => {
  const uncertain = next(submitting, { type: 'uncertain', key, message: 'timeout' });
  const confirmed = next(next(uncertain, { type: 'reconcile', key }), { type: 'confirmed', key, bidId: 'bid1' });
  assert.equal(confirmed.status, 'confirmed');
  assert.equal(confirmed.bidId, 'bid1');
  assert.equal(next(confirmed, { type: 'reset' }).status, 'idle');
});
test('definitive rejection can be cleared for a new attempt', () => {
  const rejected = next(submitting, { type: 'rejected', key, message: 'saldo insuficiente' });
  assert.equal(rejected.status, 'rejected');
  assert.equal(next(rejected, { type: 'reset' }).status, 'idle');
});
test('stale or foreign-key events cannot change the attempt', () => {
  assert.equal(next(submitting, { type: 'confirmed', key: other, bidId: 'bid2' }), submitting);
  assert.equal(next(submitting, { type: 'rejected', key: other, message: 'erro' }), submitting);
});
test('submitting cannot be reset while outcome is pending', () => {
  assert.equal(next(submitting, { type: 'reset' }), submitting);
});

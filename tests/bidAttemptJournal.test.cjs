const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../services/bidAttemptJournal.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
vm.runInNewContext(js, { module: mod, exports: mod.exports });
const { serializePendingBid: save, restorePendingBid: restore } = mod.exports;
const user = '507f1f77bcf86cd799439011';
const auction = '507f1f77bcf86cd799439012';
const key = '123e4567-e89b-42d3-a456-426614174000';
const pending = { status: 'submitting', key };
test('pending submission survives refresh as uncertain, not a new POST', () => {
  const raw = save(pending, user, auction, 123456);
  const result = restore(raw, user, auction);
  assert.equal(result.status, 'uncertain');
  assert.equal(result.key, key);
  assert.equal(raw.includes('token'), false);
});
test('reconciliation in progress also recovers as uncertain', () => {
  const raw = save({ status: 'reconciling', key }, user, auction, 123456);
  assert.equal(restore(raw, user, auction).status, 'uncertain');
});
test('an uncertain state preserves its original key', () => {
  const raw = save({ status: 'uncertain', key, message: 'timeout' }, user, auction, 123456);
  assert.equal(restore(raw, user, auction).key, key);
});
test('settled and idle attempts are never saved', () => {
  assert.equal(save({ status: 'idle' }, user, auction, 1), null);
  assert.equal(save({ status: 'confirmed', key, bidId: user }, user, auction, 1), null);
  assert.equal(save({ status: 'rejected', key, message: 'denied' }, user, auction, 1), null);
});
test('different user or auction cannot recover a pending attempt', () => {
  const raw = save(pending, user, auction, 123456);
  assert.equal(restore(raw, '507f1f77bcf86cd799439013', auction), null);
  assert.equal(restore(raw, user, '507f1f77bcf86cd799439013'), null);
});
test('invalid, malformed or untrusted journal data is ignored', () => {
  assert.equal(restore('{bad', user, auction), null);
  assert.equal(restore('{}', user, auction), null);
  assert.equal(restore(JSON.stringify({ version: 1, userId: user, auctionId: auction, key: 'invalid', savedAt: 1 }), user, auction), null);
  assert.equal(save({ status: 'submitting', key: 'invalid' }, user, auction, 1), null);
});
test('pending journal is not silently discarded because it is old', () => {
  const raw = save(pending, user, auction, 1);
  assert.equal(restore(raw, user, auction).status, 'uncertain');
});

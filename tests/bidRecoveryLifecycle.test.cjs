const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const modules = {};
for (const name of ['bidAttemptState', 'bidAttemptJournal', 'bidAttemptReconciliation']) {
  const source = fs.readFileSync(path.join(__dirname, '../services', name + '.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  vm.runInNewContext(js, { module: mod, exports: mod.exports, require: p => modules[p.replace('./', '')] });
  modules[name] = mod.exports;
}
const { transitionBidAttempt: transition } = modules.bidAttemptState;
const { persistPendingBid: persist, restorePendingBid: restore, clearConfirmedBidJournal: clear, BID_ATTEMPT_JOURNAL_KEY: storageKey } = modules.bidAttemptJournal;
const { resolvePendingBid: resolve } = modules.bidAttemptReconciliation;
const user = '507f1f77bcf86cd799439011';
const auction = '507f1f77bcf86cd799439012';
const bidId = '507f1f77bcf86cd799439013';
const key = '123e4567-e89b-42d3-a456-426614174000';
const bid = { _id: bidId, user, auction, idempotencyKey: key };
function storage() {
  const values = new Map();
  return {
    getItem: k => values.has(k) ? values.get(k) : null,
    setItem: (k,v) => values.set(k,v),
    removeItem: k => values.delete(k),
  };
}
function pending() {
  const store = storage();
  const initial = transition({ status: 'idle' }, { type: 'begin', key });
  assert.equal(persist(store, initial, user, auction, 100), true);
  const recovered = restore(store.getItem(storageKey), user, auction);
  assert.equal(recovered.status, 'uncertain');
  const checking = transition(recovered, { type: 'reconcile', key });
  return { store, checking };
}
function finish(store, checking, result) {
  const state = resolve(checking, key, user, auction, result);
  if (state.status === 'confirmed') clear(store, state, user, auction);
  return state;
}
test('persist, restore, GET-found result and confirmed cleanup form one safe lifecycle', () => {
  const { store, checking } = pending();
  const state = finish(store, checking, { status: 'found', bid });
  assert.equal(state.status, 'confirmed');
  assert.equal(store.getItem(storageKey), null);
});
test('GET 404 leaves journal and original key intact', () => {
  const { store, checking } = pending();
  assert.equal(finish(store, checking, { status: 'not_found' }).status, 'uncertain');
  assert.equal(restore(store.getItem(storageKey), user, auction).key, key);
});
test('GET unavailable leaves journal intact', () => {
  const { store, checking } = pending();
  assert.equal(finish(store, checking, { status: 'unavailable' }).status, 'uncertain');
  assert.ok(store.getItem(storageKey));
});
test('foreign user record cannot clear journal', () => {
  const { store, checking } = pending();
  assert.equal(finish(store, checking, { status: 'found', bid: { ...bid, user: bidId } }).status, 'uncertain');
  assert.ok(store.getItem(storageKey));
});
test('foreign auction record cannot clear journal', () => {
  const { store, checking } = pending();
  assert.equal(finish(store, checking, { status: 'found', bid: { ...bid, auction: bidId } }).status, 'uncertain');
  assert.ok(store.getItem(storageKey));
});
test('different key record cannot clear journal', () => {
  const { store, checking } = pending();
  assert.equal(finish(store, checking, { status: 'found', bid: { ...bid, idempotencyKey: '123e4567-e89b-42d3-a456-426614174001' } }).status, 'uncertain');
  assert.ok(store.getItem(storageKey));
});
test('stale response cannot clear a replaced journal', () => {
  const { store, checking } = pending();
  const foreignKey = '123e4567-e89b-42d3-a456-426614174001';
  const foreign = modules.bidAttemptJournal.serializePendingBid({ status: 'submitting', key: foreignKey }, user, auction, 101);
  store.setItem(storageKey, foreign);
  assert.equal(finish(store, checking, { status: 'found', bid }).status, 'confirmed');
  assert.equal(restore(store.getItem(storageKey), user, auction).key, foreignKey);
});

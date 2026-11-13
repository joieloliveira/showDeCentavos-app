const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../services/bidLookupGuard.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
vm.runInNewContext(js, { module: mod, exports: mod.exports });
const { isCurrentLookup } = mod.exports;
const base = { generation: 1, userId: 'user-a', auctionId: 'auction-a', token: 'token-a' };
test('current GET identity is accepted', () => assert.equal(isCurrentLookup(base, { ...base }), true));
test('older generation is rejected', () => assert.equal(isCurrentLookup(base, { ...base, generation: 2 }), false));
test('different account is rejected', () => assert.equal(isCurrentLookup(base, { ...base, userId: 'user-b' }), false));
test('different auction is rejected', () => assert.equal(isCurrentLookup(base, { ...base, auctionId: 'auction-b' }), false));
test('different token is rejected', () => assert.equal(isCurrentLookup(base, { ...base, token: 'token-b' }), false));
test('missing identity is rejected', () => {
  assert.equal(isCurrentLookup({ ...base, token: '' }, base), false);
  assert.equal(isCurrentLookup({ ...base, userId: '' }, base), false);
  assert.equal(isCurrentLookup({ ...base, auctionId: '' }, base), false);
});
test('invalid generation is rejected', () => assert.equal(isCurrentLookup({ ...base, generation: -1 }, base), false));
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
test('late first response cannot replace second response', async () => {
  let current = { ...base };
  let display = null;
  const first = deferred();
  const second = deferred();
  const apply = (request, pending) => pending.promise.then(value => {
    if (isCurrentLookup(request, current)) display = value;
  });
  const a = apply({ ...current }, first);
  current = { ...current, generation: 2 };
  const b = apply({ ...current }, second);
  second.resolve('new'); await b;
  first.resolve('old'); await a;
  assert.equal(display, 'new');
});
test('logout during GET prevents late result', async () => {
  let current = { ...base };
  let display = null;
  const pending = deferred();
  const request = { ...current };
  const work = pending.promise.then(value => { if (isCurrentLookup(request, current)) display = value; });
  current = { ...current, userId: '', token: '', generation: 2 };
  pending.resolve('private bid'); await work;
  assert.equal(display, null);
});
test('navigation during GET prevents late result', async () => {
  let current = { ...base };
  let display = null;
  const pending = deferred();
  const request = { ...current };
  const work = pending.promise.then(value => { if (isCurrentLookup(request, current)) display = value; });
  current = { ...current, auctionId: 'auction-b', generation: 2 };
  pending.resolve('previous auction'); await work;
  assert.equal(display, null);
});

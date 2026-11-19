const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../services/bidPreflight.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleObject = { exports: {} };
vm.runInNewContext(compiled, { module: moduleObject, exports: moduleObject.exports });
const { evaluateBidPreflight } = moduleObject.exports;
const valid = { authenticated: true, authenticationPending: false, auctionStatus: 'active', serverAvailable: true, balanceCents: 100, bidCostCents: 50 };

test('valid preview requirements never imply financial authorization', () => {
  const result = evaluateBidPreflight(valid);
  assert.equal(result.readyForPreview, true);
  assert.match(result.message, /bloqueado/);
});
for (const [name, change] of [
  ['authentication pending', { authenticationPending: true }],
  ['signed out', { authenticated: false }],
  ['scheduled auction', { auctionStatus: 'scheduled' }],
  ['offline server', { serverAvailable: false }],
  ['unknown balance', { balanceCents: null }],
  ['insufficient balance', { balanceCents: 49 }],
  ['negative balance', { balanceCents: -1 }],
  ['invalid bid cost', { bidCostCents: 0 }],
  ['fractional bid cost', { bidCostCents: 0.5 }],
]) {
  test(name + ' blocks preview readiness', () => {
    assert.equal(evaluateBidPreflight({ ...valid, ...change }).readyForPreview, false);
  });
}

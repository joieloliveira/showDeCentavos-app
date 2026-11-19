const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../services/sessionGuard.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const moduleExports = {};
vm.runInNewContext(compiled, { exports: moduleExports });
const { isCurrentSession } = moduleExports;

test('accepts the same session version and token', () => {
  assert.equal(isCurrentSession(3, 3, 'token-a', 'token-a'), true);
});

test('rejects a stale login response after a newer login begins', () => {
  assert.equal(isCurrentSession(3, 4, null, null), false);
});

test('rejects a login response after logout increments the session version', () => {
  assert.equal(isCurrentSession(5, 6, null, null), false);
});

test('rejects a stale profile response after token rotation', () => {
  assert.equal(isCurrentSession(7, 7, 'old-token', 'new-token'), false);
});

test('rejects a profile response after the token was cleared', () => {
  assert.equal(isCurrentSession(7, 7, 'old-token', null), false);
});

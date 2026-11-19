const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { AxiosError } = require('axios');

const source = fs.readFileSync(path.join(__dirname, '../services/auth.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const moduleExports = {};
vm.runInNewContext(compiled, {
  exports: moduleExports,
  require: name => {
    if (name === 'axios') return { AxiosError };
    if (name === '@/services/api') return { api: {} };
    throw Error('Unexpected import ' + name);
  }
});
const { getApiError } = moduleExports;
const failure = (status, data) => new AxiosError('Request failed', 'ERR_BAD_RESPONSE', {}, {}, { status, data });

test('network failure offers connectivity guidance', () => {
  assert.match(getApiError(new AxiosError('Network Error', 'ERR_NETWORK')), /conectar à API/);
});
test('request timeout has distinct recovery guidance', () => {
  assert.match(getApiError(new AxiosError('timeout', 'ECONNABORTED')), /demorou para responder/);
  assert.match(getApiError(new AxiosError('timeout', 'ETIMEDOUT')), /demorou para responder/);
});
test('unauthorized response requests a new login without exposing server message', () => {
  assert.match(getApiError(failure(401, { message: 'internal auth detail' })), /Faça login novamente/);
});
test('server failure uses generic message instead of internal details', () => {
  assert.match(getApiError(failure(503, { message: 'database password is secret' })), /temporariamente indisponível/);
});
test('validation response preserves a meaningful backend message', () => {
  assert.equal(getApiError(failure(422, { message: 'CEP inválido.' })), 'CEP inválido.');
});
test('empty backend message falls back to a generic error', () => {
  assert.equal(getApiError(failure(400, { message: '   ' })), 'Não foi possível concluir a solicitação.');
});

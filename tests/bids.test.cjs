// Isolated client-service tests: no browser, server, database or financial POST.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadService() {
  const calls = [];
  let getResponse = async () => ({ data: {} });
  let postResponse = async () => ({ data: {} });
  const api = {
    get: async (...args) => { calls.push(['GET', ...args]); return getResponse(...args); },
    post: async (...args) => { calls.push(['POST', ...args]); return postResponse(...args); },
  };
  const axios = require('axios');
  const source = fs.readFileSync(path.join(__dirname, '../services/bids.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(js, {
    module, exports: module.exports,
    require: name => name === 'axios' ? axios : name === '@/services/api' ? { api } : (() => { throw Error('Unexpected import: ' + name); })(),
  }, { filename: 'services/bids.ts' });
  return { service: module.exports, calls, setGet: fn => { getResponse = fn; }, setPost: fn => { postResponse = fn; } };
}
const auctionId = '6af23823b7a9e7e365c9e6e5';
const key = '123e4567-e89b-42d3-a456-426614174000';
const bid = { _id: '6af23823b7a9e7e365c9e6e6', auction: auctionId, idempotencyKey: key, bidCostCents: 50 };

test('financial POST is blocked by default, even with valid credentials', async () => {
  const { service, calls } = loadService();
  await assert.rejects(service.submitConfirmedBid('token', auctionId, key), /bloqueado/);
  assert.equal(calls.length, 0);
});

test('explicit release sends exactly one POST with original key and auth', async () => {
  const { service, calls, setPost } = loadService();
  setPost(async () => ({ data: { message: 'ok', bid } }));
  const response = await service.submitConfirmedBid('token', auctionId, key, { financialBidsEnabled: true });
  assert.equal(response.bid.idempotencyKey, key);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'POST');
  assert.equal(calls[0][1], '/auctions/' + auctionId + '/bids');
  assert.equal(calls[0][2].idempotencyKey, key);
  assert.equal(calls[0][3].headers.Authorization, 'Bearer token');
});

test('invalid idempotency key never sends POST', async () => {
  const { service, calls } = loadService();
  await assert.rejects(service.submitConfirmedBid('token', auctionId, 'invalid', { financialBidsEnabled: true }), /inválida/);
  assert.equal(calls.length, 0);
});

test('inconsistent success response is rejected without retry', async () => {
  const { service, calls, setPost } = loadService();
  setPost(async () => ({ data: { bid: { ...bid, idempotencyKey: 'different' } } }));
  await assert.rejects(service.submitConfirmedBid('token', auctionId, key, { financialBidsEnabled: true }), /inconsistente/);
  assert.equal(calls.length, 1);
});

test('read-only reconciliation finds a bid without POST', async () => {
  const { service, calls, setGet } = loadService();
  setGet(async () => ({ data: { bid } }));
  const result = await service.reconcileBid('token', key);
  assert.equal(result.status, 'found');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'GET');
});

test('404 reconciliation does not authorize another POST', async () => {
  const { service, calls, setGet } = loadService();
  const axios = require('axios');
  setGet(async () => { throw new axios.AxiosError('not found', 'ERR_BAD_REQUEST', undefined, undefined, { status: 404, data: {}, headers: {}, config: { headers: {} }, statusText: 'Not Found' }); });
  assert.equal((await service.reconcileBid('token', key)).status, 'not_found');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'GET');
});

test('network uncertainty requires reconciliation', () => {
  const { service } = loadService();
  const axios = require('axios');
  const result = service.describeBidFailure(new axios.AxiosError('timeout', 'ECONNABORTED'));
  assert.equal(result.kind, 'uncertain');
  assert.equal(result.needsReconciliation, true);
});

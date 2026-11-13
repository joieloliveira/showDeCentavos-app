const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

for (const [filename, exportName, endpoint] of [
  ['MyWins.tsx', 'MyWins', '/auctions/my/wins'],
  ['MyParticipations.tsx', 'MyParticipations', '/auctions/my/participations']
]) {
  function setup() {
    const source = fs.readFileSync(path.join(__dirname, '../components/account', filename), 'utf8');
    assert.match(source, /^'use client';/);
    const compiled = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020
    }}).outputText;
    const calls = [];
    const effects = [];
    const state = [];
    let cursor = 0;
    let currentUser = { id: 'user-a' };
    let currentToken = 'token-a';
    const react = {
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
      },
      useEffect(callback) { effects.push(callback); }
    };
    const api = { get(url, config) {
      calls.push({ url, config });
      return new Promise(() => {}); // Deliberately unresolved network request
    }};
    const exports = {};
    const requireStub = name => {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null };
      if (name === 'axios') return { isCancel: () => false };
      if (name === '@/services/api') return { api };
      if (name === '@/services/auth') return { getApiError: () => 'Erro de rede' };
      if (name === '@/contexts/AuthContext') return { useAuth: () => ({
        user: currentUser, getToken: () => currentToken, isLoading: false
      }) };
      if (name === 'next/link') return { default: () => null };
      if (name === 'lucide-react') return new Proxy({}, { get: () => () => null });
      if (name === './WinShippingAddressForm') return { WinShippingAddressForm: () => null };
      throw new Error('Unexpected dependency: ' + name);
    };
    vm.runInNewContext(compiled, {
      exports, require: requireStub, AbortController, queueMicrotask, console
    });
    return {
      calls,
      mount() { cursor = 0; exports[exportName](); const effect = effects.shift(); return effect(); },
      setUser(user, token) { currentUser = user; currentToken = token; }
    };
  }

  test(filename + ': aborts in-flight request on cleanup', () => {
    const app = setup();
    const cleanup = app.mount();
    assert.equal(app.calls.length, 1);
    assert.equal(app.calls[0].url, endpoint);
    assert.equal(app.calls[0].config.signal.aborted, false);
    assert.equal(app.calls[0].config.headers.Authorization, 'Bearer token-a');
    cleanup();
    assert.equal(app.calls[0].config.signal.aborted, true);
  });

  test(filename + ': a replacement session gets a fresh abort signal', () => {
    const app = setup();
    const cleanup = app.mount();
    cleanup();
    app.setUser({ id: 'user-b' }, 'token-b');
    const cleanupNext = app.mount();
    assert.equal(app.calls.length, 2);
    assert.equal(app.calls[0].config.signal.aborted, true);
    assert.equal(app.calls[1].config.signal.aborted, false);
    assert.equal(app.calls[1].config.headers.Authorization, 'Bearer token-b');
    cleanupNext();
  });
}

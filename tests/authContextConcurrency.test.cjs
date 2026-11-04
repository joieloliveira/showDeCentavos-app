const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function harness() {
  const storage = new Map();
  const state = [];
  const refs = [];
  const effects = [];
  let cursor = 0;
  let refCursor = 0;
  let current;
  const requests = { login: [], google: [], profile: [] };
  const react = {
    createContext: () => ({ Provider: ({ value }) => { current = value; return null; } }),
    useState: initial => {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    },
    useRef: initial => {
      const index = refCursor++;
      return refs[index] ??= { current: initial };
    },
    useEffect: callback => { effects.push(callback); },
    useCallback: callback => callback,
    useContext: () => current,
  };
  const source = fs.readFileSync(path.join(__dirname, '../contexts/AuthContext.tsx'), 'utf8');
  const guardSource = fs.readFileSync(path.join(__dirname, '../services/sessionGuard.ts'), 'utf8');
  const compile = (code, jsx = false) => ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: jsx ? ts.JsxEmit.ReactJSX : undefined, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const guardExports = {};
  vm.runInNewContext(compile(guardSource), { exports: guardExports });
  const authExports = {};
  const fakeAuth = {
    loginRequest: () => { const item = deferred(); requests.login.push(item); return item.promise; },
    googleLoginRequest: () => { const item = deferred(); requests.google.push(item); return item.promise; },
    meRequest: () => { const item = deferred(); requests.profile.push(item); return item.promise; },
  };
  const storageApi = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  };
  const requireStub = name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx: (component, props) => component(props), jsxs: (component, props) => component(props) };
    if (name === '@/services/auth') return fakeAuth;
    if (name === '@/services/sessionGuard') return guardExports;
    throw Error('Unexpected import: ' + name);
  };
  vm.runInNewContext(compile(source, true), {
    exports: authExports, require: requireStub, sessionStorage: storageApi,
    window: {}, queueMicrotask, console,
  });
  return {
    requests,
    storage,
    render() { cursor = 0; refCursor = 0; authExports.AuthProvider({ children: null }); return current; },
    mount() { this.render(); const effect = effects.shift(); return effect(); },
  };
}
const person = (id) => ({ id, name: id, email: id + '@example.com', role: 'user' });
const credentials = (id) => ({ token: 'token-' + id, user: person(id) });
const TOKEN_KEY = 'showdecentavos:dev-session';

test('older login cannot overwrite a newer completed login', async () => {
  const app = harness();
  app.mount();
  const first = app.render().login('old', 'secret');
  const second = app.render().login('new', 'secret');
  app.requests.login[1].resolve(credentials('new'));
  await second;
  app.requests.login[0].resolve(credentials('old'));
  await assert.rejects(first, /operação de sessão mais recente/);
  assert.equal(app.storage.get(TOKEN_KEY), 'token-new');
  assert.equal(app.render().user.id, 'new');
});

test('logout invalidates an in-flight Google login', async () => {
  const app = harness();
  app.mount();
  const login = app.render().loginWithGoogle('credential');
  app.render().logout();
  app.requests.google[0].resolve(credentials('late'));
  await assert.rejects(login, /operação de sessão mais recente/);
  assert.equal(app.storage.has(TOKEN_KEY), false);
  assert.equal(app.render().user, null);
});

test('stale profile refresh cannot restore a logged-out user', async () => {
  const app = harness();
  app.mount();
  const login = app.render().login('one', 'secret');
  app.requests.login[0].resolve(credentials('one'));
  await login;
  const refresh = app.render().refreshUser();
  app.render().logout();
  app.requests.profile[0].resolve(person('one'));
  await assert.rejects(refresh, /sessão mudou/);
  assert.equal(app.render().user, null);
});

test('initial profile rejection cannot erase a replacement login', async () => {
  const app = harness();
  app.storage.set(TOKEN_KEY, 'token-old');
  app.mount();
  const login = app.render().login('new', 'secret');
  app.requests.login[0].resolve(credentials('new'));
  await login;
  app.requests.profile[0].reject(new Error('old session expired'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.storage.get(TOKEN_KEY), 'token-new');
  assert.equal(app.render().user.id, 'new');
});

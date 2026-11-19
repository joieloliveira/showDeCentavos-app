const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const productId = '000000000000000000000001';
const source = fs.readFileSync(path.join(__dirname, '../components/admin/AdminAuctionCreateForm.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function setup({ createError } = {}) {
  const state = [];
  const calls = [];
  let cursor = 0;
  let effectStarted = false;
  let created = 0;
  const getToken = () => 'test-token';
  const dependencies = {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], value => { state[index] = value; }];
      },
      useEffect(effect) {
        if (effectStarted) return;
        effectStarted = true;
        effect();
      },
    },
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@/contexts/AuthContext': { useAuth: () => ({ getToken, user: { role: 'admin' } }) },
    '@/services/adminAuctions': {
      listAuctionProducts: async () => [{ _id: productId, name: 'Produto fictício' }],
      async createAdminAuction(...args) {
        calls.push(args);
        if (createError) throw createError;
      },
    },
    '@/services/auth': { getApiError: error => error.message },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), 'Unexpected dependency: ' + name);
      return dependencies[name];
    },
  });

  function elements(node) {
    if (Array.isArray(node)) return node.flatMap(elements);
    if (node && typeof node === 'object') return [node, ...elements(node.props.children)];
    return [];
  }

  function render() {
    cursor = 0;
    return elements(exports.AdminAuctionCreateForm({ onCreated: () => { created++; } }));
  }

  function props(type, predicate = () => true) {
    return render().find(element => element.type === type && predicate(element.props)).props;
  }

  render();
  await new Promise(setImmediate);
  const product = () => props('select', field => field.required);
  product().onChange({ target: { value: productId } });
  return {
    calls,
    product,
    get created() { return created; },
    price: () => props('input'),
    button: () => props('button'),
    submit: () => props('form').onSubmit({ preventDefault() {} }),
    message: () => props('p', paragraph => paragraph.role === 'status').children,
  };
}

test('invalid initial prices never submit an administrative auction', async () => {
  const app = await setup();
  for (const value of ['', '-1', '1.5', '9007199254740992']) {
    app.price().onChange({ target: { value } });
    assert.equal(app.button().disabled, true, JSON.stringify(value));
    await app.submit();
  }
  assert.deepEqual(app.calls, []);
});

test('an explicitly entered zero is submitted and refreshes the listing', async () => {
  const app = await setup();
  app.price().onChange({ target: { value: '' } });
  app.price().onChange({ target: { value: '0' } });
  assert.equal(app.button().disabled, false);
  await app.submit();
  assert.deepEqual(app.calls, [['test-token', productId, 0, 50]]);
  assert.equal(app.created, 1);
});

test('a rejected submission shows the API error and preserves the fields', async () => {
  const app = await setup({ createError: new Error('Produto não encontrado.') });
  app.price().onChange({ target: { value: '25' } });
  await app.submit();
  assert.equal(app.message(), 'Produto não encontrado.');
  assert.equal(app.product().value, productId);
  assert.equal(app.price().value, '25');
  assert.equal(app.created, 0);
});

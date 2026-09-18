/* eslint-env node */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')
const pinia = require('pinia')
const { createPersistedState } = require('pinia-plugin-persistedstate')

function load(file, dependencies) {
  const exports = {}
  const source = fs.readFileSync(file, 'utf8')
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    { exports, require: (name) => dependencies[name] || require(name) },
  )
  return exports
}
function setup(storage = new Map()) {
  const instance = pinia.createPinia()
  instance.use(
    createPersistedState({
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
      },
    }),
  )
  vue.createApp({}).use(instance)
  const member = vue.reactive({ token: '', profile: undefined })
  const api = load('src/stores/modules/cart.ts', { './member': { useMemberStore: () => member } })
  const cart = api.useCartStore(instance)
  const login = (id) => {
    member.profile = { id }
    member.token = 'test'
  }
  return { cart, member, login, storage, ...api }
}
const product = {
  id: 1,
  name: '龙头',
  description: '',
  price: 0.1,
  image: '/image.png',
  specification: 'A',
  installationIncluded: true,
}

test('login returns to the source tab or existing detail page and rejects external targets', () => {
  const source = fs
    .readFileSync('src/pages/login/login.vue', 'utf8')
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  let onLoad
  const calls = []
  const exports = {}
  vm.runInNewContext(
    ts.transpileModule(source + '\nexport { returnAfterLogin }', {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    {
      exports,
      require: (name) => {
        if (name === 'vue') return vue
        if (name === '@dcloudio/uni-app')
          return {
            onLoad: (callback) => {
              onLoad = callback
            },
          }
        if (name === '@/stores') return { useMemberStore: () => ({}) }
        if (name === '@/api/user') return {}
        throw new Error(name)
      },
      uni: {
        switchTab: ({ url }) => calls.push(url),
        navigateBack: () => calls.push('back'),
      },
    },
  )
  onLoad({ returnTo: 'https://example.com' })
  exports.returnAfterLogin()
  assert.equal(calls.pop(), '/pages/my/my')
  onLoad({ returnTo: encodeURIComponent('/pages/cart/cart') })
  exports.returnAfterLogin()
  assert.equal(calls.pop(), '/pages/cart/cart')
  onLoad({ returnTo: encodeURIComponent('/pages/productDetail/productDetail?id=1') })
  exports.returnAfterLogin()
  assert.equal(calls.pop(), 'back')
})

test('guest cannot add; matching specifications merge and different specifications stay separate', () => {
  const { cart, login } = setup()
  assert.equal(cart.addItem(product), false)
  login(1)
  cart.addItem(product)
  cart.addItem(product)
  cart.addItem({ ...product, specification: 'B' })
  assert.equal(cart.items.length, 2)
  assert.equal(cart.items[0].quantity, 2)
  assert.equal(cart.totalCount, 3)
  assert.equal(cart.allSelected, true)
  assert.equal(cart.selectedTotal, '0.30')
})
test('quantity minimum, selection, removal and exact cents totals', () => {
  const { cart, login, cartItemKey } = setup()
  login(1)
  cart.addItem(product)
  cart.addItem({ ...product, id: 2, price: 0.2 })
  const key = cartItemKey(product)
  cart.setQuantity(key, 0)
  cart.setQuantity(key, 1.5)
  assert.equal(cart.items[0].quantity, 1)
  cart.setQuantity(key, 3)
  assert.equal(cart.selectedTotal, '0.50')
  cart.setSelected(key, false)
  assert.equal(cart.totalCount, 4)
  assert.equal(cart.selectedCount, 1)
  assert.equal(cart.allSelected, false)
  cart.selectAll(false)
  assert.equal(cart.prepareCheckout(), false)
  cart.selectAll(true)
  assert.equal(cart.selectedCount, 4)
  cart.removeItem(key)
  assert.equal(cart.totalCount, 1)
  cart.removeItem(cartItemKey({ ...product, id: 2 }))
  assert.equal(cart.allSelected, false)
})
test('checkout snapshot contains only selected items; buy now does not change cart', () => {
  const { cart, login, cartItemKey } = setup()
  login(1)
  cart.addItem(product)
  cart.addItem({ ...product, id: 2 })
  cart.setSelected(cartItemKey({ ...product, id: 2 }), false)
  assert.equal(cart.prepareCheckout(), true)
  assert.equal(cart.checkoutItems.length, 1)
  cart.setQuantity(cartItemKey(product), 5)
  assert.equal(cart.checkoutItems[0].quantity, 1)
  assert.equal(cart.checkoutTotal, '0.10')
  cart.prepareCheckout({ ...product, id: 3, price: 10.01 })
  assert.equal(cart.totalCount, 6)
  assert.equal(cart.checkoutItems[0].id, 3)
  assert.equal(cart.checkoutTotal, '10.01')
  cart.clearCheckout()
  assert.equal(cart.checkoutItems.length, 0)
})
test('account isolation, logout hiding, persistence and non-persisted checkout', async () => {
  const first = setup()
  first.login(1)
  first.cart.addItem(product)
  first.cart.prepareCheckout()
  first.login(2)
  assert.equal(first.cart.totalCount, 0)
  assert.equal(first.cart.checkoutItems.length, 0)
  first.cart.addItem({ ...product, id: 2 })
  first.member.token = ''
  assert.equal(first.cart.totalCount, 0)
  first.login(1)
  assert.equal(first.cart.items[0].id, 1)
  first.cart.prepareCheckout()
  await vue.nextTick()
  first.cart.$persist()
  const second = setup(first.storage)
  second.login(1)
  assert.equal(second.cart.totalCount, 1)
  assert.equal(second.cart.checkoutItems.length, 0)
  second.login(2)
  assert.equal(second.cart.items[0].id, 2)
})
test('badge boundaries and login redirect without automatic add', () => {
  const { cart, login } = setup()
  const calls = []
  const exports = {}
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/utils/cart-access.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require: () => ({ useCartStore: () => cart }),
      uni: {
        setTabBarBadge: (data) => calls.push(data.text),
        removeTabBarBadge: () => calls.push('hidden'),
        showToast: () => {},
        navigateTo: (data) => {
          calls.push(data.url)
          data.complete()
        },
      },
    },
  )
  for (const count of [0, 1, 99, 100]) exports.syncCartBadge(count)
  assert.deepEqual(calls, ['hidden', '1', '99', '99+'])
  const url = '/pages/productDetail/productDetail?id=1'
  assert.equal(exports.requireCartLogin(url), false)
  assert.equal(calls.at(-1), '/pages/login/login?returnTo=' + encodeURIComponent(url))
  login(1)
  assert.equal(exports.requireCartLogin(url), true)
  assert.equal(cart.totalCount, 0)
})

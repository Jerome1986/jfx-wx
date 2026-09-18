/* eslint-env node */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')
const path = require('node:path')

// 执行真实页面逻辑，仅隔离网络与小程序生命周期。
function setup(categories = []) {
  const calls = []
  const hooks = {}
  const navigation = []
  let categoryResult = { code: 200, data: categories }
  const api = {
    productCategory: async () => categoryResult,
    getCategoryProducts: (id, params) =>
      new Promise((resolve, reject) => {
        calls.push({ id, ...params, resolve, reject })
      }),
  }
  let source = fs
    .readFileSync(path.join(__dirname, '../src/pages/product/product.vue'), 'utf8')
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  source +=
    '\nexport { categoryGroups, categoryFailed, categoryLoading, products, activeCategory, expandedGroup, productLoading, productFailed, pageNum, hasMore, selectGroup, selectCategory, loadCategories, loadProducts, loadMore, openDetail }'
  const exports = {}
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    {
      exports,
      console: { error() {}, log() {} },
      uni: { navigateTo: (value) => navigation.push(value.url) },
      require: (name) => {
        if (name === 'vue') return vue
        if (name === '@/api/product') return api
        if (name === '@/utils/cart-access')
          return { requireCartLogin: () => true, syncCartBadge() {} }
        if (name === '@/stores/modules/cart') return { useCartStore: () => ({ totalCount: 0 }) }
        if (name === '@dcloudio/uni-app')
          return {
            onShow() {},
            onLoad: (fn) => {
              hooks.load = fn
            },
            onUnload: (fn) => {
              hooks.unload = fn
            },
          }
        throw new Error(name)
      },
    },
  )
  return {
    ...exports,
    calls,
    hooks,
    navigation,
    setCategoryResult: (value) => {
      categoryResult = value
    },
  }
}
const flush = () => new Promise((resolve) => setImmediate(resolve))
const item = (id) => ({
  id,
  name: `商品${id}`,
  description: null,
  price: '12.50',
  mainImage: '/product.png',
})
const page = (items, totalPage = 1) => ({ code: 200, data: { list: items, totalPage } })

test('分类默认选择、禁用过滤、同名 ID、折叠与无子分类', async () => {
  const app = setup([
    { id: 1, name: '隐藏', isEnabled: false },
    {
      id: 2,
      name: '分类',
      isEnabled: true,
      children: [
        { id: 10, name: '隐藏', isEnabled: false },
        { id: 12, name: '同名', isEnabled: true },
        { id: 13, name: '同名', isEnabled: true },
      ],
    },
    { id: 3, name: '分类', isEnabled: true },
  ])
  app.hooks.load()
  await flush()
  assert.equal(app.categoryGroups.value.length, 2)
  assert.equal(app.categoryGroups.value[0].children.length, 2)
  assert.equal(app.calls[0].id, 12)
  assert.equal(app.calls[0].pageSize, 20)
  app.selectGroup(app.categoryGroups.value[0])
  assert.equal(app.expandedGroup.value, null)
  assert.equal(app.activeCategory.value, 12)
  assert.equal(app.calls.length, 1)
  app.selectCategory(13)
  assert.equal(app.calls[1].id, 13)
  app.selectGroup(app.categoryGroups.value[1])
  assert.equal(app.calls[2].id, 3)
})

test('快速切换忽略旧成功和旧失败响应，卸载后不更新', async () => {
  const app = setup()
  app.selectCategory(12)
  app.selectCategory(13)
  app.calls[0].resolve(page([item(1)]))
  await flush()
  assert.equal(app.products.value.length, 0)
  assert.equal(app.productLoading.value, true)
  app.selectCategory(14)
  app.calls[1].reject(new Error('旧请求失败'))
  await flush()
  assert.equal(app.productFailed.value, false)
  app.calls[2].resolve(page([item(3)]))
  await flush()
  assert.equal(app.products.value[0].id, 3)
  app.selectCategory(15)
  app.hooks.unload()
  app.calls[3].resolve(page([item(4)]))
  await flush()
  assert.equal(app.products.value.length, 0)
})

test('分页失败保留数据并重试原页，防重复触底、去重与末页停止', async () => {
  const app = setup()
  app.selectCategory(12)
  app.loadMore()
  assert.equal(app.calls.length, 1)
  app.calls[0].resolve(page([item(1)], 2))
  await flush()
  assert.equal(app.products.value[0].price, 12.5)
  assert.equal(app.products.value[0].description, '')
  assert.equal(app.products.value[0].image, '/product.png')
  app.openDetail(app.products.value[0])
  assert.equal(app.navigation[0], '/pages/productDetail/productDetail?id=1')
  app.loadMore()
  app.calls[1].resolve({ code: 400, message: '业务失败' })
  await flush()
  assert.equal(app.productFailed.value, true)
  assert.equal(app.products.value.length, 1)
  assert.equal(app.pageNum.value, 1)
  app.loadMore()
  assert.equal(app.calls.length, 2)
  app.loadProducts()
  assert.equal(app.calls[2].pageNum, 2)
  app.calls[2].resolve(page([item(1), { ...item(2), price: 20 }], 2))
  await flush()
  assert.equal(app.products.value.length, 2)
  assert.equal(app.products.value[1].price, 20)
  app.loadMore()
  assert.equal(app.calls.length, 3)
  app.selectCategory(13)
  assert.equal(app.calls[3].pageNum, 1)
  assert.equal(app.products.value.length, 0)
})

test('分类业务失败可重试，空分类不查询商品，商品网络失败与空结果', async () => {
  const app = setup()
  app.setCategoryResult({ code: 400, message: '失败' })
  await app.loadCategories()
  assert.equal(app.categoryFailed.value, true)
  app.setCategoryResult({ code: 200, data: [] })
  await app.loadCategories()
  assert.equal(app.categoryFailed.value, false)
  assert.equal(app.calls.length, 0)
  app.selectCategory(12)
  app.calls[0].reject(new Error('网络失败'))
  await flush()
  assert.equal(app.productFailed.value, true)
  app.loadProducts()
  assert.equal(app.calls[1].pageNum, 1)
  app.calls[1].resolve(page([], 0))
  await flush()
  assert.equal(app.productFailed.value, false)
  assert.equal(app.products.value.length, 0)
  assert.equal(app.hasMore.value, false)
})

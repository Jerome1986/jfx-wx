const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const display = require('./load-product-display.cjs')
const api = {}
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('src/utils/product-check.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  {
    exports: api,
    require: (name) => {
      if (name === '@/utils/product-display') return display
      return {}
    },
  },
)
const sku = (id, price, extra = {}) => ({
  id,
  price,
  name: `规格${id}`,
  stock: 5,
  isEnabled: true,
  ...extra,
})
test('列表仅取启用 SKU 价格，忽略旧价格，并区分同价、多价和无报价', () => {
  assert.equal(
    display.productPriceText({
      price: 999,
      skus: [sku(1, '10'), sku(2, 20), sku(3, 1, { isEnabled: false })],
    }),
    '¥10.00起',
  )
  assert.equal(display.productPriceText({ skus: [sku(1, '10'), sku(2, 10)] }), '¥10.00')
  assert.equal(display.productPriceText({ skus: [sku(1, 0)] }), '¥0.00')
  for (const price of [null, undefined, '', 'bad', -1]) {
    assert.equal(display.productPriceText({ skus: [sku(1, price)] }), '暂无报价')
  }
  assert.equal(display.productPriceText({ skus: [] }), '暂无报价')
  assert.equal(
    display.productPriceText({ skus: [sku(1, 1, { deletedAt: '2026-10-21' })] }),
    '暂无报价',
  )
})
test('购买按 SKU 校验库存和有效性，旧购物车不能以旧价格下单', () => {
  const product = {
    isPublished: true,
    skus: [sku(1, '20'), sku(2, '30', { stock: 1 }), sku(3, 1, { isEnabled: false })],
  }
  assert.equal(api.productIssue(product, 1, 5), '')
  assert.match(api.productIssue(product, 2, 2), /库存不足/)
  assert.match(api.productIssue(product, 3, 1), /失效/)
  assert.match(api.productIssue(product, undefined, 1), /重新选择/)
  assert.match(api.productIssue({ ...product, isPublished: false }, 1, 1), /下架/)
})

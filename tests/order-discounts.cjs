/* eslint-env node */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const vm = require('node:vm')
const api = {}
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('src/utils/order-discounts.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: api },
)
const now = Date.parse('2026-09-19T00:00:00Z')
const coupon = {
  id: 1,
  status: 'AVAILABLE',
  expiresAt: '2026-10-01T00:00:00Z',
  coupon: {
    amount: '20.01',
    threshold: '100.00',
    status: 'PUBLISHED',
    scopeType: 'ALL',
    validFrom: '2026-09-01T00:00:00Z',
    validTo: '2026-10-01T00:00:00Z',
  },
}
test('coupon threshold uses eligible subtotal; discount never exceeds subtotal', () => {
  assert.equal(api.evaluateCoupon(coupon, 9999, now).discountCents, 0)
  assert.equal(api.evaluateCoupon(coupon, 10000, now).discountCents, 2001)
  const noThreshold = { ...coupon, coupon: { ...coupon.coupon, threshold: 0 } }
  assert.equal(api.evaluateCoupon(noThreshold, 500, now).discountCents, 500)
  assert.equal(api.evaluateCoupon(noThreshold, 0, now).discountCents, 0)
})
test('scope ignores scopeIds; only all and product coupons apply', () => {
  for (const scopeType of ['ALL', 'PRODUCT', 'RENOVATION']) {
    const record = { ...coupon, coupon: { ...coupon.coupon, scopeType, scopeIds: [999] } }
    assert.equal(
      api.evaluateCoupon(record, 10000, now).discountCents,
      scopeType === 'RENOVATION' ? 0 : 2001,
    )
  }
})
test('points use one yuan each after coupon; toggling off restores the amount', () => {
  const enabled = api.calculateDiscounts(10000, 2001, 5, true)
  assert.equal(enabled.pointsDiscount, 500)
  assert.equal(enabled.payableCents, 7499)
  assert.equal(api.calculateDiscounts(10000, 2001, 5, false).payableCents, 7999)
  assert.equal(api.calculateDiscounts(10000, 2001, 500, true).payableCents, 99)
  assert.equal(api.calculateDiscounts(100, 500, 5, true).pointsDiscount, 0)
  assert.equal(api.calculateDiscounts(199, 0, 2, true).pointsDiscount, 100)
  assert.equal(api.calculateDiscounts(1000, 0, 0, true).payableCents, 1000)
})
test('used, invalid, expired, unpublished and future coupons cannot discount', () => {
  for (const status of ['USED', 'INVALID', 'EXPIRED']) {
    assert.equal(api.evaluateCoupon({ ...coupon, status }, 10000, now).discountCents, 0)
  }
  for (const patch of [
    { status: 'DISABLED' },
    { validFrom: '2026-10-01' },
    { validTo: '2026-09-19T00:00:00Z' },
  ]) {
    assert.equal(
      api.evaluateCoupon({ ...coupon, coupon: { ...coupon.coupon, ...patch } }, 10000, now)
        .discountCents,
      0,
    )
  }
  assert.equal(
    api.evaluateCoupon({ ...coupon, expiresAt: '2026-09-19T00:00:00Z' }, 10000, now).discountCents,
    0,
  )
})

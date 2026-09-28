/* eslint-env node */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')

function setup() {
  const calls = {
    orders: [],
    payments: [],
    toasts: [],
    refreshed: 0,
    redirects: [],
    navigations: [],
  }
  const member = vue.reactive({
    profile: { id: 1, points: 5, userCoupons: [] },
    setProfile(value) {
      this.profile = value
    },
  })
  const cart = vue.reactive({
    userId: '1',
    checkoutTotal: '20.50',
    checkoutItems: [{ id: 2, quantity: 3, specification: 'A', installationIncluded: true }],
    clearCheckout() {},
  })
  const address = vue.reactive({
    selectedAddress: {
      name: '张三',
      phone: '13800000000',
      address: '上海市测试路',
      doorplate: '101',
    },
  })
  let paymentError = null
  let orderError = null
  let redirectError = false
  let refreshPending = false
  const params = {
    orderId: 15,
    timeStamp: '1',
    nonceStr: 'nonce',
    packageValue: 'prepay_id=test',
    signType: 'RSA',
    paySign: 'signature',
  }
  const discounts = {}
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/utils/order-discounts.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports: discounts },
  )
  const booking = {}
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/utils/order-booking.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    { exports: booking },
  )
  const checking = vue.ref(false)
  let checkValid = true
  let checkCalls = 0
  const dependencies = {
    '@/utils/product-check': { useProductCheck: () => ({
      checking, notice: vue.ref(''), issues: vue.ref({}),
      refresh: async () => {
        checking.value = true
        checkCalls++
        await Promise.resolve()
        checking.value = false
        return checkValid
      },
    }) },
    '@/utils/order-booking': booking,
    vue,
    pinia: { storeToRefs: vue.toRefs },
    '@dcloudio/uni-app': { onShow() {}, onUnload() {} },
    '@/utils/appointment-access': { canSubmitAppointment: () => true },
    '@/utils/cart-access': { requireCartLogin: () => true },
    '@/stores/modules/cart': { useCartStore: () => cart },
    '@/stores/modules/member': { useMemberStore: () => member },
    '@/stores/modules/address': { useAddressStore: () => address },
    '@/utils/order-discounts': discounts,
    '@/api/order': {
      payOrder: async () => { if (orderError) throw orderError; return { code: 200, data: params } },
      confirmOrder: async (data) => {
        calls.orders.push(data)
        if (orderError) throw orderError
        return { code: 200, data: params }
      },
      requestWechatPayment: async (data) => {
        calls.payments.push(data)
        if (paymentError) throw paymentError
      },
    },
    '@/api/user': {
      userInfoFindOne: async () => {
        calls.refreshed++
        if (refreshPending) return new Promise(() => {})
        return { code: 200, data: { id: 1, realName: '张三', userCoupons: [] } }
      },
      getUserSummary: async () => ({ code: 200, data: { points: 0 } }),
    },
  }
  const source = fs
    .readFileSync('src/pages/confirmOrder/confirmOrder.vue', 'utf8')
    .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const exports = {}
  vm.runInNewContext(
    ts.transpileModule(
      source +
        '\nexport { pay, usePoints, paying, paymentSucceeded, payableAmount, creationUncertain, appointmentDate, appointmentTime, orderRemark, openAppointment, openCreatedOrder, createdOrderId, orderLocked }',
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
    ).outputText,
    {
      exports,
      require: (name) => {
        if (!(name in dependencies)) throw new Error(name)
        return dependencies[name]
      },
      wx: { requestPayment() {} },
      console: { error() {} },
      uni: {
        showToast: ({ title }) => calls.toasts.push(title),
        redirectTo(options) {
          calls.redirects.push(options.url)
          if (redirectError) options.fail()
        },
        navigateTo(options) {
          calls.navigations.push(options)
        },
      },
    },
  )
  exports.appointmentDate.value = '2099-09-25'
  exports.appointmentTime.value = '09:00-12:00'
  return {
    ...exports,
    setCheckValid: value => { checkValid = value },
    getCheckCalls: () => checkCalls,
    params,
    setRedirectError: (value) => {
      redirectError = value
    },
    setRefreshPending: (value) => {
      refreshPending = value
    },
    calls,
    address,
    setPaymentError: (value) => {
      paymentError = value
    },
    setOrderError: (value) => {
      orderError = value
    },
  }
}

test('creates DTO then pays, blocks duplicate clicks and refreshes server user data', async () => {
  const page = setup()
  page.usePoints.value = true
  const first = page.pay()
  await page.pay()
  await first
  assert.equal(page.calls.orders.length, 1)
  const body = page.calls.orders[0]
  assert.equal(body.pointsUsed, 5)
  assert.equal(body.items[0].productId, 2)
  assert.equal(body.items[0].skuDescription, 'A')
  assert.equal(body.serviceAddress, '上海市测试路 101')
  assert.equal('price' in body.items[0], false)
  assert.equal(page.calls.payments.length, 1)
  assert.equal(page.calls.refreshed, 1)
  assert.equal(page.paymentSucceeded.value, true)
  assert.equal(page.payableAmount.value, '15.50')
  await page.pay()
  assert.equal(page.calls.payments.length, 1)
})
test('cancel preserves payment params and retry does not create another order', async () => {
  const page = setup()
  page.setPaymentError({ errMsg: 'requestPayment:fail cancel' })
  await page.pay()
  assert.equal(page.calls.toasts.at(-1), '取消支付')
  assert.equal(page.paymentSucceeded.value, false)
  page.setPaymentError(null)
  await page.pay()
  assert.equal(page.calls.orders.length, 1)
  assert.equal(page.calls.payments.length, 2)
})
test('missing address blocks request; uncertain creation blocks duplicate order', async () => {
  const page = setup()
  page.address.selectedAddress.name = ''
  await page.pay()
  assert.equal(page.calls.orders.length, 0)
  page.address.selectedAddress.name = '张三'
  page.setOrderError(new Error('timeout'))
  await page.pay()
  await page.pay()
  assert.equal(page.calls.orders.length, 1)
  assert.equal(page.calls.payments.length, 0)
  assert.equal(page.creationUncertain.value, true)
})

test('payment adapter maps packageValue to WeChat package without re-signing', async () => {
  const exports = {}
  let actual
  const cleared = []
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/api/order.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require: () => ({
        useCartStore: () => ({ userId: '1', clearCart: (id) => cleared.push(id) }),
      }),
      wx: {
        requestPayment: (options) => {
          actual = options
          options.success()
        },
      },
    },
  )
  await exports.requestWechatPayment({
    timeStamp: '1',
    nonceStr: 'n',
    packageValue: 'prepay_id=x',
    signType: 'RSA',
    paySign: 's',
  })
  assert.equal(actual.package, 'prepay_id=x')
  assert.equal(actual.paySign, 's')
  assert.deepEqual(cleared, ['1'])
})

test('booking is mandatory and separate from user remark', async () => {
  const page = setup()
  page.appointmentDate.value = ''
  await page.pay()
  assert.equal(page.calls.orders.length, 0)
  page.appointmentDate.value = '2099-09-25'
  page.orderRemark.value = '请提前联系'
  await page.pay()
  assert.equal(page.calls.orders[0].appointmentDate, '2099-09-25')
  assert.equal(page.calls.orders[0].timeSlot, '09:00-12:00')
  assert.equal(page.calls.orders[0].remark, '请提前联系')
  assert.equal(
    page.calls.redirects[0],
    '/pages-sub/my/productOrderDetail/productOrderDetail?id=15&confirmPayment=1',
  )
})
test('400 permits correction; malformed response remains uncertain', async () => {
  const page = setup()
  page.setOrderError({ statusCode: 400 })
  await page.pay()
  assert.equal(page.creationUncertain.value, false)
  assert.equal(page.orderLocked.value, false)
  page.setOrderError(null)
  await page.pay()
  assert.equal(page.calls.orders.length, 2)
  assert.equal('remark' in page.calls.orders[1], false)
  const malformed = setup()
  delete malformed.params.orderId
  await malformed.pay()
  assert.equal(malformed.creationUncertain.value, true)
  assert.equal(malformed.calls.payments.length, 0)
})
test('cancel locks booking and retry does not revalidate an expired booking', async () => {
  const page = setup()
  page.openAppointment()
  const selection = page.calls.navigations[0]
  assert.ok(selection.url.includes('appointmentDate=2099-09-25'))
  page.setPaymentError({ errMsg: 'cancel' })
  await page.pay()
  selection.events.appointmentSelected({ appointmentDate: '2099-10-01', timeSlot: '13:00-16:00' })
  assert.equal(page.appointmentDate.value, '2099-09-25')
  page.openAppointment()
  assert.equal(page.calls.navigations.length, 1)
  page.appointmentDate.value = '2000-01-01'
  page.setPaymentError(null)
  await page.pay()
  assert.equal(page.calls.orders.length, 1)
  assert.equal(page.calls.payments.length, 2)
})
test('redirect failure retains order; user refresh does not block navigation', async () => {
  const page = setup()
  page.setRedirectError(true)
  page.setRefreshPending(true)
  await page.pay()
  assert.equal(page.createdOrderId.value, 15)
  assert.equal(page.paymentSucceeded.value, true)
  assert.equal(page.calls.redirects.length, 1)
  page.setRedirectError(false)
  page.openCreatedOrder()
  assert.equal(page.calls.redirects.length, 2)
  assert.equal(page.calls.orders.length, 1)
})

test('payment cancellation and failure preserve the cart', async () => {
  for (const errMsg of ['requestPayment:fail cancel', 'requestPayment:fail']) {
    const exports = {}
    let clears = 0
    vm.runInNewContext(
      ts.transpileModule(fs.readFileSync('src/api/order.ts', 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      }).outputText,
      {
        exports,
        require: () => ({
          useCartStore: () => ({ userId: '1', clearCart: () => clears++ }),
        }),
        wx: { requestPayment: (options) => options.fail({ errMsg }) },
      },
    )
    await assert.rejects(exports.requestWechatPayment({}), (error) => error.errMsg === errMsg)
    assert.equal(clears, 0)
  }
})


test('商品校验失败不下单，已创建订单继续支付不重新校验商品', async () => {
  const page = setup()
  page.setCheckValid(false)
  await page.pay()
  assert.equal(page.calls.orders.length, 0)
  assert.equal(page.creationUncertain.value, false)
  page.setCheckValid(true)
  page.setPaymentError({ errMsg: 'requestPayment:fail cancel' })
  await page.pay()
  const checks = page.getCheckCalls()
  page.setCheckValid(false)
  page.setPaymentError(null)
  await page.pay()
  assert.equal(page.getCheckCalls(), checks)
  assert.equal(page.calls.orders.length, 1)
  assert.equal(page.paymentSucceeded.value, true)
})

test('HTTP 200 的业务失败不能当作 HTTP 400 重新建单', async () => {
  const page = setup()
  page.setOrderError({ statusCode: 200, code: 400, notified: true })
  await page.pay()
  await page.pay()
  assert.equal(page.creationUncertain.value, true)
  assert.equal(page.calls.orders.length, 1)
})


test('继续付款被服务端拒绝时不再调起旧支付参数，转到原订单核对', async () => {
  const page = setup()
  page.setPaymentError({ errMsg: 'requestPayment:fail cancel' })
  await page.pay()
  assert.equal(page.calls.payments.length, 1)
  page.setOrderError({ statusCode: 409, message: '订单已超时' })
  await page.pay()
  assert.equal(page.calls.payments.length, 1)
  assert.equal(page.calls.orders.length, 1)
  assert.match(page.calls.redirects[0], /id=15/)
})

/* eslint-env node */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')
const source = fs
  .readFileSync('src/pages-sub/my/productOrderDetail/productOrderDetail.vue', 'utf8')
  .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
function setup(confirm = true) {
  const hooks = {}
  const member = vue.reactive({ profile: { id: 1 } })
  let response = {
    code: 200,
    data: { status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID', items: [], installation: null },
  }
  const actions = []
  let paymentError = null
  let actionResponse = { code: 200, data: { orderId: 15 } }
  let completionCalls = 0
  let modalResult = { confirm: true }
  let completionResponse = { code: 200 }
  let calls = 0
  const booking = {}
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/utils/order-booking.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    { exports: booking },
  )
  const dependencies = {
    vue,
    '@dcloudio/uni-app': Object.fromEntries(
      ['onLoad', 'onShow', 'onHide', 'onUnload'].map((name) => [
        name,
        (fn) => {
          hooks[name] = fn
        },
      ]),
    ),
    '@/stores/modules/member': { useMemberStore: () => member },
    '@/utils/order-booking': booking,
    '@/utils/format': {},
    '@/api/order': {
      payOrder: async (id) => {
        actions.push(['pay', id])
        return actionResponse
      },
      cancelOrder: async (id) => {
        actions.push(['cancel', id])
        return actionResponse
      },
      requestWechatPayment: async () => {
        actions.push(['wechat'])
        if (paymentError) throw paymentError
      },

      confirmOrderCompletion: async () => {
        completionCalls++
        if (typeof completionResponse === 'function') return completionResponse()
        if (completionResponse instanceof Error) throw completionResponse
        return completionResponse
      },
      getUserOrderDetail: async () => {
        calls++
        if (typeof response === 'function') return response()
        if (response instanceof Error) throw response
        return response
      },
    },
  }
  const page = {}
  vm.runInNewContext(
    ts.transpileModule(
      source +
        '\nexport { handlePayOrder, handleCancelOrder, pendingAction, confirmCompletion, submittingCompletion, canConfirmCompletion, loadOrder, refreshPayment, order, config, confirmingPayment, confirmationPaused, primaryAction, loading, errorMessage };',
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
    ).outputText,
    {
      exports: page,
      require: (name) => dependencies[name],
      uni: { showModal: async () => modalResult, showToast() {} },
      setTimeout() {
        throw new Error('Automatic polling is not permitted')
      },
    },
  )
  hooks.onLoad({ id: '15', confirmPayment: confirm ? '1' : '' })
  return {
    ...page,
    actions,
    setPaymentError: (value) => {
      paymentError = value
    },
    setActionResponse: (value) => {
      actionResponse = value
    },
    hooks,
    member,
    calls: () => calls,
    completionCalls: () => completionCalls,
    setModal: (value) => {
      modalResult = value
    },
    setCompletionResponse: (value) => {
      completionResponse = value
    },
    setResponse: (value) => {
      response = value
    },
  }
}
const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}
test('payment redirect queries once; manual refresh confirms payment without clearing detail', async () => {
  const page = setup()
  page.hooks.onShow()
  await flush()
  assert.equal(page.calls(), 1)
  assert.equal(page.confirmingPayment.value, true)
  assert.equal(page.confirmationPaused.value, true)
  assert.equal(page.primaryAction.value, '')
  assert.ok(page.order.value)
  page.setResponse({
    code: 200,
    data: { status: 'PENDING_INSTALLATION', paymentStatus: 'PAID', items: [], installation: null },
  })
  page.refreshPayment()
  assert.ok(page.order.value)
  assert.equal(page.loading.value, false)
  await flush()
  assert.equal(page.calls(), 2)
  assert.equal(page.confirmingPayment.value, false)
})
test('temporary failure stays unconfirmed and manual retry succeeds', async () => {
  const page = setup()
  page.setResponse(new Error('network'))
  page.hooks.onShow()
  await flush()
  assert.equal(page.confirmingPayment.value, true)
  assert.equal(page.confirmationPaused.value, true)
  assert.equal(page.errorMessage.value, '')
  page.setResponse({
    code: 200,
    data: { status: 'REFUNDED', paymentStatus: 'REFUNDED', items: [] },
  })
  page.refreshPayment()
  await flush()
  assert.equal(page.confirmingPayment.value, false)
})
test('401 and 404 stop confirmation and do not render stale order', async () => {
  for (const code of [401, 404]) {
    const page = setup()
    page.setResponse(Object.assign(new Error('blocked'), { statusCode: code }))
    page.hooks.onShow()
    await flush()
    assert.equal(page.confirmingPayment.value, false)
    assert.equal(page.order.value, null)
    assert.ok(page.errorMessage.value)
    page.refreshPayment()
    await flush()
    assert.equal(page.calls(), 1)
  }
})
test('closed payment is shown as closed, not payment failure', async () => {
  const page = setup()
  page.setResponse({ code: 200, data: { status: 'CANCELED', paymentStatus: 'CLOSED', items: [] } })
  page.hooks.onShow()
  await flush()
  assert.equal(page.config.value.title, '订单已关闭')
  assert.equal(page.primaryAction.value, '')
})
test('hidden, unloaded and account-switched pages ignore late responses', async () => {
  for (const action of ['onHide', 'onUnload', 'account']) {
    const page = setup()
    let resolve
    page.setResponse(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    page.hooks.onShow()
    if (action === 'account') page.member.profile.id = 2
    else page.hooks[action]()
    resolve({
      code: 200,
      data: { status: 'PENDING_INSTALLATION', paymentStatus: 'PAID', items: [] },
    })
    await flush()
    assert.equal(page.order.value, null)
    assert.equal(page.loading.value, false)
  }
})
test('normal detail entry does not claim a client-side payment success', async () => {
  const page = setup(false)
  page.hooks.onShow()
  await flush()
  assert.equal(page.calls(), 1)
  assert.equal(page.confirmingPayment.value, false)
  assert.equal(page.config.value.title, '待付款')
})

const pendingOrder = (overrides = {}) => ({
  status: 'PENDING_CONFIRMATION',
  paymentStatus: 'PAID',
  refundAmount: '0.00',
  items: [],
  confirmationDeadlineAt: '2020-01-01T00:00:00Z',
  autoCompletionPaused: true,
  installation: { status: 'COMPLETED', customerConfirmed: false },
  ...overrides,
})
async function pendingPage(overrides = {}) {
  const page = setup(false)
  page.setResponse({ code: 200, data: pendingOrder(overrides) })
  page.hooks.onShow()
  await flush()
  return page
}
test('paused and expired orders still allow customer confirmation; cancellation sends nothing', async () => {
  const page = await pendingPage()
  assert.equal(page.canConfirmCompletion.value, true)
  page.setModal({ confirm: false })
  await page.confirmCompletion()
  assert.equal(page.completionCalls(), 0)
  assert.equal(page.submittingCompletion.value, false)
})
test('confirmation rejects unpaid, refunded, unfinished and already confirmed orders', async () => {
  for (const overrides of [
    { status: 'COMPLETED' },
    { paymentStatus: 'UNPAID' },
    { refundAmount: '0.01' },
    { installation: null },
    { installation: { status: 'IN_SERVICE', customerConfirmed: false } },
    { installation: { status: 'COMPLETED', customerConfirmed: true } },
  ]) {
    const page = await pendingPage(overrides)
    assert.equal(page.canConfirmCompletion.value, false)
    await page.confirmCompletion()
    assert.equal(page.completionCalls(), 0)
  }
})
test('confirmation is single-flight and refreshes the server result', async () => {
  const page = await pendingPage()
  let resolve
  page.setCompletionResponse(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const first = page.confirmCompletion()
  await flush()
  await page.confirmCompletion()
  assert.equal(page.completionCalls(), 1)
  page.setResponse({
    code: 200,
    data: pendingOrder({ status: 'COMPLETED', completionType: 'CUSTOMER_CONFIRMED' }),
  })
  resolve({ code: 200 })
  await first
  assert.equal(page.order.value.status, 'COMPLETED')
  assert.equal(page.submittingCompletion.value, false)
})
test('409 race refreshes automatic completion instead of retaining a confirm button', async () => {
  const page = await pendingPage()
  page.setCompletionResponse(Object.assign(new Error('conflict'), { statusCode: 409 }))
  page.setResponse({
    code: 200,
    data: pendingOrder({ status: 'COMPLETED', completionType: 'AUTO_TIMEOUT' }),
  })
  await page.confirmCompletion()
  assert.equal(page.order.value.completionType, 'AUTO_TIMEOUT')
  assert.equal(page.canConfirmCompletion.value, false)
})
test('account change during confirmation dialog prevents submission', async () => {
  const page = await pendingPage()
  const pending = page.confirmCompletion()
  page.member.profile.id = 2
  await pending
  assert.equal(page.completionCalls(), 0)
})

test('detail payment reuses order and waits for server confirmation', async () => {
  const p = setup(false)
  p.hooks.onShow()
  await p.loadOrder()
  await p.handlePayOrder()
  assert.deepEqual(p.actions, [['pay', 15], ['wechat']])
  assert.equal(p.confirmingPayment.value, true)
  assert.equal(p.order.value.status, 'PENDING_PAYMENT')
  assert.equal(p.pendingAction.value, null)
})
test('detail canceled cashier permits retry and refreshes order', async () => {
  const p = setup(false)
  p.hooks.onShow()
  await p.loadOrder()
  p.setPaymentError({ errMsg: 'requestPayment:fail cancel' })
  await p.handlePayOrder()
  assert.equal(p.confirmingPayment.value, false)
  assert.equal(p.pendingAction.value, null)
  assert.ok(p.calls() >= 2)
})
test('detail payment business failure does not open cashier', async () => {
  const p = setup(false)
  p.hooks.onShow()
  await p.loadOrder()
  p.setActionResponse({ code: 400 })
  await p.handlePayOrder()
  assert.deepEqual(p.actions, [['pay', 15]])
})
test('detail cancellation confirms then reads server state', async () => {
  const p = setup(false)
  p.hooks.onShow()
  await p.loadOrder()
  p.setResponse({ code: 200, data: { status: 'CANCELED', paymentStatus: 'CLOSED', items: [] } })
  await p.handleCancelOrder()
  assert.deepEqual(p.actions, [['cancel', 15]])
  assert.equal(p.order.value.status, 'CANCELED')
})
test('declining cancellation and concurrent clicks do not submit extra actions', async () => {
  const p = setup(false)
  p.hooks.onShow()
  await p.loadOrder()
  p.setModal({ confirm: false })
  await p.handleCancelOrder()
  assert.deepEqual(p.actions, [])
  await Promise.all([p.handlePayOrder(), p.handlePayOrder(), p.handleCancelOrder()])
  assert.deepEqual(p.actions, [['pay', 15], ['wechat']])
})

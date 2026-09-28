/* eslint-env node */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')

function load(file, dependencies = {}, globals = {}, expose = '') {
  let source = fs.readFileSync(file, 'utf8')
  if (file.endsWith('.vue'))
    source = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  const exports = {}
  vm.runInNewContext(
    ts.transpileModule(source + (expose ? '\nexport { ' + expose + ' }' : ''), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    {
      exports,
      console: { log() {}, error() {}, warn() {} },
      ...globals,
      require: (name) => {
        if (name === 'vue') return vue
        if (name in dependencies) return dependencies[name]
        throw new Error('Unexpected dependency: ' + name)
      },
    },
  )
  return exports
}
const deferred = () => {
  let resolve, reject
  const promise = new Promise((a, b) => {
    resolve = a
    reject = b
  })
  return { promise, resolve, reject }
}
const flush = () => new Promise(setImmediate)
const key = (item) => item.id + ':' + item.specification

function httpSetup() {
  let pending
  const notices = [],
    routes = []
  const { request } = load(
    'src/utils/http.ts',
    {},
    {
      uni: {
        addInterceptor() {},
        request(options) {
          pending = options
        },
        showToast: (value) => notices.push(value.title),
        navigateTo: (value) => routes.push(value.url),
      },
    },
  )
  return {
    request,
    notices,
    routes,
    respond: (statusCode, data) => pending.success({ statusCode, data }),
    fail: (error) => pending.fail(error),
  }
}
test('请求层拒绝业务失败并保留真实 HTTP 状态，只提示一次', async () => {
  for (const code of [400, 403, 409, 500]) {
    const app = httpSetup()
    const result = app.request({ url: '/write' })
    app.respond(200, { code, message: '操作失败', data: null })
    await assert.rejects(
      result,
      (error) =>
        error.statusCode === 200 &&
        error.code === code &&
        error.notified &&
        error.data.code === code,
    )
    assert.deepEqual(app.notices, ['操作失败'])
  }
})
test('请求层保留成功包装和无包装搜索结果，网络错误标记已提示', async () => {
  for (const data of [
    { code: 200, data: null },
    { list: [], total: 0 },
  ]) {
    const app = httpSetup(),
      result = app.request({ url: '/read' })
    app.respond(200, data)
    assert.equal(await result, data)
    assert.equal(app.notices.length, 0)
  }
  const app = httpSetup(),
    result = app.request({ url: '/read' })
  app.fail({ errMsg: 'offline' })
  await assert.rejects(result, (error) => error.notified && error.errMsg === 'offline')
})
test('HTTP 参数错误合并消息，失败写入不执行成功分支并释放锁', async () => {
  const app = httpSetup()
  let saved = false,
    locked = true
  const write = async () => {
    try {
      await app.request({ url: '/write' })
      saved = true
    } catch {
    } finally {
      locked = false
    }
  }
  const pending = write()
  app.respond(400, { message: ['姓名必填', '地址必填'] })
  await pending
  assert.equal(saved, false)
  assert.equal(locked, false)
  assert.deepEqual(app.notices, ['姓名必填,地址必填'])
})

const product = (id = 1, extra = {}) => ({
  id,
  name: '商品' + id,
  price: '10',
  mainImage: '/image',
  specifications: ['A', 'B'],
  stock: 5,
  isPublished: true,
  installationIncluded: true,
  ...extra,
})
const item = (id = 1, extra = {}) => ({
  id,
  name: '商品' + id,
  price: 10,
  image: '/image',
  specification: 'A',
  quantity: 1,
  selected: true,
  installationIncluded: true,
  ...extra,
})
function productSetup(items, getDetail) {
  const state = vue.reactive({ owner: '1', items })
  let unload
  const api = load('src/utils/product-check.ts', {
    '@dcloudio/uni-app': {
      onUnload: (fn) => {
        unload = fn
      },
    },
    '@/api/product': { getProductDetail: getDetail },
    '@/stores/modules/cart': { cartItemKey: key },
  })
  return {
    state,
    ...api.useProductCheck(
      () => state.items,
      () => state.owner,
    ),
    productIssue: api.productIssue,
    unload: () => unload(),
  }
}
test('商品检查区分不存在、下架、缺货、规格失效和字段缺失', () => {
  const app = productSetup([], async () => {})
  assert.match(app.productIssue(null, 'A', 1), /不存在/)
  assert.match(app.productIssue(undefined, 'A', 1), /校验失败/)
  assert.match(app.productIssue(product(1, { isPublished: false }), 'A', 1), /下架/)
  assert.match(app.productIssue(product(), 'A', 6), /库存不足/)
  assert.match(app.productIssue(product(), 'C', 1), /规格/)
  assert.match(app.productIssue(product(1, { stock: undefined }), 'A', 1), /信息不完整/)
  assert.equal(app.productIssue(product(), 'A', 5), '')
})
test('同商品多规格去重查询并合计所选数量，失败不删除或减少商品', async () => {
  const calls = []
  const app = productSetup(
    [item(1, { quantity: 3 }), item(1, { specification: 'B', quantity: 3 })],
    async (id) => {
      calls.push(id)
      return { code: 200, data: product(id) }
    },
  )
  assert.equal(await app.refresh(), false)
  assert.deepEqual(calls, [1])
  assert.match(app.issues.value['1:A'], /库存不足/)
  assert.equal(app.state.items.length, 2)
  assert.equal(app.state.items[0].quantity, 3)
  app.state.items[1].selected = false
  assert.equal(await app.refresh(), true)
})
test('价格变化更新金额但本次停止，重新确认后可继续', async () => {
  const app = productSetup([item()], async () => ({
    code: 200,
    data: product(1, { price: '12.50' }),
  }))
  assert.equal(await app.refresh(), false)
  assert.equal(app.state.items[0].price, 12.5)
  assert.match(app.notice.value, /价格已更新/)
  assert.equal(await app.refresh(), true)
})
test('网络失败保留商品并允许重试，不误判下架', async () => {
  let failed = true
  const app = productSetup([item()], async () => {
    if (failed) throw { statusCode: 500 }
    return { code: 200, data: product() }
  })
  assert.equal(await app.refresh(), false)
  assert.match(app.issues.value['1:A'], /校验失败/)
  failed = false
  assert.equal(await app.refresh(), true)
})
test('检查期间选择变化、切换账号或卸载不应用旧价格', async () => {
  for (const change of ['quantity', 'owner', 'unload']) {
    const response = deferred()
    const app = productSetup([item()], () => response.promise)
    const pending = app.refresh()
    if (change === 'quantity') app.state.items[0].quantity++
    if (change === 'owner') app.state.owner = '2'
    if (change === 'unload') app.unload()
    response.resolve({ code: 200, data: product(1, { price: 99 }) })
    assert.equal(await pending, false)
    assert.equal(app.state.items[0].price, 10)
    assert.equal(app.checking.value, false)
  }
})
test('商品请求最多四个并发，重复点击不发起第二轮', async () => {
  let active = 0,
    max = 0
  const app = productSetup(
    Array.from({ length: 9 }, (_, i) => item(i + 1)),
    async (id) => {
      active++
      max = Math.max(max, active)
      await flush()
      active--
      return { code: 200, data: product(id) }
    },
  )
  const pending = app.refresh()
  assert.equal(await app.refresh(), false)
  assert.equal(await pending, true)
  assert.equal(max, 4)
})

function couponsSetup() {
  const hooks = {},
    requests = []
  const member = vue.reactive({
    profile: { id: 1, name: '原姓名', userCoupons: [] },
    token: 'token',
    setProfile(value) {
      this.profile = value
    },
  })
  const page = load(
    'src/pages-sub/my/coupons/coupons.vue',
    {
      '@dcloudio/uni-app': {
        onShow: (fn) => {
          hooks.show = fn
        },
        onUnload: (fn) => {
          hooks.unload = fn
        },
      },
      '@/stores/modules/member': { useMemberStore: () => member },
      '@/utils/order-discounts': load('src/utils/order-discounts.ts'),
      '@/api/user': {
        userInfoFindOne: (id) => {
          const pending = deferred()
          requests.push({ id, ...pending })
          return pending.promise
        },
        getUserSummary: async () => ({ code: 200, data: { couponCount: 2 } }),
      },
    },
    {
      uni: {
        switchTab() {
          throw new Error('刷新失败不能去使用')
        },
      },
    },
    'refreshCoupons, refreshing, refreshFailed, useCoupon, coupons, availableCount, expiringCount, now, activeTab, visibleCoupons',
  )
  return { ...page, member, hooks, requests }
}
test('券页每次显示刷新资料和汇总，空券正常，失败保留旧数据并禁用去使用', async () => {
  const app = couponsSetup()
  const first = app.hooks.show()
  app.requests[0].resolve({ code: 200, data: { id: 1, realName: '姓名', userCoupons: [] } })
  await first
  assert.equal(app.refreshFailed.value, false)
  assert.equal(app.refreshing.value, false)
  assert.equal(app.member.profile.couponCount, 2)
  const second = app.hooks.show()
  app.requests[1].reject(new Error('offline'))
  await second
  assert.equal(app.refreshFailed.value, true)
  app.useCoupon({ id: 1 })
  assert.equal(app.member.profile.name, '姓名')
})
test('券页忽略旧请求及切换账号后的返回', async () => {
  const app = couponsSetup()
  const old = app.refreshCoupons(),
    recent = app.refreshCoupons()
  app.requests[1].resolve({ code: 200, data: { id: 1, realName: '最新', userCoupons: [] } })
  await recent
  app.requests[0].resolve({ code: 200, data: { id: 1, realName: '旧', userCoupons: [] } })
  await old
  assert.equal(app.member.profile.name, '最新')
  const switched = app.refreshCoupons()
  app.member.profile = { id: 2, name: '其他账号', userCoupons: [] }
  app.requests[2].resolve({ code: 200, data: { id: 1, realName: '不应覆盖', userCoupons: [] } })
  await switched
  assert.equal(app.member.profile.name, '其他账号')
})
test('已取消筛选使用服务端分页，快速切换忽略旧结果', async () => {
  const requests = []
  const page = load(
    'src/pages-sub/my/renovationOrder/renovationOrder.vue',
    {
      '@dcloudio/uni-app': { onLoad() {}, onShow() {}, onUnload() {} },
      '@/stores/modules/renovation-business': { projectStatusText: {} },
      '@/api/project': {
        getUserProjectListApi: (params) => {
          const pending = deferred()
          requests.push({ params, ...pending })
          return pending.promise
        },
      },
    },
    {},
    'filters, selectStatus, loadProjects, list, total, pageNum, hasMore',
  )
  assert.equal(
    page.filters.some((item) => item.value === 'CANCELED'),
    true,
  )
  const old = page.loadProjects(true)
  page.selectStatus('CANCELED')
  assert.equal(requests[1].params.status, 'CANCELED')
  requests[1].resolve({
    data: { list: [{ id: 2, status: 'CANCELED' }], total: 11, pageNum: 1, totalPage: 2 },
  })
  await flush()
  requests[0].resolve({ data: { list: [{ id: 1 }], total: 1, pageNum: 1, totalPage: 1 } })
  await old
  assert.equal(page.list.value[0].id, 2)
  assert.equal(page.total.value, 11)
  const next = page.loadProjects()
  assert.equal(requests[2].params.pageNum, 2)
  assert.equal(requests[2].params.status, 'CANCELED')
  requests[2].resolve({ data: { list: [{ id: 3 }], total: 11, pageNum: 2, totalPage: 2 } })
  await next
  assert.equal(page.list.value.length, 2)
  assert.equal(page.hasMore.value, false)
})

test('预约取消的业务冲突也刷新详情，不伪造取消成功', async () => {
  let reads = 0
  const notices = []
  const page = load(
    'src/pages-sub/my/decorationOrderDetail/decorationOrderDetail.vue',
    {
      '@dcloudio/uni-app': { onLoad() {} },
      '@/stores/modules/renovation-business': { appointmentStatusText: {} },
      '@/api/case': {},
      '@/stores': { useMemberStore: () => ({ profile: { id: 7 } }) },
      '@/api/appointment': {
        cancelAppointmentApi: async () => {
          throw { statusCode: 200, code: 409, notified: true }
        },
        getAppointmentDetailApi: async () => {
          reads++
          return { data: { id: 9, type: 'CASE', status: 'COMPLETED' } }
        },
      },
    },
    { uni: { showToast: (value) => notices.push(value.title) } },
    'appointmentId, appointment, submitCancellation, canceling',
  )
  page.appointmentId.value = 9
  page.appointment.value = { id: 9, type: 'CASE', status: 'PENDING_CONTACT' }
  await page.submitCancellation()
  assert.equal(reads, 1)
  assert.equal(page.appointment.value.status, 'COMPLETED')
  assert.equal(page.canceling.value, false)
  assert.equal(notices.includes('预约已取消'), false)
})

test('券列表按领券有效期展示，停用券可用，草稿和占用券不可用', () => {
  const app = couponsSetup()
  const record = {
    id: 1,
    orderId: null,
    status: 'AVAILABLE',
    expiresAt: '2026-10-01T00:00:00Z',
    coupon: {
      name: '优惠券',
      amount: 20,
      threshold: 100,
      scopeType: 'ALL',
      status: 'DISABLED',
      validFrom: '2026-09-01T00:00:00Z',
      validTo: '2026-09-10T00:00:00Z',
    },
  }
  app.now.value = Date.parse('2026-09-28T00:00:00Z')
  app.member.profile.userCoupons = [
    record,
    { ...record, id: 2, orderId: 9 },
    { ...record, id: 3, coupon: { ...record.coupon, status: 'DRAFT' } },
  ]
  assert.equal(app.coupons.value[0].usable, true)
  assert.equal(app.coupons.value[0].expiry, '2026-10-01')
  assert.equal(app.coupons.value[1].statusLabel, '已占用')
  assert.equal(app.coupons.value[2].usable, false)
  assert.equal(app.availableCount.value, 1)
  assert.equal(app.expiringCount.value, 1)
})

test('可用券分组与数量一致，未生效及占用券列入不可用并保留原因', () => {
  const app = couponsSetup()
  app.now.value = Date.parse('2026-09-28T00:00:00Z')
  const coupon = {
    name: '优惠券',
    amount: 20,
    threshold: 100,
    scopeType: 'ALL',
    status: 'DISABLED',
    validFrom: '2026-09-01T00:00:00Z',
    validTo: '2026-09-10T00:00:00Z',
  }
  const record = {
    id: 1,
    orderId: null,
    status: 'AVAILABLE',
    expiresAt: '2026-10-01T00:00:00Z',
    coupon,
  }
  app.member.profile.userCoupons = [
    record,
    { ...record, id: 2 },
    { ...record, id: 3, orderId: 9 },
    { ...record, id: 4, coupon: { ...coupon, validFrom: '2026-10-01T00:00:00Z' } },
    { ...record, id: 5, status: 'USED' },
  ]
  assert.equal(app.availableCount.value, 2)
  assert.equal(app.visibleCoupons.value.length, 2)
  app.activeTab.value = 'unavailable'
  assert.equal(app.visibleCoupons.value.length, 3)
  assert.deepEqual(
    Array.from(app.visibleCoupons.value, (item) => item.statusLabel),
    ['已占用', '未生效', '已使用'],
  )
  assert.equal(
    app.visibleCoupons.value.some((item) => item.usable),
    false,
  )
})

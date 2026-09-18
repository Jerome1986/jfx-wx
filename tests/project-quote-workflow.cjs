/* eslint-env node */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')
const root = path.resolve(__dirname, '..')

// 在隔离环境执行真实 TS/页面脚本，仅替换平台和网络边界。
function load(file, mocks = {}, globals = {}, expose = '') {
  let source = fs.readFileSync(path.join(root, file), 'utf8')
  if (file.endsWith('.vue'))
    source = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  if (expose) source += `\nexport { ${expose} }`
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const exports = {}
  vm.runInNewContext(
    output,
    {
      exports,
      Error,
      console: { log() {}, error() {} },
      require: (name) => {
        if (name in mocks) return mocks[name]
        if (name === 'vue') return vue
        if (name.endsWith('.vue')) return {}
        if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, mocks, globals)
        throw new Error(`Unexpected dependency: ${name}`)
      },
      ...globals,
    },
    { filename: file },
  )
  return exports
}
const utils = load('src/utils/project-quote.ts')
test('预约权限按实时账号角色判断，员工提示拦截，客户及未登录交由原流程处理', () => {
  const member = { profile: { role: 'EMPLOYEE' } }
  const notices = []
  const access = load(
    'src/utils/appointment-access.ts',
    { '@/stores': { useMemberStore: () => member } },
    { uni: { showToast: (options) => notices.push(options.title) } },
  )
  assert.equal(access.canSubmitAppointment(), false)
  assert.deepEqual(notices, ['员工账号暂不支持提交预约'])
  member.profile.role = 'CUSTOMER'
  assert.equal(access.canSubmitAppointment(), true)
  member.profile = undefined
  assert.equal(access.canSubmitAppointment(), true)
  assert.equal(notices.length, 1)
})
for (const file of [
  'src/pages/caseList/caseList.vue',
  'src/pages-sub/my/favorites/favorites.vue',
]) {
  test(`${file} 员工从普通客户入口点击预约仍提示且不请求`, async () => {
    const notices = []
    const page = load(
      file,
      {
        '@dcloudio/uni-app': { onLoad() {}, onShareAppMessage() {}, onPullDownRefresh() {} },
        '@/stores': {
          useMemberStore: () => ({ token: 'test', profile: { id: 3, role: 'EMPLOYEE' } }),
        },
        '@/api/case': {},
        '@/api/favorite': {},
        '@/api/appointment': {
          createCaseAppointmentApi: () => assert.fail('员工不应发送预约请求'),
        },
      },
      { uni: { showToast: (options) => notices.push(options.title) } },
      'requestQuote',
    )
    await page.requestQuote({ id: 9 })
    assert.deepEqual(notices, ['员工账号暂不支持提交预约'])
  })
  test(`${file} 复用真实预约接口、只提交案例ID、防重复并进入案例分组`, async () => {
    const calls = [],
      routes = []
    let finish
    const page = load(
      file,
      {
        '@dcloudio/uni-app': { onLoad() {}, onShareAppMessage() {}, onPullDownRefresh() {} },
        '@/stores': { useMemberStore: () => ({ token: 'test', profile: { id: 3 } }) },
        '@/api/case': {},
        '@/api/favorite': {},
        '@/api/appointment': {
          createCaseAppointmentApi: async (input) => {
            calls.push(input)
            return new Promise((resolve) => {
              finish = resolve
            })
          },
        },
      },
      {
        uni: {
          showToast() {},
          navigateTo: (options) => {
            routes.push(options.url)
            options.complete?.()
          },
        },
      },
      'requestQuote, submittingCaseId, isEmployeeMode',
    )
    const submitting = page.requestQuote({ id: 12 })
    await page.requestQuote({ id: 13 })
    assert.equal(calls.length, 1)
    assert.equal(JSON.stringify(calls[0]), '{"caseId":12}')
    assert.equal(page.submittingCaseId.value, 12)
    finish({ code: 200, data: { appointmentId: 8 } })
    await submitting
    assert.equal(routes[0], '/pages-sub/my/decorationOrder/decorationOrder?group=case')
    assert.equal(page.submittingCaseId.value, null)
    page.isEmployeeMode.value = true
    await page.requestQuote({ id: 12 })
    assert.equal(calls.length, 1)
  })
  test(`${file} 重复预约409不跳转且恢复按钮`, async () => {
    let navigations = 0
    const page = load(
      file,
      {
        '@dcloudio/uni-app': { onLoad() {}, onShareAppMessage() {}, onPullDownRefresh() {} },
        '@/stores': { useMemberStore: () => ({ token: 'test', profile: { id: 3 } }) },
        '@/api/case': {},
        '@/api/favorite': {},
        '@/api/appointment': {
          createCaseAppointmentApi: async () => {
            throw { statusCode: 409 }
          },
        },
      },
      {
        uni: {
          showToast() {},
          navigateTo: () => {
            navigations++
          },
        },
      },
      'requestQuote, submittingCaseId',
    )
    await page.requestQuote({ id: 12 })
    assert.equal(navigations, 0)
    assert.equal(page.submittingCaseId.value, null)
  })
}
for (const scenario of ['success', 'conflict', 'network']) {
  test(`真实取消分支 ${scenario}：状态只通过详情刷新，错误不自动重试`, async () => {
    let writes = 0,
      reads = 0,
      resolveRequest
    const projects = vue.reactive({ 7: { id: 7, status: 'PENDING_CONFIRM' } })
    const page = load(
      'src/pages-sub/my/employeeRenovationOrderDetail/employeeRenovationOrderDetail.vue',
      {
        '@dcloudio/uni-app': { onLoad() {}, onShow() {} },
        '@/stores/modules/renovation-business': {
          useRenovationBusinessStore: () => ({
            getProject: (id) => projects[id],
            cacheCreatedProject: (project) => {
              projects[project.id] = project
            },
          }),
        },
        '@/api/project': {
          PROJECT_CANCEL_API_ENABLED: true,
          cancelEmployeeProjectApi: async (id, input) => {
            writes++
            assert.equal(id, 7)
            assert.equal(input.expectedStatus, 'PENDING_CONFIRM')
            await new Promise((resolve) => {
              resolveRequest = resolve
            })
            if (scenario === 'conflict') throw { statusCode: 409 }
            if (scenario === 'network') throw { errMsg: 'network error' }
            return { code: 200 }
          },
          getEmployeeProjectDetailApi: async () => {
            reads++
            return {
              data: {
                id: 7,
                status: scenario === 'success' ? 'CANCELED' : 'IN_SERVICE',
                cancelReason: '客户暂缓',
                canceledByEmployeeId: 3,
              },
            }
          },
        },
      },
      { uni: { showToast() {} } },
      'id, openCancel, submitCancel, cancelVisible, canceling',
    )
    page.id.value = 7
    page.openCancel()
    const input = { reason: '客户暂缓', expectedStatus: 'PENDING_CONFIRM' }
    const saving = page.submitCancel(input)
    await page.submitCancel(input)
    assert.equal(writes, 1)
    assert.equal(projects[7].status, 'PENDING_CONFIRM')
    resolveRequest()
    await saving
    assert.equal(page.canceling.value, false)
    assert.equal(page.cancelVisible.value, scenario === 'network')
    assert.equal(reads, scenario === 'network' ? 0 : 1)
    if (scenario === 'success') {
      assert.equal(projects[7].status, 'CANCELED')
      assert.equal(projects[7].canceledByEmployeeId, 3)
    }
  })
}
test('取消接口未启用时只预览，不请求接口或修改本地项目', async () => {
  let calls = 0
  const messages = []
  const project = { id: 7, status: 'PENDING_CONFIRM' }
  const page = load(
    'src/pages-sub/my/employeeRenovationOrderDetail/employeeRenovationOrderDetail.vue',
    {
      '@dcloudio/uni-app': { onLoad() {}, onShow() {} },
      '@/stores/modules/renovation-business': {
        useRenovationBusinessStore: () => ({ getProject: () => project }),
      },
      '@/api/project': {
        PROJECT_CANCEL_API_ENABLED: false,
        cancelEmployeeProjectApi: async () => {
          calls++
        },
      },
    },
    { uni: { showToast: (options) => messages.push(options.title) } },
    'id, openCancel, cancelVisible, submitCancel',
  )
  page.id.value = 7
  page.openCancel()
  assert.equal(page.cancelVisible.value, true)
  await page.submitCancel({ reason: '客户暂缓装修', expectedStatus: 'PENDING_CONFIRM' })
  assert.equal(calls, 0)
  assert.equal(project.status, 'PENDING_CONFIRM')
  assert.equal(page.cancelVisible.value, true)
  assert.equal(messages[0], '取消功能暂未开放，本次未提交')
})
test('创建成功先记录项目再清理草稿，跳转失败只重试导航', async () => {
  let page,
    requests = 0
  const routes = []
  const draft = {
    customerName: '客户',
    mobile: '13800000000',
    serviceAddress: '武汉',
    name: '装修',
    planId: 2,
    quote: {
      discount: '0',
      items: [
        {
          businessCategory: '主材',
          category: 'product',
          name: '地板',
          description: '',
          image: '',
          unit: '平方米',
          unitPrice: '100',
          quantity: '1',
        },
      ],
    },
  }
  const store = vue.reactive({
    projectSources: { 1: { status: 'COMPLETED' } },
    projectDrafts: { 1: draft },
    clearProjectDraft(id) {
      assert.equal(page.createdProjectId.value, 7)
      delete this.projectDrafts[id]
    },
  })
  page = load(
    'src/pages-sub/my/createRenovationProject/createRenovationProject.vue',
    {
      '@dcloudio/uni-app': { onLoad() {} },
      '@/stores/modules/renovation-business': { useRenovationBusinessStore: () => store },
      '@/api/project': {
        createEmployeeProjectApi: async () => {
          requests++
          return { data: { id: 7 } }
        },
      },
    },
    { uni: { redirectTo: (options) => routes.push(options), showToast() {} } },
    'appointmentId, submit, createdProjectId, canCreate, navigating, openCreatedProject',
  )
  page.appointmentId.value = 1
  await page.submit()
  assert.equal(page.canCreate.value, false)
  assert.equal(page.navigating.value, true)
  routes[0].fail()
  assert.equal(page.navigating.value, false)
  await page.submit()
  page.openCreatedProject()
  assert.equal(requests, 1)
  assert.equal(routes.length, 2)
  assert.equal(routes[1].url, routes[0].url)
})
const line = {
  id: 'local',
  source: 'api',
  productId: 10,
  category: 'product',
  businessCategory: '主材',
  name: '地板',
  description: '',
  image: '',
  unit: '平方米',
  unitPrice: '120.00',
  quantity: '25.50',
}
const detail = (version = 1) => ({
  id: 7,
  planId: 2,
  status: 'PENDING_CONFIRM',
  quoteVersion: version,
  quotedAmount: '3060.00',
  quoteItems: [{ ...line, category: '主材', id: 88, projectId: 7, sort: 0 }],
})

test('更新载荷只携带接口白名单字段，保留版本和字符串金额', () => {
  const payload = utils.buildQuoteUpdate(2, 1, ' 调整数量 ', [{ ...line, projectId: 7, sort: 1 }])
  assert.equal(payload.quoteVersion, 1)
  assert.equal(payload.quoteRemark, '调整数量')
  assert.equal(payload.quoteItems[0].quantity, '25.50')
  assert.equal(
    Object.keys(payload.quoteItems[0]).sort().join(','),
    'category,description,image,name,productId,quantity,unit,unitPrice',
  )
  assert.equal(Object.keys(payload).sort().join(','), 'planId,quoteItems,quoteRemark,quoteVersion')
})
test('零单价有效，空白备注转为 null', () => {
  assert.equal(utils.buildQuoteUpdate(2, 1, ' ', [{ ...line, unitPrice: '0' }]).quoteRemark, null)
})
for (const change of [
  { quantity: '0' },
  { quantity: '1.001' },
  { unitPrice: '-1' },
  { unitPrice: '0.001' },
  { businessCategory: '' },
]) {
  test(`拒绝不合法明细 ${JSON.stringify(change)}`, () => {
    assert.throws(() => utils.buildQuoteUpdate(2, 1, '', [{ ...line, ...change }]))
  })
}
test('拒绝空明细、无版本和超长备注', () => {
  assert.throws(() => utils.buildQuoteUpdate(2, 1, '', []))
  assert.throws(() => utils.buildQuoteUpdate(2, undefined, '', [line]))
  assert.throws(() => utils.buildQuoteUpdate(2, 1, '字'.repeat(501), [line]))
})
test('预览总额在汇总后舍入，不逐项舍入累加', () => {
  assert.equal(
    utils.quoteTotals({
      discount: '0',
      items: [line, line].map((item) => ({ ...item, unitPrice: '0.01', quantity: '0.50' })),
    }).total,
    1,
  )
})

function pageHarness(employee, api) {
  const projects = vue.reactive({})
  const shows = []
  const navigation = []
  const store = {
    getProject: (id) => projects[id],
    cacheCreatedProject: (project) => {
      projects[project.id] = project
    },
    projectDrafts: {},
    projectSources: {},
  }
  const mocks = {
    '@dcloudio/uni-app': { onLoad() {}, onShow: (fn) => shows.push(fn) },
    '@/stores/modules/renovation-business': {
      useRenovationBusinessStore: () => store,
      projectStatusText: {},
    },
    '@/api/project': api,
  }
  const uni = {
    showToast() {},
    showModal: (options) => options.success?.({ confirm: true }),
    navigateBack: (options) => navigation.push(options),
    navigateTo: (options) => navigation.push(options),
  }
  const file = employee
    ? 'src/pages-sub/my/projectQuote/projectQuote.vue'
    : 'src/pages-sub/my/renovationOrderDetail/renovationOrderDetail.vue'
  const expose = employee
    ? 'id, target, loadEditor, editQuote, quoteVersion, saveQuote, editable, conflicted, submitting, addItem, planId'
    : 'id, loadProject, confirmQuote, project, confirming'
  const page = load(file, mocks, { uni }, expose)
  page.id.value = 7
  if (employee) page.target.value = 'edit'
  return { page, navigation, projects }
}
test('员工保存固定进入编辑时版本，阻止重复提交，成功退出编辑', async () => {
  let reads = 0,
    writes = 0,
    submitted
  let resolveSave
  const { page, navigation } = pageHarness(true, {
    getEmployeeProjectDetailApi: async () => ({ data: detail(++reads) }),
    updateEmployeeProjectQuoteApi: async (id, payload) => {
      writes++
      submitted = payload
      return new Promise((resolve) => {
        resolveSave = resolve
      })
    },
  })
  await page.loadEditor()
  page.editQuote.value.items[0].quantity = '30'
  const saving = page.saveQuote()
  await page.saveQuote()
  assert.equal(writes, 1)
  assert.equal(reads, 1)
  assert.equal(submitted.quoteVersion, 1)
  resolveSave({ code: 200, data: detail(2) })
  await saving
  assert.equal(navigation.length, 1)
  assert.equal(page.editable.value, false)
})
for (const statusCode of [400, 403, 404, 409, 500]) {
  test(`员工保存失败 ${statusCode} 保留输入，不跳转、不自动加载新版本`, async () => {
    let reads = 0
    const { page, navigation } = pageHarness(true, {
      getEmployeeProjectDetailApi: async () => {
        reads++
        return { data: detail() }
      },
      updateEmployeeProjectQuoteApi: async () => {
        throw { statusCode }
      },
    })
    await page.loadEditor()
    page.editQuote.value.items[0].quantity = '30'
    await page.saveQuote()
    assert.equal(reads, 1)
    assert.equal(page.editQuote.value.items[0].quantity, '30')
    assert.equal(page.quoteVersion.value, 1)
    assert.equal(page.submitting.value, false)
    assert.equal(navigation.length, 0)
    assert.equal(page.conflicted.value, statusCode === 409)
  })
}
test('客户冲突后刷新展示新报价，但必须再次主动确认', async () => {
  let reads = 0
  const versions = []
  const { page } = pageHarness(false, {
    getProjectDetailApi: async () => ({ data: detail(++reads) }),
    confirmProjectQuoteApi: async (id, version) => {
      versions.push(version)
      if (version === 1) throw { statusCode: 409 }
      return { code: 200 }
    },
  })
  await page.loadProject()
  await page.confirmQuote()
  assert.deepEqual(versions, [1])
  assert.equal(page.project.value.quoteVersion, 2)
  await page.confirmQuote()
  assert.deepEqual(versions, [1, 2])
})
test('接口封装正确传入 PATCH 路径及报价版本', async () => {
  const calls = []
  const api = load('src/api/project.ts', {
    '@/utils/http': {
      request: async (options) => {
        calls.push(options)
        return { code: 200 }
      },
    },
  })
  await api.confirmProjectQuoteApi(7, 2)
  await api.updateEmployeeProjectQuoteApi(7, utils.buildQuoteUpdate(2, 1, '', [line]))
  assert.equal(calls[0].url, '/renovation-project/7/confirm')
  assert.equal(calls[0].data.quoteVersion, 2)
  assert.equal(calls[1].url, '/employee/projects/7/quote')
  assert.equal(calls[1].method, 'PATCH')
})

test('服务中项目不可进入报价编辑，也不会提交更新', async () => {
  let writes = 0
  const { page } = pageHarness(true, {
    getEmployeeProjectDetailApi: async () => ({ data: { ...detail(), status: 'IN_SERVICE' } }),
    updateEmployeeProjectQuoteApi: async () => {
      writes++
    },
  })
  await page.loadEditor()
  await page.saveQuote()
  assert.equal(page.editable.value, false)
  assert.equal(writes, 0)
})
test('添加标准明细保持原方案及编辑版本，不写入项目缓存', async () => {
  const { page, navigation, projects } = pageHarness(true, {
    getEmployeeProjectDetailApi: async () => ({ data: detail(3) }),
  })
  await page.loadEditor()
  page.addItem()
  assert.equal(navigation[0].events.selectQuotePlan, undefined)
  navigation[0].events.selectQuoteItem({ ...line, name: '标准辅材' })
  assert.equal(page.planId.value, 2)
  assert.equal(page.editQuote.value.items.length, 2)
  assert.equal(page.quoteVersion.value, 3)
  assert.equal(Object.keys(projects).length, 0)
  assert.notEqual(page.editQuote.value.items[0].id, page.editQuote.value.items[1].id)
})
test('客户重复点击确认仅提交一次当前页面版本', async () => {
  let writes = 0,
    finish
  const { page } = pageHarness(false, {
    getProjectDetailApi: async () => ({ data: detail(5) }),
    confirmProjectQuoteApi: async (id, version) => {
      assert.equal(version, 5)
      writes++
      return new Promise((resolve) => {
        finish = resolve
      })
    },
  })
  await page.loadProject()
  const confirming = page.confirmQuote()
  await page.confirmQuote()
  assert.equal(writes, 1)
  finish({ code: 200 })
  await confirming
})

test('业务缓存恢复时清除旧演示记录，保留真实预约快照和未提交草稿', () => {
  const pinia = require('pinia')
  pinia.setActivePinia(pinia.createPinia())
  let options
  const { useRenovationBusinessStore } = load('src/stores/modules/renovation-business.ts', {
    pinia: {
      defineStore: (id, setup, config) => {
        options = config
        return pinia.defineStore(id, setup, config)
      },
    },
  })
  const store = useRenovationBusinessStore()
  assert.equal(store.appointments.length, 0)
  store.$patch({
    appointments: [{ id: 1, appointmentNo: 'APT2026080001' }],
    followUps: [{ id: 1 }],
    projects: [{ id: 1, projectNo: 'PRJ2026080001' }],
    projectSources: { 9: { id: 9, status: 'COMPLETED' } },
    projectDrafts: { 9: { name: '未提交的真实草稿' } },
  })
  options.persist.afterRestore({ store })
  assert.equal(store.appointments.length, 0)
  assert.equal(store.followUps.length, 0)
  assert.equal(store.projects.length, 0)
  assert.equal(store.projectSources[9].id, 9)
  assert.equal(store.projectDrafts[9].name, '未提交的真实草稿')
  assert.equal(options.persist.paths.join(','), 'projectSources,projectDrafts')
})

for (const outcome of ['success', 'business-error', 'network-error']) {
  test(`完成装修项目 ${outcome}：只采用后端详情，不伪造完成状态或时间`, async () => {
    const project = vue.reactive({ ...detail(), status: 'IN_SERVICE' })
    const notices = []
    let reads = 0
    const page = load(
      'src/pages-sub/my/employeeRenovationOrderDetail/employeeRenovationOrderDetail.vue',
      {
        '@dcloudio/uni-app': { onLoad() {}, onShow() {} },
        '@/stores/modules/renovation-business': {
          useRenovationBusinessStore: () => ({
            getProject: () => project,
            cacheCreatedProject: (value) => Object.assign(project, value),
          }),
        },
        '@/api/project': {
          completeEmployeeProjectApi: async () => {
            if (outcome === 'network-error') throw new Error('offline')
            return { code: outcome === 'business-error' ? 400 : 200 }
          },
          getEmployeeProjectDetailApi: async () => {
            reads++
            return {
              data: { ...detail(), status: 'COMPLETED', completedAt: '2026-09-18T01:00:00.000Z' },
            }
          },
        },
      },
      {
        uni: {
          showToast: ({ title }) => notices.push(title),
          showModal: ({ success }) => success({ confirm: true }),
        },
      },
      'id, completeProject',
    )
    page.id.value = 7
    await page.completeProject()
    assert.equal(project.status, outcome === 'success' ? 'COMPLETED' : 'IN_SERVICE')
    assert.equal(reads, outcome === 'success' ? 1 : 0)
    assert.equal(notices.includes('项目已完成'), outcome === 'success')
    if (outcome === 'success') assert.equal(project.completedAt, '2026-09-18T01:00:00.000Z')
  })
}

test('返回预约详情后重新查询关联项目，刷新失败时禁止使用旧建项入口', async () => {
  const props = vue.reactive({ appointmentId: 9, refreshVersion: 1 })
  const routes = []
  let response = { id: 9, type: 'CASE', status: 'COMPLETED', project: null }
  let reads = 0
  let fail = false
  const page = load(
    'src/components/AppointmentServiceDetail.vue',
    {
      '@/api/appointment': {
        getAppointmentDetailApi: async () => {
          reads++
          if (fail) throw new Error('offline')
          return { data: response }
        },
      },
      '@/stores/modules/renovation-business': {
        appointmentTypeText: {},
        appointmentStatusText: {},
        useRenovationBusinessStore: () => ({ cacheProjectSource() {} }),
      },
    },
    { defineProps: () => props, uni: { navigateTo: ({ url }) => routes.push(url) } },
    'convertedProject, convert, loadFailed',
  )
  await new Promise(setImmediate)
  assert.equal(reads, 1)
  assert.equal(page.convertedProject.value, null)
  response = { ...response, project: { id: 27 } }
  props.refreshVersion++
  await new Promise(setImmediate)
  await new Promise(setImmediate)
  assert.equal(reads, 2)
  assert.equal(page.convertedProject.value.id, 27)
  page.convert()
  assert.equal(routes[0], '/pages-sub/my/employeeRenovationOrderDetail/employeeRenovationOrderDetail?id=27')
  fail = true
  props.refreshVersion++
  await new Promise(setImmediate)
  await new Promise(setImmediate)
  assert.equal(page.loadFailed.value, true)
  page.convert()
  assert.equal(routes.length, 1)
})

for (const type of ['PLAN', 'BUDGET', 'CASE']) {
  test(`${type} 待处理预约共用取消接口，已完成禁止取消`, async () => {
    let writes = 0
    const page = load('src/pages-sub/my/decorationOrderDetail/decorationOrderDetail.vue', {
      '@dcloudio/uni-app': { onLoad() {} },
      '@/stores/modules/renovation-business': { appointmentStatusText: {} },
      '@/api/appointment': { cancelAppointmentApi: async (id) => {
        assert.equal(id, 9)
        writes++
        return { code: 200, data: { status: 'CANCELED', canceledAt: '2026-09-18' } }
      } },
    }, { uni: { showToast() {} } }, 'appointment, canCancel, submitCancellation')
    for (const status of ['PENDING_CONTACT', 'PENDING_VISIT']) {
      page.appointment.value = { id: 9, type, status }
      assert.equal(page.canCancel.value, true)
      await page.submitCancellation()
      assert.equal(page.appointment.value.status, 'CANCELED')
      assert.equal(page.canCancel.value, false)
    }
    page.appointment.value = { id: 9, type, status: 'COMPLETED' }
    assert.equal(page.canCancel.value, false)
    await page.submitCancellation()
    assert.equal(writes, 2)
  })
}

for (const statusCode of [400, 409, 500]) {
  test(`预约取消失败 ${statusCode} 不伪造成功，状态冲突刷新详情`, async () => {
    let reads = 0
    const notices = []
    const page = load('src/pages-sub/my/decorationOrderDetail/decorationOrderDetail.vue', {
      '@dcloudio/uni-app': { onLoad() {} },
      '@/stores/modules/renovation-business': { appointmentStatusText: {} },
      '@/api/appointment': {
        cancelAppointmentApi: async () => { throw { statusCode } },
        getAppointmentDetailApi: async () => {
          reads++
          return { data: { id: 9, type: 'CASE', status: 'COMPLETED' } }
        },
      },
    }, { uni: { showToast: ({ title }) => notices.push(title) } }, 'appointmentId, appointment, canCancel, submitCancellation, canceling')
    page.appointmentId.value = 9
    page.appointment.value = { id: 9, type: 'CASE', status: 'PENDING_VISIT' }
    await page.submitCancellation()
    assert.equal(reads, statusCode === 500 ? 0 : 1)
    assert.equal(page.appointment.value.status, statusCode === 500 ? 'PENDING_VISIT' : 'COMPLETED')
    assert.equal(page.canceling.value, false)
    assert.equal(notices.includes('预约已取消'), false)
  })
}

test('共用取消接口发送 PATCH 且不携带请求体', async () => {
  const calls = []
  const api = load('src/api/appointment.ts', { '@/utils/http': { request: async options => calls.push(options) } })
  await api.cancelAppointmentApi(9)
  assert.equal(calls[0].url, '/appointment/9/cancel')
  assert.equal(calls[0].method, 'PATCH')
  assert.equal('data' in calls[0], false)
})

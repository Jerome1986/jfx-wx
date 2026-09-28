
const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')

function setup() {
  const source = fs.readFileSync('src/pages-sub/my/performanceCenter/performanceCenter.vue', 'utf8')
    .split('<script setup lang="ts">')[1].split('</script>')[0]
    .replace(/import[\s\S]*?from ['"][^'"]+['"]\s*/g, '')
  const calls = []
  const hooks = {}
  const member = vue.reactive({ profile: { id: 1, role: 'EMPLOYEE' } })
  const context = {
    ...vue, Date, Map, Array, Number,
    useMemberStore: () => member,
    uni: { getSystemInfoSync: () => ({}), navigateBack() {}, navigateTo() {} },
    onShow: fn => { hooks.show = fn },
    onUnload: fn => { hooks.unload = fn },
    getEmployeePerformanceCenter: params => new Promise((resolve, reject) => calls.push({ params, resolve, reject })),
  }
  vm.createContext(context)
  vm.runInContext(ts.transpileModule(source + '\n globalThis.page = { activePeriod, result, projects, pageNum, loading, error, fetchData, selectPeriod, retry, periods, formatDate, formatAmount, showCurrentEmployee };', {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText, context)
  return { page: context.page, calls, hooks, member }
}
const response = (month, pageNum = 1, ids = [1]) => ({ data: {
  month, summary: {}, totals: {}, rankings: [{ employeeId: 21, rank: 1 }],
  currentEmployee: { employeeId: 21, rank: 1 },
  projects: { list: ids.map(id => ({ id })), pageNum, pageSize: 10, totalPage: 2, total: 12 },
} })
const flush = () => new Promise(resolve => setImmediate(resolve))

test('months include current Beijing month and cumulative; latest filter wins', async () => {
  const { page, hooks, calls } = setup()
  hooks.show()
  const current = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 7)
  assert.equal(calls[0].params.month, current)
  assert.equal(page.periods.value.length, 4)
  page.selectPeriod('all')
  calls[1].resolve(response('all'))
  await flush()
  calls[0].resolve(response(current))
  await flush()
  assert.equal(page.result.value.month, 'all')
  assert.equal(page.showCurrentEmployee.value, false)
})
test('pagination prevents duplicate requests, retries same page and deduplicates projects', async () => {
  const { page, hooks, calls } = setup()
  hooks.show()
  calls[0].resolve(response('all'))
  await flush()
  const pending = page.fetchData(true)
  await page.fetchData(true)
  assert.equal(calls.length, 2)
  calls[1].reject(new Error('network'))
  await pending
  assert.equal(page.pageNum.value, 1)
  assert.equal(page.projects.value.length, 1)
  page.retry()
  assert.equal(calls[2].params.pageNum, 2)
  calls[2].resolve(response('all', 2, [1, 2]))
  await flush()
  assert.equal(page.projects.value.length, 2)
  await page.fetchData(true)
  assert.equal(calls.length, 3)
})
test('account changes and unload invalidate outstanding responses', async () => {
  const { page, hooks, calls, member } = setup()
  hooks.show()
  member.profile = { id: 2, role: 'EMPLOYEE' }
  calls[0].resolve(response('all'))
  await flush()
  assert.equal(page.result.value, undefined)
  hooks.show()
  hooks.unload()
  calls[1].resolve(response('all'))
  await flush()
  assert.equal(page.result.value, undefined)
})
test('non-employees do not request data; null dates and zero amounts render correctly', () => {
  const { page, hooks, calls, member } = setup()
  member.profile = { id: 3, role: 'CUSTOMER' }
  hooks.show()
  assert.equal(calls.length, 0)
  assert.equal(page.formatDate(null), '—')
  assert.equal(page.formatDate('2026-09-30T16:00:00Z'), '2026-10-01 已完工')
  assert.equal(page.formatAmount('0.00'), '¥0.00')
})
test('first-page failure can retry and recover', async () => {
  const { page, hooks, calls } = setup()
  hooks.show()
  calls[0].reject(new Error('network'))
  await flush()
  assert.equal(page.error.value, true)
  assert.equal(page.result.value, undefined)
  page.retry()
  assert.equal(calls[1].params.pageNum, 1)
  calls[1].resolve(response('all'))
  await flush()
  assert.equal(page.error.value, false)
  assert.equal(page.loading.value, false)
})

test('switching months retains layout data and retries the first page after failure', async () => {
  const { page, hooks, calls } = setup()
  hooks.show()
  const month = calls[0].params.month
  calls[0].resolve(response(month))
  await flush()
  page.selectPeriod('all')
  assert.equal(page.result.value.month, month)
  assert.equal(page.projects.value.length, 1)
  assert.equal(page.pageNum.value, 0)
  calls[1].reject(new Error('network'))
  await flush()
  assert.equal(page.result.value.month, month)
  page.retry()
  assert.equal(calls[2].params.pageNum, 1)
  assert.equal(calls[2].params.month, 'all')
  calls[2].resolve(response('all', 1, [2]))
  await flush()
  assert.equal(page.result.value.month, 'all')
  assert.equal(page.projects.value.length, 1)
  assert.equal(page.projects.value[0].id, 2)
})

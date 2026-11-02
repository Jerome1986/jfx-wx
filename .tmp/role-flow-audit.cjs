const fs = require('node:fs')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const ts = require('typescript')
const vue = require('vue')
const results = []
const sessions = {}
async function request(path, token, method = 'GET', data) {
  const response = await fetch('http://localhost:3000/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'source-client': 'minimap', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {}),
    signal: AbortSignal.timeout(10000),
  })
  const body = await response.json()
  return { status: response.status, code: body.code, message: body.message, data: body.data }
}
async function probe(role, path, expected = 200) {
  const result = await request(path, sessions[role]?.token)
  const data = result.data
  results.push({ role, path, status: result.status, code: result.code, pass: result.status === expected && (expected !== 200 || result.code === 200), total: data?.total, count: Array.isArray(data) ? data.length : data?.list?.length, keys: data && !Array.isArray(data) ? Object.keys(data) : undefined, message: result.status === 200 ? undefined : result.message })
  return data
}
async function main() {
  for (const role of ['EMPLOYEE', 'CUSTOMER']) {
    const result = await request('/user/dev-login', '', 'POST', { role })
    assert.equal(result.code, 200)
    assert.equal(result.data.user.role, role)
    assert.ok(result.data.token)
    sessions[role] = result.data
    results.push({ role, path: '/user/dev-login', status: result.status, pass: true, userId: result.data.user.id, employeeId: result.data.user.employee?.id })
  }
  for (const role of ['CUSTOMER', 'EMPLOYEE']) {
    const userId = sessions[role].user.id
    for (const path of [`/user/${userId}`, `/user/summary/${userId}`, '/address', `/favorite/user/${userId}`, '/user/scoreSummary', '/order/user?status=ALL&pageNum=1&pageSize=10', '/renovation-project/user?status=ALL&pageNum=1&pageSize=10', '/appointment?type=ALL&pageNum=1&pageSize=10']) {
      const data = await probe(role, path)
      if (role === 'CUSTOMER' && data?.list?.length) {
        if (path.startsWith('/order/')) await probe(role, '/order/detail/' + data.list[0].id)
        if (path.startsWith('/renovation-project/')) await probe(role, '/renovation-project/' + data.list[0].id)
        if (path.startsWith('/appointment?')) await probe(role, '/appointment/detail/' + data.list[0].id)
      }
    }
  }
  const employeeId = sessions.EMPLOYEE.user.id
  for (const path of ['/employee/summary', '/employee/performance/summary', '/employee/performance/center?month=all&pageNum=1&pageSize=10', '/employee/projects?status=ALL&pageNum=1&pageSize=10', `/appointment/assigned?userId=${employeeId}&type=ALL&pageNum=1&pageSize=10`]) {
    const data = await probe('EMPLOYEE', path)
    await probe('CUSTOMER', path, 403)
    await probe('GUEST', path, 401)
    if (data?.list?.length && path.startsWith('/employee/projects?')) {
      await probe('EMPLOYEE', '/employee/projects/' + data.list[0].id)
      await probe('CUSTOMER', '/employee/projects/' + data.list[0].id, 403)
    }
    if (data?.list?.length && path.startsWith('/appointment/assigned')) await probe('EMPLOYEE', '/appointment/detail/' + data.list[0].id)
  }
  await probe('CUSTOMER', '/user/' + employeeId, 403)
  await probe('CUSTOMER', '/user/summary/' + employeeId, 403)
  await probe('CUSTOMER', '/favorite/user/' + employeeId, 403)
  for (const path of ['/address', '/order/user?status=ALL&pageNum=1&pageSize=10', '/renovation-project/user?pageNum=1&pageSize=10']) await probe('GUEST', path, 401)
  await probe('GUEST', '/user/' + employeeId, 401)
  await probe('GUEST', '/user/summary/' + employeeId, 401)
  await probe('GUEST', '/favorite/user/' + employeeId, 401)
  const addressSets = await Promise.all(['CUSTOMER', 'EMPLOYEE', 'GUEST'].map(role => request('/address', sessions[role]?.token)))
  results.push({ scenario: 'address isolation', pass: JSON.stringify(addressSets[0].data) !== JSON.stringify(addressSets[1].data) && addressSets[2].status === 401, sameAddressDataForAllRoles: addressSets.every(result => JSON.stringify(result.data) === JSON.stringify(addressSets[0].data)) })
  for (const role of ['CUSTOMER', 'EMPLOYEE']) {
    const prefix = role === 'CUSTOMER' ? '/renovation-project/user' : '/employee/projects'
    for (const status of ['PENDING_CONFIRM', 'IN_SERVICE', 'COMPLETED', 'CANCELED']) {
      const data = await probe(role, `${prefix}?status=${status}&pageNum=1&pageSize=10`)
      results.push({ scenario: 'project status filter', role, status, pass: Array.isArray(data?.list) && data.list.every(item => item.status === status), count: data?.list?.length })
      for (const item of data?.list || []) {
        await probe(role, (role === 'CUSTOMER' ? '/renovation-project/' : '/employee/projects/') + item.id)
      }
    }
  }
  const employeeSummary = (await request('/employee/summary', sessions.EMPLOYEE.token)).data
  const assigned = (await request(`/appointment/assigned?userId=${employeeId}&type=ALL&pageNum=1&pageSize=50`, sessions.EMPLOYEE.token)).data
  results.push({ scenario: 'employee todo summary matches appointment counts', pass: employeeSummary.pendingContactCount === assigned.statusCounts.PENDING_CONTACT && employeeSummary.pendingVisitCount === assigned.statusCounts.PENDING_VISIT, summary: employeeSummary, appointmentCounts: assigned.statusCounts })
  const allAppointments = await probe('CUSTOMER', '/appointment?type=ALL&pageNum=1&pageSize=50')
  for (const item of allAppointments.list) await probe('CUSTOMER', '/appointment/detail/' + item.id)
  for (const type of ['PLAN', 'BUDGET', 'CASE']) {
    const data = await probe('CUSTOMER', `/appointment?type=${type}&pageNum=1&pageSize=50`)
    results.push({ scenario: 'appointment type filter', type, pass: data.list.every(item => item.type === type), count: data.list.length })
  }
  const member = { profile: sessions.CUSTOMER.user, token: sessions.CUSTOMER.token, clearProfile() { this.profile = undefined; this.token = '' }, setProfile(profile) { this.profile = profile }, setToken(token) { this.token = token }, $persist() { this.persisted = this.token } }
  const addresses = { setAddresses(data) { this.data = data } }
  const business = { $patch(data) { Object.assign(this, data) } }
  const routes = []
  let mode = 'live'
  const source = fs.readFileSync('src/pages-sub/my/devDebug/devDebug.vue', 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace('import.meta.env.DEV', 'true') + '\nexport { login, errorMessage, pendingRole }'
  const exports = {}
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, uni: { reLaunch(options) { routes.push(options.url) } },
    require(name) {
      if (name === 'vue') return vue
      if (name === '@dcloudio/uni-app') return { onLoad(callback) { callback() } }
      if (name === '@/stores') return { useMemberStore: () => member, useRenovationBusinessStore: () => business }
      if (name === '@/stores/modules/address') return { useAddressStore: () => addresses }
      if (name === '@/api/dev-login') return { async devLoginApi(role) { if (mode === 'failure') throw new Error('test failure'); if (mode === 'mismatch') return { data: sessions.CUSTOMER }; return request('/user/dev-login', member.token, 'POST', { role }) } }
      throw new Error(name)
    },
  })
  for (const role of ['EMPLOYEE', 'CUSTOMER', 'EMPLOYEE', 'CUSTOMER']) {
    addresses.data = [{ id: 'previous-account' }]
    business.projects = [{ id: 'previous-account' }]
    await exports.login(role)
    assert.equal(member.profile.role, role)
    assert.equal(member.persisted, member.token)
    assert.equal(addresses.data.length, 0)
    assert.equal(business.projects.length, 0)
    assert.equal(routes.at(-1), '/pages/my/my')
    assert.equal(exports.errorMessage.value, '')
    results.push({ scenario: 'execute actual devDebug login script with real API', role, pass: true })
  }
  for (mode of ['failure', 'mismatch']) {
    const previousToken = member.token
    const previousRoutes = routes.length
    await exports.login('EMPLOYEE')
    assert.equal(member.token, previousToken)
    assert.equal(routes.length, previousRoutes)
    assert.ok(exports.errorMessage.value)
    assert.equal(exports.pendingRole.value, '')
    results.push({ scenario: 'devDebug ' + mode + ' preserves session and releases button', pass: true })
  }
  fs.writeFileSync('.tmp/role-flow-audit-results.json', JSON.stringify({ date: new Date().toISOString(), results }, null, 2))
  console.log(JSON.stringify(results, null, 2))
  console.log('CHECKS', results.length, 'PASSED', results.filter(result => result.pass).length)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })

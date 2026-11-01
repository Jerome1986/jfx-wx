const path = require('node:path')
const assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const root = path.resolve(__dirname, '../../jfx-api')
const req = createRequire(path.join(root, 'package.json'))
req('ts-node').register({ project: path.join(root, 'tsconfig.json'), transpileOnly: true, experimentalResolver: true })
req('tsconfig-paths').register({ baseUrl: root, paths: { 'src/*': ['src/*'] } })
const { PrismaService } = req('./src/prisma/prisma.service.ts')
const { RenovationProjectRepository } = req('./src/renovation-project/renovation-project.repository.ts')
const { EmployeeRepository } = req('./src/employee/employee.repository.ts')
const { Prisma } = req('./generated/prisma/client.ts')
const db = new PrismaService()
async function main() {
  if (process.argv.includes('--schema')) {
    const rows = await db.$queryRaw`SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND ((TABLE_NAME = 'renovation_project' AND COLUMN_NAME IN ('coupon_discount', 'coupon_snapshot', 'coupon_returned_at')) OR (TABLE_NAME = 'user_coupon' AND COLUMN_NAME = 'project_id'))`
    console.log(JSON.stringify(rows))
    return
  }
  const rollback = new Error('ROLLBACK_TEST_FIXTURES')
  try {
    await db.$transaction(async tx => {
      const user = await tx.user.findFirst({ select: { id: true } })
      const employee = await tx.employee.findFirst({ select: { id: true } })
      assert.ok(user && employee, 'Need existing user and employee for rollback-only verification')
      const repository = new RenovationProjectRepository({ $transaction: fn => fn(tx) })
      const employeeRepo = new EmployeeRepository({ $transaction: fn => fn(tx) })
      let index = 0
      const now = Date.now()
      const future = new Date(now + 86400000)
      const past = new Date(now - 86400000)
      const newProject = (amount = 100) => tx.renovationProject.create({ data: {
        projectNo: `coupon-test-${now}-${++index}`, userId: user.id, employeeId: employee.id,
        name: 'Rollback coupon test', customerName: 'test', mobile: 'test', serviceAddress: 'test',
        quotedAmount: amount, status: 'PENDING_CONFIRM',
      } })
      const newCoupon = async (overrides = {}, recordOverrides = {}) => {
        const coupon = await tx.coupon.create({ data: {
          name: 'Rollback test coupon', amount: 30, threshold: 100, scopeType: 'RENOVATION',
          validFrom: past, validTo: future, totalQuantity: 1, status: 'PUBLISHED', ...overrides,
        } })
        return tx.userCoupon.create({ data: { userId: user.id, couponId: coupon.id, expiresAt: future, ...recordOverrides } })
      }
      const project = await newProject()
      const coupon = await newCoupon()
      const confirmed = await repository.confirmProject(project.id, user.id, project, coupon.id)
      assert.equal(confirmed.contractAmount.toFixed(2), '70.00')
      assert.equal(confirmed.couponDiscount.toFixed(2), '30.00')
      assert.equal(confirmed.couponSnapshot.userCouponId, coupon.id)
      assert.equal((await tx.userCoupon.findUnique({ where: { id: coupon.id } })).status, 'USED')
      const second = await newProject()
      await assert.rejects(() => repository.confirmProject(second.id, user.id, second, coupon.id))
      const canceled = await employeeRepo.cancelProject(project.id, employee.id, { expectedStatus: 'IN_SERVICE', reason: 'test cancellation' })
      assert.ok(canceled.couponReturnedAt)
      assert.equal(canceled.contractAmount.toFixed(2), '70.00')
      const returned = await tx.userCoupon.findUnique({ where: { id: coupon.id } })
      assert.equal(returned.status, 'AVAILABLE')
      assert.equal(returned.projectId, null)
      assert.equal(returned.usedAt, null)
      await repository.confirmProject(second.id, user.id, second, coupon.id)
      await tx.userCoupon.update({ where: { id: coupon.id }, data: { expiresAt: past } })
      await employeeRepo.cancelProject(second.id, employee.id, { expectedStatus: 'IN_SERVICE', reason: 'test expired return' })
      assert.equal((await tx.userCoupon.findUnique({ where: { id: coupon.id } })).status, 'EXPIRED')
      const free = await newProject(10)
      const large = await newCoupon({ amount: 50, threshold: 0, scopeType: 'ALL' })
      assert.equal((await repository.confirmProject(free.id, user.id, free, large.id)).contractAmount.toFixed(2), '0.00')
      const plain = await newProject()
      assert.equal((await repository.confirmProject(plain.id, user.id, plain)).contractAmount.toFixed(2), '100.00')
      for (const [template, record] of [
        [{ threshold: 101 }, {}], [{ scopeType: 'PRODUCT' }, {}], [{ validFrom: future }, {}],
        [{ status: 'DRAFT' }, {}], [{ amount: 0 }, {}], [{}, { expiresAt: past }],
      ]) {
        const p = await newProject()
        const c = await newCoupon(template, record)
        await assert.rejects(() => repository.confirmProject(p.id, user.id, p, c.id))
        assert.equal((await tx.renovationProject.findUnique({ where: { id: p.id } })).status, 'PENDING_CONFIRM')
        assert.equal((await tx.userCoupon.findUnique({ where: { id: c.id } })).projectId, null)
      }
      const stale = await newProject()
      const unclaimed = await newCoupon()
      await tx.renovationProject.update({ where: { id: stale.id }, data: { quoteVersion: 2 } })
      await assert.rejects(() => repository.confirmProject(stale.id, user.id, stale, unclaimed.id))
      assert.equal((await tx.userCoupon.findUnique({ where: { id: unclaimed.id } })).status, 'AVAILABLE')
      console.log('PASS: deduction, snapshot, duplicate rejection, cancellation return/reuse, expired return, cap, no coupon, threshold/scope/date/status, stale quote')
      throw rollback
    }, { timeout: 30000 })
  } catch (error) {
    if (error !== rollback) throw error
    console.log('All database test fixtures rolled back')
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => db.$disconnect())

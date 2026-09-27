/* eslint-env node */
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const cp = require('node:child_process')
const source = ts.transpileModule(fs.readFileSync('src/utils/order-booking.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const helpers = {}
vm.runInNewContext(source, { exports: helpers })
const { validateBooking, orderBookingText, orderInstallationText } = helpers

test('rejects missing, impossible, malformed, crossing-midnight and started booking', () => {
  const now = Date.parse('2026-09-25T09:00:00+08:00')
  for (const [date, slot] of [
    ['', '09:00-12:00'],
    ['2026-09-25', ''],
    ['2026-02-30', '09:00-12:00'],
    ['2026-9-25', '09:00-12:00'],
    ['2026-09-25', '9:00-12:00'],
    ['2026-09-25', '24:00-25:00'],
    ['2026-09-25', '19:00-01:00'],
    ['2026-09-25', '12:00-12:00'],
    ['2026-09-25', '09:00-12:00'],
  ])
    assert.ok(validateBooking(date, slot, now), date + ' ' + slot)
  assert.equal(validateBooking('2026-09-25', '09:01-12:00', now), '')
  assert.equal(validateBooking('2028-02-29', '09:00-12:00', now), '')
})
test('Beijing boundaries and picker roundtrip do not depend on device timezone', () => {
  for (const zone of ['UTC', 'Asia/Shanghai', 'America/Los_Angeles']) {
    const script =
      source +
      `
      const now = Date.parse('2026-12-31T16:00:00Z');
      console.log(JSON.stringify([
        exports.shanghaiCalendarDate(0, now), exports.shanghaiCalendarDate(1, now),
        exports.calendarPickerDate(exports.calendarPickerValue('2027-01-02')),
        exports.formatBeijingTimestamp('2026-12-31T16:00:00Z'),
        exports.validateBooking('2027-01-01', '00:01-01:00', now)
      ]));
    `
    const value = JSON.parse(
      cp.execFileSync(process.execPath, ['-e', script], {
        env: { ...process.env, TZ: zone },
        encoding: 'utf8',
      }),
    )
    assert.deepEqual(value, ['2027-01-01', '2027-01-02', '2027-01-02', '2027-01-01 00:00:00', ''])
  }
})
test('uses complete installation booking or complete order booking, never mixed fields', () => {
  const order = { appointmentDate: '2026-09-25', timeSlot: '09:00-12:00', installation: null }
  assert.equal(orderBookingText(order), '2026-09-25 09:00-12:00')
  assert.notEqual(orderInstallationText(order), '待派单')
  order.installation = {
    appointmentDate: '2026-09-26',
    timeSlot: '13:00-16:00',
    status: 'PENDING_ASSIGNMENT',
  }
  assert.equal(orderBookingText(order), '2026-09-26 13:00-16:00')
  assert.equal(orderInstallationText(order), '待派单')
  order.installation.timeSlot = null
  assert.equal(orderBookingText(order), '2026-09-25 09:00-12:00')
  order.timeSlot = null
  assert.equal(orderBookingText(order), '安装时间待确认')
  assert.equal(orderInstallationText(order), '安装时间待确认')
  order.timeSlot = '09:00-12:00'
  order.installation.status = 'PENDING_APPOINTMENT'
  assert.equal(orderInstallationText(order), '安装时间待确认')
})

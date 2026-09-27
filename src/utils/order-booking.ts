import type { UserProductOrder } from '@/types/product-order'

const DAY = 86400000
const SHANGHAI_OFFSET = 8 * 3600000

/** 日历日期不表示一个时刻；使用 UTC 字段检查真实年月日。 */
export const isCalendarDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T00:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export const shanghaiCalendarDate = (offset = 0, now = Date.now()) =>
  new Date(now + SHANGHAI_OFFSET + offset * DAY).toISOString().slice(0, 10)

/** 日期选择器使用本地午夜作为 UI 载体，不把此时间戳发送给接口。 */
export const calendarPickerValue = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).getTime()
}
export const calendarPickerDate = (value: number) => {
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
}
export const validateBooking = (date: string, slot: string, now = Date.now()) => {
  if (!date || !slot) return '请选择安装日期和时段'
  if (!isCalendarDate(date)) return '安装日期无效，请重新选择'
  if (!/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/.test(slot)) return '安装时段格式错误'
  const [start, end] = slot.split('-')
  if (end <= start) return '安装时段结束须晚于开始，不能跨天'
  if (Date.parse(date + 'T' + start + ':00+08:00') <= now) return '安装时段已开始，请重新选择'
  return ''
}

/** 始终按北京时间展示事件时间，不改变原有 formatTimestamp 的语义。 */
export const formatBeijingTimestamp = (value: string | number | Date, type: 1 | 2 = 2) => {
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (!Number.isFinite(time)) return ''
  const iso = new Date(time + SHANGHAI_OFFSET).toISOString()
  return type === 1 ? iso.slice(0, 10) : iso.slice(0, 19).replace('T', ' ')
}
const completeBooking = (
  value: { appointmentDate: string | null; timeSlot: string | null } | null | undefined,
) => (value?.appointmentDate && value.timeSlot ? value.appointmentDate + ' ' + value.timeSlot : '')
export const orderBookingText = (order: UserProductOrder) =>
  completeBooking(order.installation) || completeBooking(order) || '安装时间待确认'
export const orderInstallationText = (order: UserProductOrder) => {
  if (
    orderBookingText(order) === '安装时间待确认' ||
    order.installation?.status === 'PENDING_APPOINTMENT'
  )
    return '安装时间待确认'
  if (!order.installation) return '安装安排待确认'
  const labels = {
    PENDING_APPOINTMENT: '安装时间待确认',
    PENDING_ASSIGNMENT: '待派单',
    PENDING_VISIT: '待上门',
    IN_SERVICE: '服务中',
    COMPLETED: '已完成',
    CANCELED: '已取消',
  }
  return labels[order.installation.status]
}

/** 截止时间和暂停标记不限制客户主动确认。 */
export const canConfirmOrderCompletion = (order: UserProductOrder) =>
  order.status === 'PENDING_CONFIRMATION' &&
  order.paymentStatus === 'PAID' &&
  Number(order.refundAmount ?? 0) === 0 &&
  order.installation?.status === 'COMPLETED' &&
  order.installation.customerConfirmed === false

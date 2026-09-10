import type { Appointment } from '@/types/renovation-business'

/** 生成最长不超过 64 个字符的预约编号 */
export const createAppointmentNo = (): string => {
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 17)
  const random = Math.random().toString(36).slice(2, 10).toUpperCase()
  return `APT${timestamp}${random}`
}

/**
 * 获取预约的展示标题。
 *
 * 优先使用提交时的快照标题，其次使用需求说明，最后回退到预约类型名称。
 */
export const getAppointmentSummary = (
  appointment: Pick<Appointment, 'snapshot' | 'demand'>,
  appointmentTypeName: string,
) => appointment.snapshot?.title || appointment.demand || `${appointmentTypeName}预约`

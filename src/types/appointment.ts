/** 可预约日期 */
export interface AppointmentDate {
  /** 页面展示文案 */
  label: string
  /** 日期短文本 */
  date: string
  /** 完整日期文本 */
  fullDate: string
  /** 日期时间戳 */
  timestamp: number
}

/** 可预约时间段 */
export interface TimeSlot {
  /** 时间值 */
  time: string
  /** 页面展示文案 */
  label: string
}

/** 日历组件确认事件参数 */
export interface CalendarConfirmEvent {
  /** 选中的时间戳或时间戳范围 */
  value: number | number[] | null
}

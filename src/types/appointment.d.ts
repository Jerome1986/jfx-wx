import type { Appointment, AppointmentType } from '@/types/renovation-business'

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

/** 提交焕新方案预约返回结果 */
export interface CreatePlanAppointmentResult {
  /** 关联预约 ID */
  appointmentId: number
  /** 预约编号 */
  appointmentNo: string
}

/** 预约列表分页结果 */
export interface AppointmentListResult {
  /** 预约列表 */
  list: Appointment[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页记录数 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}

/** 取消预约结果 */
export interface CancelAppointmentResult {
  /** 预约 ID */
  id: number
  /** 预约编号 */
  appointmentNo: string
  /** 预约业务类型 */
  type: AppointmentType
  /** 预约处理状态 */
  status: Appointment['status']
  /** 取消时间 */
  canceledAt: string | null
}

/** 新增跟进记录返回结果 */
export interface AppointmentFollowUpResult {
  /** 跟进记录 ID */
  id: number
  /** 关联预约 ID */
  appointmentId: number | null
  /** 关联装修项目 ID */
  projectId: number | null
  /** 负责员工 ID */
  employeeId: number | null
  /** 跟进内容 */
  content: string
  /** 下次跟进时间 */
  nextFollowAt: string | null
  /** 创建时间 */
  createdAt: string
}

/** 确认上门返回的预约数据（不包含关联详情，日期为 ISO 字符串） */
export interface AppointmentConfirmVisitResult {
  /** 预约 ID */
  id: number
  /** 预约编号 */
  appointmentNo: string
  /** 所属用户 ID */
  userId: number | null
  /** 负责员工 ID */
  employeeId: number | null
  /** 关联装修案例 ID */
  caseId: number | null
  /** 关联焕新方案 ID */
  planId: number | null
  /** 预约业务类型 */
  type: AppointmentType
  /** 预约来源 */
  source: string | null
  /** 客户姓名 */
  customerName: string | null
  /** 客户联系电话 */
  mobile: string
  /** 房屋类型 */
  houseType: string | null
  /** 所在城市 */
  city: string | null
  /** 房屋面积（平方米） */
  area: string | null
  /** 房屋户型 */
  roomLayout: string | null
  /** 装修需求说明 */
  demand: string | null
  /** 提交预约时的业务快照 */
  snapshot: Appointment['snapshot'] | null
  /** 客户关注重点 */
  focus: string | null
  /** 上门日期（ISO 日期字符串） */
  visitDate: string
  /** 上门时段 */
  timeSlot: string
  /** 上门详细地址 */
  visitAddress: string
  /** 预约处理状态 */
  status: 'PENDING_VISIT'
  /** 服务完成时间 */
  completedAt: string | null
  /** 取消时间 */
  canceledAt: string | null
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 标记完成返回的预约数据，不包含关联详情 */
export interface AppointmentCompleteResult
  extends Omit<
    AppointmentConfirmVisitResult,
    'status' | 'completedAt' | 'visitDate' | 'timeSlot' | 'visitAddress'
  > {
  /** 预约处理状态 */
  status: 'COMPLETED'
  /** 服务完成时间 */
  completedAt: string
  /** 上门日期（ISO 日期字符串） */
  visitDate: string | null
  /** 上门时段 */
  timeSlot: string | null
  /** 上门详细地址 */
  visitAddress: string | null
}

/** 预约方案明细提交参数 */
export interface PlanAppointmentItemInput {
  /** 原方案明细 ID */
  sourceItemId: number
  /** 替换候选项 ID */
  candidateId?: number | null
  /** 关联商品 ID */
  productId?: number | null
  /** 项目分类 */
  category: string
  /** 项目名称 */
  name: string
  /** 项目描述 */
  description?: string | null
  /** 计价单位 */
  unit: string
  /** 单价 */
  unitPrice: string
  /** 数量 */
  quantity: string
  /** 图片地址 */
  image?: string | null
}

/** 预约方案快照提交参数 */
export interface PlanAppointmentSnapshotInput {
  /** 方案标题 */
  title: string
  /** 方案封面地址 */
  cover?: string | null
  /** 参考金额 */
  referencePrice: string
  /** 方案明细列表 */
  items: PlanAppointmentItemInput[]
}

/** 焕新方案预约提交参数 */
export interface CreatePlanAppointmentInput {
  /** 预约用户 ID */
  userId: number
  /** 关联焕新方案 ID */
  planId: number
  /** 提交预约时的方案快照 */
  snapshot: PlanAppointmentSnapshotInput
}

/** 装修计算器预约提交参数 */
export interface CreateBudgetAppointmentInput {
  /** 预约编号 */
  appointmentNo: string
  /** 预约用户 ID */
  userId: number
  /** 预约业务类型 */
  type: 'BUDGET'
  /** 预约来源 */
  source: '装修计算器'
  /** 客户联系电话 */
  mobile: string
  /** 房屋类型 */
  houseType: '旧房' | '新房'
  /** 所在城市 */
  city: string
  /** 房屋面积（平方米） */
  area: string
  /** 房屋户型 */
  roomLayout: string
}

/** 预约列表查询参数 */
export interface AppointmentListParams {
  /** 当前页码 */
  pageNum: number
  /** 每页记录数 */
  pageSize: number
  /** 预约业务类型，ALL 表示全部类型 */
  type: AppointmentType | 'ALL'
}

/** 员工名下预约查询参数，userId 为当前登录用户 ID */
export interface AssignedAppointmentListParams extends AppointmentListParams {
  /** 当前登录员工的用户 ID */
  userId: number
}

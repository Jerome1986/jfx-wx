/** 预约业务类型 */
export type AppointmentType = 'BUDGET' | 'MEASURE' | 'QUOTE' | 'PLAN' | 'CASE' | 'OUTLET'
/** 预约处理状态 */
export type AppointmentStatus = 'PENDING_CONTACT' | 'PENDING_VISIT' | 'COMPLETED' | 'CANCELED'
/** 装修项目状态 */
export type RenovationProjectStatus = 'PENDING_CONFIRM' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELED'

/** 预约快照中的方案明细 */
export interface AppointmentSnapshotItem {
  /** 原方案明细 ID */
  sourceItemId?: number
  /** 替换候选项 ID */
  candidateId?: number | null
  /** 关联商品 ID */
  productId?: number | null
  /** 项目分类 */
  category: string
  /** 项目名称 */
  name: string
  /** 项目描述 */
  description?: string
  /** 计价单位 */
  unit?: string
  /** 单价 */
  unitPrice?: string
  /** 数量 */
  quantity?: string
  /** 图片地址 */
  image?: string
}

/** 提交预约时保留的业务快照 */
export interface AppointmentSnapshot {
  /** 快照标题 */
  title: string
  /** 封面图片地址 */
  cover?: string
  /** 预约时的参考金额 */
  referencePrice?: string
  /** 地址快照 */
  address?: string
  /** 联系方式快照 */
  contact?: string
  /** 方案明细快照 */
  items?: AppointmentSnapshotItem[]
}

/** 装修服务预约记录 */
export interface Appointment {
  /** 预约 ID */
  id: number
  /** 预约编号 */
  appointmentNo: string
  /** 预约用户 ID */
  userId?: number
  /** 跟进员工 ID */
  employeeId?: number
  /** 关联案例 ID */
  caseId?: number
  /** 关联焕新方案 ID */
  planId?: number
  /** 预约业务类型 */
  type: AppointmentType
  /** 预约来源 */
  source: string
  /** 客户姓名 */
  customerName: string
  /** 客户手机号 */
  mobile: string
  /** 房屋类型 */
  houseType?: string
  /** 所在城市 */
  city?: string
  /** 房屋面积 */
  area?: string
  /** 房屋户型 */
  roomLayout?: string
  /** 客户需求说明 */
  demand?: string
  /** 客户关注重点 */
  focus?: string
  /** 预约上门日期 */
  visitDate?: string
  /** 预约上门时间段 */
  timeSlot?: string
  /** 上门服务地址 */
  visitAddress?: string
  /** 当前处理状态 */
  status: AppointmentStatus
  /** 提交预约时的业务快照 */
  snapshot?: AppointmentSnapshot
  /** 完成时间 */
  completedAt?: string
  /** 取消时间 */
  canceledAt?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 预约或项目的跟进记录 */
export interface FollowUp {
  /** 跟进记录 ID */
  id: number
  /** 关联预约 ID */
  appointmentId?: number
  /** 关联装修项目 ID */
  projectId?: number
  /** 跟进员工 ID */
  employeeId?: number
  /** 跟进内容 */
  content: string
  /** 下次跟进时间 */
  nextFollowAt?: string
  /** 创建时间 */
  createdAt: string
}

/** 由预约转化的装修项目 */
export interface RenovationProject {
  /** 项目 ID */
  id: number
  /** 项目编号 */
  projectNo: string
  /** 来源预约 ID */
  appointmentId?: number
  /** 客户用户 ID */
  userId: number
  /** 负责员工 ID */
  employeeId?: number
  /** 关联焕新方案 ID */
  planId?: number
  /** 项目名称 */
  name: string
  /** 客户姓名 */
  customerName: string
  /** 客户手机号 */
  mobile: string
  /** 服务地址 */
  serviceAddress: string
  /** 报价金额 */
  quotedAmount: number
  /** 合同金额 */
  contractAmount?: number
  /** 项目状态 */
  status: RenovationProjectStatus
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 创建预约所需参数 */
export interface CreateAppointmentInput {
  /** 预约业务类型 */
  type: AppointmentType
  /** 预约来源 */
  source: string
  /** 预约用户 ID */
  userId?: number
  /** 跟进员工 ID */
  employeeId?: number
  /** 关联案例 ID */
  caseId?: number
  /** 关联焕新方案 ID */
  planId?: number
  /** 客户姓名 */
  customerName?: string
  /** 客户手机号 */
  mobile?: string
  /** 房屋类型 */
  houseType?: string
  /** 所在城市 */
  city?: string
  /** 房屋面积 */
  area?: string
  /** 房屋户型 */
  roomLayout?: string
  /** 客户需求说明 */
  demand?: string
  /** 客户关注重点 */
  focus?: string
  /** 提交时的业务快照 */
  snapshot?: AppointmentSnapshot
}

/** 确认上门安排所需参数 */
export interface ConfirmVisitInput {
  /** 上门日期 */
  visitDate: string
  /** 上门时间段 */
  timeSlot: string
  /** 上门服务地址 */
  visitAddress: string
  /** 同步新增的跟进内容 */
  followUp?: string
}

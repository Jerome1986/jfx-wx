/** 装修服务类型：量房或报价 */
export type ServiceType = 'measure' | 'quote'
/** 装修服务状态 */
export type ServiceStatus = 'contact' | 'service' | 'completed'
/** 装修服务列表筛选类型 */
export type ServiceFilterType = 'all' | ServiceType | 'completed'

/** 装修服务订单 */
export interface ServiceOrder {
  /** 服务订单 ID */
  id: number
  /** 服务标题 */
  title: string
  /** 预约来源 */
  source: string
  /** 服务类型 */
  type: ServiceType
  /** 服务状态 */
  status: ServiceStatus
  /** 订单摘要行 */
  lines: string[]
  /** 底部说明文案 */
  footer: string
  /** 次要操作文案 */
  secondaryAction?: string
  /** 主要操作文案 */
  primaryAction: string
}

/** 商品订单详情状态 */
export type ProductOrderDetailStatus =
  | 'pending-payment'
  | 'pending-installation'
  | 'servicing'
  | 'completed'

/** 商品订单状态展示配置 */
export interface ProductOrderStatusConfig {
  /** 状态标题 */
  title: string
  /** 状态描述 */
  description: string
  /** 状态视觉色调标识 */
  tone: string
  /** 当前激活的流程步骤索引 */
  activeStep: number
  /** 底部主要操作文案 */
  footerPrimary: string
  /** 底部次要操作文案 */
  footerSecondary?: string
}

/** 商品订单状态 */
export type ProductOrderStatus =
  | 'pending-payment'
  | 'pending-installation'
  | 'servicing'
  | 'completed'
/** 商品订单列表筛选状态 */
export type ProductOrderFilterStatus = 'all' | ProductOrderStatus

/** 商品订单列表项 */
export interface ProductOrder {
  /** 订单 ID */
  id: number
  /** 订单编号 */
  orderNo: string
  /** 订单状态 */
  status: ProductOrderStatus
  /** 底部说明文案 */
  footer: string
  /** 次要操作文案 */
  secondaryAction?: string
  /** 主要操作文案 */
  primaryAction: string
}

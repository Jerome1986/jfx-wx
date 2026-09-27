import type { UserProductOrder } from './product-order'

/** 商品订单详情状态 */
export type ProductOrderDetailStatus =
  | 'pending-payment'
  | 'pending-installation'
  | 'servicing'
  | 'pending-confirmation'
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

/** 用户订单详情，金额由接口以 Decimal 字符串返回。 */
export interface ProductOrderDetail extends UserProductOrder {
  contactPhone: string
  productAmount: string | number
  couponDiscount: string | number
  pointDiscount: string | number
  pointsUsed: number
  installationFee: string | number | null
  paidAmount: string | number
  refundAmount: string | number | null
  remark: string | null
  paidAt: string | null
  canceledAt: string | null
  completedAt: string | null
  items: NonNullable<UserProductOrder['items']>
}

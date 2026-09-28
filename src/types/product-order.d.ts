/** 商品订单状态 */
export type ProductOrderStatus =
  | 'pending-payment'
  | 'pending-installation'
  | 'servicing'
  | 'pending-confirmation'
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

/** 服务端商品订单状态。 */
export type ProductOrderApiStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_INSTALLATION'
  | 'IN_SERVICE'
  | 'PENDING_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELED'
  | 'REFUNDING'
  | 'REFUNDED'

export interface OrderInstallation {
  serviceNo: string
  status:
    | 'PENDING_APPOINTMENT'
    | 'PENDING_ASSIGNMENT'
    | 'PENDING_VISIT'
    | 'IN_SERVICE'
    | 'COMPLETED'
    | 'CANCELED'
  appointmentDate: string | null
  timeSlot: string | null
  customerConfirmed: boolean
  customerConfirmedAt: string | null
  serviceRecord: string | null
  completedAt: string | null
}
export interface UserProductOrder {
  /** 由服务端返回，前端不按本机时间修改订单状态。 */
  paymentExpiresAt?: string
  paymentExpired?: boolean
  cancelReason?: string | null
  confirmationDeadlineAt: string | null
  completionType: 'CUSTOMER_CONFIRMED' | 'AUTO_TIMEOUT' | null
  autoCompletionPaused: boolean
  completedAt: string | null
  refundAmount: string | number | null
  appointmentDate: string | null
  timeSlot: string | null
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDING' | 'REFUNDED' | 'CLOSED'
  installation: OrderInstallation | null
  id: number
  orderNo: string
  status: ProductOrderApiStatus
  contactName: string
  serviceAddress: string
  payableAmount: string | number
  createdAt: string
  // 当前列表接口未 include 明细，支持后续返回商品快照。
  items?: {
    id: number
    productName: string
    skuDescription: string | null
    image: string | null
    unitPrice: string | number
    quantity: number
    requiresInstall: boolean
  }[]
}

export interface UserProductOrderPage {
  list: UserProductOrder[]
  total: number
  pageNum: string | number
  pageSize: string | number
  totalPage: number
}

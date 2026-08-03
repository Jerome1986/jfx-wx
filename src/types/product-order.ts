export type ProductOrderStatus =
  | 'pending-payment'
  | 'pending-installation'
  | 'servicing'
  | 'completed'
export type ProductOrderFilterStatus = 'all' | ProductOrderStatus

export interface ProductOrder {
  id: number
  orderNo: string
  status: ProductOrderStatus
  footer: string
  secondaryAction?: string
  primaryAction: string
}

export type ProductOrderDetailStatus =
  | 'pending-payment'
  | 'pending-installation'
  | 'servicing'
  | 'completed'

export interface ProductOrderStatusConfig {
  title: string
  description: string
  tone: string
  activeStep: number
  footerPrimary: string
  footerSecondary?: string
}

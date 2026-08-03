export type CouponStatus = 'available' | 'expired'

export interface CouponItem {
  id: number
  amount: number
  threshold: number
  expiry: string
  status: CouponStatus
}

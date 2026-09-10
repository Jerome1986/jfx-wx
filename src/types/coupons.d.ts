/** 优惠券状态：可用或已过期 */
export type CouponStatus = 'available' | 'expired'

/** 优惠券信息 */
export interface CouponItem {
  /** 优惠券 ID */
  id: number
  /** 优惠金额 */
  amount: number
  /** 使用门槛金额 */
  threshold: number
  /** 有效期文案 */
  expiry: string
  /** 优惠券状态 */
  status: CouponStatus
}

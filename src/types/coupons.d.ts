/** 优惠券状态：可用或不可用 */
export type CouponStatus = 'available' | 'unavailable'

/** 优惠券信息 */
export interface CouponItem {
  name: string
  scope: string
  scopeType: 'ALL' | 'RENOVATION' | 'PRODUCT'
  statusLabel: string
  usable: boolean
  expiresAt: number
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

/** 用户详情返回的领券记录，金额由 Decimal 序列化为字符串或数字。 */
export interface UserCoupon {
  /** 已占用该券的订单，未占用时为 null。 */
  orderId: number | null
  id: number
  status: 'AVAILABLE' | 'USED' | 'EXPIRED' | 'INVALID'
  expiresAt: string
  coupon: {
    id: number
    name: string
    amount: string | number
    threshold: string | number
    scopeType: 'ALL' | 'RENOVATION' | 'PRODUCT'
    scopeIds?: number[] | null
    validFrom: string
    validTo: string
    status: 'DRAFT' | 'PUBLISHED' | 'DISABLED'
  }
}

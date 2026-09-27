import type { UserCoupon } from '@/types/coupons'

/**
 * 校验优惠券是否可用于本次商品订单，并计算可抵扣金额。
 * @param record 用户领券记录，包含使用状态、过期时间及优惠券模板信息。
 * @param eligibleCents 本次可参与优惠券抵扣的商品金额，单位为分，使用抵扣前金额判断门槛。
 * @param now 当前时间的毫秒时间戳，用于校验优惠券是否生效或过期。
 * @returns 用户券记录、不可用原因（空字符串表示可用）及抵扣金额（单位为分）。
 */
export const evaluateCoupon = (record: UserCoupon, eligibleCents: number, now: number) => {
  const coupon = record.coupon
  const amount = Math.round(Number(coupon.amount) * 100)
  const threshold = Math.round(Number(coupon.threshold) * 100)
  let reason = ''
  if (record.status === 'USED') reason = '已使用'
  else if (record.status === 'EXPIRED') reason = '已过期'
  else if (record.status !== 'AVAILABLE' || coupon.status !== 'PUBLISHED') reason = '已失效'
  else if (!(Date.parse(coupon.validFrom) <= now)) reason = '未到使用时间'
  else if (!(Date.parse(record.expiresAt) > now && Date.parse(coupon.validTo) > now))
    reason = '已过期'
  else if (coupon.scopeType !== 'ALL' && coupon.scopeType !== 'PRODUCT') reason = '仅适用于装修订单'
  else if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(threshold) || threshold < 0)
    reason = '优惠券信息异常'
  else if (eligibleCents <= 0) reason = '不适用于本次商品'
  else if (eligibleCents < threshold) reason = `适用商品满¥${(threshold / 100).toFixed(2)}可用`
  return { record, reason, discountCents: reason ? 0 : Math.min(amount, eligibleCents) }
}

// 临时固定规则：1 积分抵 1 元，后续在此替换业务规则。
export const POINT_VALUE_CENTS = 100
/**
 * 按先优惠券、后积分的顺序计算订单抵扣和应付金额。
 * @param totalCents 抵扣前的商品总金额，单位为分，应为非负整数。
 * @param couponCents 已选优惠券的可抵扣金额，单位为分，不使用优惠券时传 0。
 * @param points 当前用户的可用积分数量，按非负整数处理，暂按 1 积分抵 1 元计算。
 * @param usePoints 是否启用积分抵扣，false 表示不使用积分。
 * @returns 优惠券抵扣金额、积分抵扣金额和最终应付金额，单位均为分。
 */
export const calculateDiscounts = (
  totalCents: number,
  couponCents: number,
  points: number,
  usePoints: boolean,
) => {
  const couponDiscount = Math.min(totalCents, Math.max(0, couponCents))
  const remaining = totalCents - couponDiscount
  const balance = Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0
  // 服务端仅接受整数积分，不能用不足 1 元的余额抵扣一个积分。
  const pointsDiscount = usePoints
    ? Math.min(Math.floor(remaining / POINT_VALUE_CENTS), balance) * POINT_VALUE_CENTS
    : 0
  return { couponDiscount, pointsDiscount, payableCents: remaining - pointsDiscount }
}

export type UserRole = 'CUSTOMER' | 'EMPLOYEE'
export type Gender = 'MALE' | 'FEMALE'

export interface MemberProfile {
  role?: UserRole
  employeeId?: string
  name?: string
  nickname?: string
  mobile?: string
  gender?: Gender | ''
  avatar?: string
  /** 当前可用积分 */
  points: number
  /** 预约数量 */
  appointmentCount: number
  /** 收藏数量 */
  favoriteCount: number
  /** 优惠券数量 */
  couponCount: number
  [key: string]: unknown
}

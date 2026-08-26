/** 用户角色：客户或员工 */
export type UserRole = 'CUSTOMER' | 'EMPLOYEE'
/** 用户性别 */
export type Gender = 'MALE' | 'FEMALE'

/** 当前登录会员资料 */
export interface MemberProfile {
  /** 用户角色 */
  role?: UserRole
  /** 关联员工 ID */
  employeeId?: string
  /** 用户姓名 */
  name?: string
  /** 用户昵称 */
  nickname?: string
  /** 手机号码 */
  mobile?: string
  /** 性别，空字符串表示未设置 */
  gender?: Gender | ''
  /** 头像地址 */
  avatar?: string
  /** 当前可用积分 */
  points: number
  /** 预约数量 */
  appointmentCount: number
  /** 收藏数量 */
  favoriteCount: number
  /** 优惠券数量 */
  couponCount: number
  /** 允许保留后端扩展字段 */
  [key: string]: unknown
}

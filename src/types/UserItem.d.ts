/** 用户角色 */
export type UserRole = 'CUSTOMER' | 'EMPLOYEE'
export type Gender = 'MALE' | 'FEMALE'

export type UserItem = {
  /** 主键 ID */
  id: number
  /** 用户编号 */
  userNo: string
  /** 用户角色 */
  role: UserRole
  /** 手机号码 */
  mobile: string
  /** 性别 */
  gender?: Gender
  /** 微信 OpenID */
  openid?: string
  /** 用户昵称 */
  nickname?: string
  /** 真实姓名 */
  realName?: string
  /** 用户头像地址 */
  avatar?: string
  /** 来源渠道 */
  source?: string
  /** 所在城市 */
  city?: string
  /** 用户标签列表 */
  tags?: string[]
  /** 当前可用积分 */
  points: number
  /** 累计获得积分 */
  totalPointsEarned: number
  /** 累计使用积分 */
  totalPointsUsed: number
  /** 预约数量 */
  appointmentCount: number
  /** 收藏数量 */
  favoriteCount: number
  /** 优惠券数量 */
  couponCount: number
  /** 用户账号是否启用 */
  status: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

// 登录返回
export interface LoginResult {
  token: string
  user: UserItem
}

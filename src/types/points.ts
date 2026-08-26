/** 积分记录筛选类型 */
export type PointsType = 'all' | 'income' | 'expense'

/** 积分收支记录 */
export interface PointsRecord {
  /** 记录 ID */
  id: number
  /** 收支类型 */
  type: 'income' | 'expense'
  /** 记录标题 */
  title: string
  /** 记录描述 */
  description: string
  /** 发生日期 */
  date: string
  /** 积分变动数量 */
  amount: number
}

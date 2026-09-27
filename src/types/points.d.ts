/** 积分记录筛选类型 */
export type PointsType = 'all' | 'income' | 'expense'

/** 后端积分记录筛选枚举 */
export type PointsApiType = 'ALL' | 'INCOME' | 'EXPENSE' | 'MANUAL' | 'EXPIRED'

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

/** 积分明细分页数据 */
export interface PointsRecordPage {
  /** 积分记录列表 */
  list: PointsRecord[]
  /** 记录总数 */
  total: number
  /** 当前页码 */
  pageNum: number | string
  /** 每页数量 */
  pageSize: number | string
  /** 总页数 */
  totalPage: number
}

/** 积分统计接口响应 */
export interface ScoreSummary {
  points?: number
  availablePoints?: number
  score?: number
  monthlyIncome?: number
  monthlyEarned?: number
  monthIncome?: number
  totalIncome?: number
  totalEarned?: number
  totalPointsEarned?: number
  totalExpense?: number
  totalUsed?: number
  totalPointsUsed?: number
}

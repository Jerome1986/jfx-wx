/** 装修案例详情 */
export interface CaseDetail {
  /** 当前登录用户是否已收藏 */
  isFavorite: boolean
  /** 案例标题 */
  title: string
  /** 案例标签 */
  label: string
  /** 改造前封面图 */
  beforeCover: string
  /** 改造后封面图 */
  afterCover: string
  /** 案例所在地 */
  location: string
  /** 房屋户型 */
  roomType: string
  /** 房屋面积 */
  area: string
  /** 装修风格 */
  style: string
  /** 参考价格文案 */
  price: string
  /** 案例描述 */
  description: string
  /** 案例亮点 */
  highlights: Array<{ title: string; description: string }>
  /** 费用明细 */
  costs: Array<{ name: string; value: string }>
}

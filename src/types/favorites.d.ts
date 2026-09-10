/** 已收藏的装修案例 */
export interface FavoriteCase {
  /** 案例 ID */
  id: number
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
  /** 特点标签列表 */
  tags: string[]
  /** 参考价格文案 */
  price: string
  /** 施工周期文案 */
  duration: string
  /** 已领取方案人数 */
  receivedCount: number
}

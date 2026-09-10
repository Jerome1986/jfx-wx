/** 首页精选案例 */
export interface SelectedCase {
  /** 案例 ID */
  id: number
  /** 案例标题 */
  title: string
  /** 案例标签 */
  label: string
  /** 是否已收藏 */
  isFavorite: boolean
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

/** 轮播图状态：草稿、已发布或已下线 */
export type BannerStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE'

/** 首页轮播图 */
export interface BannerItem {
  /** 轮播图 ID */
  id: number
  /** 轮播图标题 */
  title: string
  /** 图片地址 */
  image: string
  /** 跳转目标类型 */
  targetType?: string
  /** 跳转目标 */
  target?: string
  /** 排序值，数值越小越靠前 */
  sort: number
  /** 展示开始时间 */
  startAt?: string
  /** 展示结束时间 */
  endAt?: string
  /** 发布状态 */
  status: BannerStatus
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

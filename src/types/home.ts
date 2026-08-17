export interface SelectedCase {
  id: number
  title: string
  label: string
  isFavorite: boolean
  beforeCover: string
  afterCover: string
  location: string
  roomType: string
  area: string
  tags: string[]
  price: string
  duration: string
  receivedCount: number
}

export type BannerStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE'

/** 首页轮播图 */
export interface BannerItem {
  id: number
  title: string
  image: string
  targetType?: string
  target?: string
  sort: number
  startAt?: string
  endAt?: string
  status: BannerStatus
  createdAt: string
  updatedAt: string
}

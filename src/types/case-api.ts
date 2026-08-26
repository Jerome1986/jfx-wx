/** 案例分类 */
export interface CaseCategoryItem {
  id: number
  name: string
  code: string
  sort: number
}

/** 装修案例接口列表项 */
export interface RenovationCaseItem {
  id: number
  categoryId: number
  title: string
  tags: unknown | null
  city: string | null
  roomType: string | null
  area: string | null
  style: string | null
  beforeImage: string
  afterImage: string
  description: string | null
  highlights: unknown | null
  costs: unknown | null
  totalPrice: string | null
  durationDays: number | null
  viewCount: number
  quoteCount: number
  shareTitle: string | null
  shareImage: string | null
  isRecommended: boolean
  recommendSort: number
  status: string
  createdAt: string
  updatedAt: string
  /** 当前登录用户是否已收藏；未传 userId 时固定为 false */
  isFavorite: boolean
}

/** 案例列表查询参数 */
export interface CaseListParams {
  pageNum: number
  pageSize: number
  userId?: number
}

/** 装修案例分页结果 */
export interface RenovationCasePage {
  list: RenovationCaseItem[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

/** 装修案例详情接口返回数据 */
export interface RenovationCaseDetail {
  id: number
  categoryId: number
  title: string
  tags: unknown | null
  city: string | null
  roomType: string | null
  area: string | null
  style: string | null
  beforeImage: string
  afterImage: string
  description: string | null
  highlights: unknown | null
  costs: unknown | null
  totalPrice: string | null
  durationDays: number | null
  viewCount: number
  quoteCount: number
  shareTitle: string | null
  shareImage: string | null
  isRecommended: boolean
  recommendSort: number
  status: string
  createdAt: string
  updatedAt: string
  /** 当前登录用户是否已收藏 */
  isFavorite: boolean
}

/** 案例分类 */
export interface CaseCategoryItem {
  /** 分类 ID */
  id: number
  /** 名称 */
  name: string
  /** 编码 */
  code: string
  /** 排序值 */
  sort: number
}

/** 装修案例接口列表项 */
export interface RenovationCaseItem {
  /** 案例 ID */
  id: number
  /** 分类 ID */
  categoryId: number
  /** 标题 */
  title: string
  /** 标签列表 */
  tags: unknown | null
  /** 城市 */
  city: string | null
  /** 房型 */
  roomType: string | null
  /** 面积 */
  area: string | null
  /** 风格 */
  style: string | null
  /** 改造前图片 */
  beforeImage: string
  /** 改造后图片 */
  afterImage: string
  /** 描述 */
  description: string | null
  /** 亮点信息 */
  highlights: unknown | null
  /** 费用明细 */
  costs: unknown | null
  /** 总价 */
  totalPrice: string | null
  /** 工期天数 */
  durationDays: number | null
  /** 浏览数量 */
  viewCount: number
  /** 报价数量 */
  quoteCount: number
  /** 分享标题 */
  shareTitle: string | null
  /** 分享图片 */
  shareImage: string | null
  /** 是否推荐 */
  isRecommended: boolean
  /** 推荐排序 */
  recommendSort: number
  /** 状态 */
  status: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 当前登录用户是否已收藏；未传 userId 时固定为 false */
  isFavorite: boolean
}

/** 案例列表查询参数 */
export interface CaseListParams {
  /** 页码 */
  pageNum: number
  /** 每页数量 */
  pageSize: number
  /** 用户 ID */
  userId?: number
}

/** 装修案例分页结果 */
export interface RenovationCasePage {
  /** 列表数据 */
  list: RenovationCaseItem[]
  /** 总数量 */
  total: number
  /** 页码 */
  pageNum: number
  /** 每页数量 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}

/** 装修案例详情接口返回数据 */
export interface RenovationCaseDetail {
  /** 关联案例 ID */
  id: number
  /** 分类 ID */
  categoryId: number
  /** 标题 */
  title: string
  /** 标签列表 */
  tags: unknown | null
  /** 城市 */
  city: string | null
  /** 房型 */
  roomType: string | null
  /** 面积 */
  area: string | null
  /** 风格 */
  style: string | null
  /** 改造前图片 */
  beforeImage: string
  /** 改造后图片 */
  afterImage: string
  /** 描述 */
  description: string | null
  /** 亮点信息 */
  highlights: unknown | null
  /** 费用明细 */
  costs: unknown | null
  /** 总价 */
  totalPrice: string | null
  /** 工期天数 */
  durationDays: number | null
  /** 浏览数量 */
  viewCount: number
  /** 报价数量 */
  quoteCount: number
  /** 分享标题 */
  shareTitle: string | null
  /** 分享图片 */
  shareImage: string | null
  /** 是否推荐 */
  isRecommended: boolean
  /** 推荐排序 */
  recommendSort: number
  /** 状态 */
  status: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 当前登录用户是否已收藏 */
  isFavorite: boolean
}

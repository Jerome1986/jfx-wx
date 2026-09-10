/** 空间焕新方案 */
export interface RenewalPlan {
  /** 方案 ID */
  id: number
  /** 方案名称 */
  name: string
  /** 方案摘要 */
  summary: string
  /** 方案标签 */
  tags: string[]
  /** 起步价格 */
  startingPrice: string
  /** 封面图片地址 */
  cover: string
  /** 方案图片列表 */
  images: string[]
  /** 方案详情 */
  detail: string
  /** 分享标题 */
  shareTitle: string
  /** 分享图片地址 */
  shareImage: string
  /** 列表排序值 */
  sort: number
  /** 是否推荐 */
  isRecommended: boolean
  /** 推荐位排序值 */
  recommendSort: number
  /** 发布状态 */
  status: 'DRAFT' | 'PUBLISHED' | 'OFFLINE'
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 方案明细列表 */
  items: RenewalPlanItem[]
}

/** 空间焕新方案明细 */
export interface RenewalPlanItem {
  /** 明细 ID */
  id: number
  /** 所属方案 ID */
  planId: number
  /** 关联商品 ID，服务项为 null */
  productId: number | null
  /** 项目分类 */
  category: string
  /** 项目名称 */
  name: string
  /** 项目描述 */
  description: string
  /** 计价单位 */
  unit: string
  /** 单价 */
  unitPrice: string
  /** 数量 */
  quantity: string
  /** 图片地址 */
  image: string
  /** 排序值 */
  sort: number
  /** 关联商品详情，服务项为 null */
  product: RenewalPlanProduct | null
}

/** 空间焕新方案关联商品 */
export interface RenewalPlanProduct {
  /** 商品 ID */
  id: number
  /** 商品分类 ID */
  categoryId: number
  /** 商品名称 */
  name: string
  /** 商品描述 */
  description: string
  /** 商品品牌 */
  brand: string
  /** 商品型号 */
  model: string
  /** 规格参数列表 */
  specifications: string[]
  /** 商品价格 */
  price: string
  /** 库存数量 */
  stock: number
  /** 商品主图地址 */
  mainImage: string
  /** 商品详情图片列表 */
  detailImages: string[]
  /** 是否包含安装服务 */
  installationIncluded: boolean
  /** 是否已上架 */
  isPublished: boolean
  /** 排序值 */
  sort: number
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

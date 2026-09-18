import type { RenewalPlanProduct } from '@/types/space-renewal'

/** 焕新替换项类型：商品或服务 */
export type RenewalReplacementType = 'PRODUCT' | 'SERVICE'

/** 商品替换列表查询参数 */
export interface ProductReplacementQuery {
  /** 商品关键词 */
  keyword?: string
  /** 仅查询已上架商品 */
  isPublished: true
  /** 仅查询有库存商品 */
  inStock: true
  /** 当前页码 */
  pageNum: number
  /** 每页数量 */
  pageSize: number
}

/** 商品替换分页结果 */
export interface ProductReplacementPage {
  /** 当前页商品 */
  list: RenewalPlanProduct[]
  /** 商品总数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页数量 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}

/** 施工服务目录项 */
export interface ConstructionServiceItem {
  /** 施工服务 ID */
  id: number
  /** 服务名称 */
  name: string
  /** 服务描述 */
  description: string
  /** 计价单位 */
  unit: string
  /** 服务单价 */
  unitPrice: string
  /** 服务图片 */
  image: string
  /** 是否启用 */
  isEnabled: boolean
  /** 排序值 */
  sort: number
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 施工服务替换列表查询参数 */
export interface ConstructionServiceQuery {
  /** 服务关键词 */
  keyword?: string
  /** 仅查询启用服务 */
  isEnabled: true
  /** 当前页码 */
  pageNum: number
  /** 每页数量 */
  pageSize: number
}

/** 施工服务替换分页结果 */
export interface ConstructionServicePage {
  /** 当前页施工服务 */
  list: ConstructionServiceItem[]
  /** 服务总数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页数量 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}

/** 焕新方案可替换候选项 */
export interface RenewalReplacementCandidate {
  /** 候选项 ID */
  id: number
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
  /** 默认数量 */
  quantity: string
  /** 图片地址 */
  image: string
}

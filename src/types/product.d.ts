/** 商品简要信息 */
export interface ProductItem {
  /** 商品 ID */
  id: number
  /** 商品名称 */
  name: string
  /** 商品描述 */
  description: string
  /** 商品价格 */
  price: number
  /** 商品图片地址 */
  image: string
}

/** 商品分类树节点 */
export interface ProductCategoryItem {
  /** 分类 ID */
  id: number
  /** 父级 ID */
  parentId: number | null
  /** 名称 */
  name: string
  /** 排序值 */
  sort: number
  /** 是否启用 */
  isEnabled: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 子级列表 */
  children?: ProductCategoryItem[]
}

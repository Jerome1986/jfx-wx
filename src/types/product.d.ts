/** 商品分类树，叶子节点可以不返回 children。 */
export interface ProductCategoryNode {
  id: number
  name: string
  isEnabled: boolean
  children?: ProductCategoryNode[]
}

/** 分类商品接口条目，Decimal 价格可能序列化为字符串。 */
export interface ProductResponseItem {
  id: number
  name: string
  description: string | null
  price: string | number
  mainImage: string
}

export interface ProductPageParams {
  pageNum: number
  pageSize: number
}

/** 商品详情接口数据。 */
export interface ProductDetail extends ProductResponseItem {
  brand: string | null
  model: string | null
  specifications: string[] | null
  detailImages: string[] | null
  installationIncluded: boolean
}

export interface ProductPage extends ProductPageParams {
  list: ProductResponseItem[]
  total: number
  totalPage: number
}

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

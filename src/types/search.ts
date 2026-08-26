/** 搜索结果中的商品信息 */
export interface SearchProductItem {
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

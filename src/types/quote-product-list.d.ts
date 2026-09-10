/** 报价商品列表项 */
export interface QuoteProductItem {
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

/** 报价商品列表页面实例扩展 */
export interface QuoteProductPage {
  /** 获取页面打开者事件通道 */
  getOpenerEventChannel?: () => UniApp.EventChannel
}

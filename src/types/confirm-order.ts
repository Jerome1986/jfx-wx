/** 确认订单页商品项 */
export interface OrderItem {
  /** 商品 ID */
  id: number
  /** 商品名称 */
  name: string
  /** 商品描述 */
  description: string
  /** 商品单价 */
  price: number
  /** 购买数量 */
  quantity: number
  /** 商品图片地址 */
  image: string
}

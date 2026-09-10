/** 报价明细分类 */
export type QuoteCategory = 'all' | 'main' | 'labor'

/** 报价明细项 */
export interface QuoteItem {
  /** 明细 ID */
  id: number
  /** 明细分类，不包含“全部” */
  category: Exclude<QuoteCategory, 'all'>
  /** 明细名称 */
  title: string
  /** 明细描述 */
  description: string
  /** 单价 */
  price: number
  /** 计价单位 */
  unit: string
  /** 数量 */
  quantity: number
  /** 图片地址 */
  image: string
  /** 是否选中 */
  selected: boolean
}

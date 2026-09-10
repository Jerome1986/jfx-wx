/** 焕新方案费用筛选标签 */
export type FeeTab = '全部' | '主材' | '人工+辅材'

/** 焕新方案详情页可编辑服务项 */
export interface ServiceItem {
  /** 当前明细 ID */
  id: number
  /** 原方案明细 ID */
  sourceItemId: number
  /** 替换候选项 ID，未替换时为 null */
  candidateId: number | null
  /** 关联商品 ID，服务项为 null */
  productId: number | null
  /** 项目名称 */
  title: string
  /** 项目描述 */
  description: string
  /** 单价 */
  price: number
  /** 数量 */
  quantity: number
  /** 项目分类 */
  category: string
  /** 计价单位 */
  unit: string
  /** 图片地址 */
  image: string
  /** 是否选入当前预约方案 */
  selected: boolean
}

/** 焕新替换项类型：商品或服务 */
export type RenewalReplacementType = 'PRODUCT' | 'SERVICE'

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

/** 焕新预约中提交的方案明细 */
export interface RenewalAppointmentItem {
  /** 原方案明细 ID */
  sourceItemId: number
  /** 替换候选项 ID，未替换时为 null */
  candidateId: number | null
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
}

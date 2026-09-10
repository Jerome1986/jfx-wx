/** 装修预算测算表单 */
export interface BudgetForm {
  /** 房屋类型：旧房或新房 */
  houseType: 'old' | 'new'
  /** 所在城市 */
  city: string
  /** 房屋面积 */
  area: string
  /** 户型 */
  layout: string
  /** 联系电话 */
  phone: string
}

/** 预算页权益说明项 */
export interface BenefitItem {
  /** 图标地址或图标标识 */
  icon: string
  /** 权益标题 */
  title: string
  /** 权益描述 */
  description: string
}

/** 预算测算说明项 */
export interface CalculationNote {
  /** 图标地址或图标标识 */
  icon: string
  /** 说明内容 */
  content: string
}

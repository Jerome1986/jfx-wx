/** 服务网点筛选分类 */
export type OutletCategory = '全部' | '距离最近' | '装修咨询' | '售后服务'

/** 服务网点信息 */
export interface ServiceOutlet {
  /** 网点 ID */
  id: number
  /** 网点名称 */
  name: string
  /** 与当前位置的距离 */
  distance: number
  /** 营业时间文案 */
  time: string
  /** 网点地址 */
  address: string
  /** 网点支持的服务分类 */
  categories: OutletCategory[]
  /** 网点图片地址 */
  image: string
}

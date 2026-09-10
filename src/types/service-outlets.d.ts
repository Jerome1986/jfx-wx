/** 服务网点接口数据 */
export interface ServiceOutlet {
  /** 服务网点 ID */
  id: number
  /** 名称 */
  name: string
  /** 营业时间 */
  businessHours: string
  /** 联系电话 */
  phone: string | null
  /** 省份 */
  province: string | null
  /** 城市 */
  city: string
  /** 区县 */
  district: string | null
  /** 详细地址 */
  address: string
  /** 纬度 */
  latitude: string | null
  /** 经度 */
  longitude: string | null
  /** 封面图片 */
  cover: string | null
  /** 排序值 */
  sort: number
  /** 状态 */
  status: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 已启用服务网点的城市 */
export interface ServiceCity {
  /** 城市 ID */
  id: number
  /** 名称 */
  name: string
  /** 编码 */
  code: string
  /** 排序值 */
  sort: number
  /** 状态 */
  status: boolean
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

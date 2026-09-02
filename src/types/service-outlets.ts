/** 服务网点接口数据 */
export interface ServiceOutlet {
  id: number
  name: string
  businessHours: string
  phone: string | null
  province: string | null
  city: string
  district: string | null
  address: string
  latitude: string | null
  longitude: string | null
  cover: string | null
  sort: number
  status: boolean
  createdAt: string
  updatedAt: string
}

/** 已启用服务网点的城市 */
export interface ServiceCity {
  id: number
  name: string
  code: string
  sort: number
  status: boolean
  createdAt: string
  updatedAt: string
}

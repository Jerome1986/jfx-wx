/** 后端地址实体 */
export interface AddressItem {
  /** 地址 ID */
  id: number
  /** 所属用户 ID */
  userId: number
  /** 联系人姓名 */
  contactName: string
  /** 联系电话 */
  phone: string
  /** 地区或位置名称 */
  locationName: string
  /** 省份 */
  province: string
  /** 城市 */
  city: string
  /** 区县 */
  district: string
  /** 详细地址 */
  address: string
  /** 门牌号 */
  doorplate: string
  /** 纬度 */
  latitude?: number
  /** 经度 */
  longitude?: number
  /** 是否为默认地址 */
  isDefault: boolean
  /** 是否启用 */
  isEnabled: boolean
  /** 创建时间 */
  createdAt?: string
  /** 更新时间 */
  updatedAt?: string
}

/** 新增地址请求参数 */
export type CreateAddressParams = Omit<AddressItem, 'id' | 'createdAt' | 'updatedAt'>

/** 更新地址请求参数，后端支持按需传递字段 */
export type UpdateAddressParams = Partial<CreateAddressParams>

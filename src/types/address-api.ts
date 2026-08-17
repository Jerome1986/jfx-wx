/** 后端地址实体 */
export interface AddressItem {
  id: number
  userId: number
  contactName: string
  phone: string
  locationName: string
  province: string
  city: string
  district: string
  address: string
  doorplate: string
  latitude?: number
  longitude?: number
  isDefault: boolean
  isEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

/** 新增地址请求参数 */
export type CreateAddressParams = Omit<AddressItem, 'id' | 'createdAt' | 'updatedAt'>

/** 更新地址请求参数，后端支持按需传递字段 */
export type UpdateAddressParams = Partial<CreateAddressParams>

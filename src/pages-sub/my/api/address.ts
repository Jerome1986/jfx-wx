import { request } from '@/utils/http'
import type { AddressItem, CreateAddressParams, UpdateAddressParams } from '@/types/address-api'

/** 新增地址 */
export const createAddressApi = (data: CreateAddressParams) => {
  return request<AddressItem>({ method: 'POST', url: '/address', data })
}

/** 获取地址列表 */
export const getAddressListApi = () => {
  return request<AddressItem[]>({ method: 'GET', url: '/address' })
}

/** 获取地址详情 */
export const getAddressDetailApi = (id: number) => {
  return request<AddressItem>({ method: 'GET', url: `/address/${id}` })
}

/** 更新地址 */
export const updateAddressApi = (id: number, data: UpdateAddressParams) => {
  return request<AddressItem>({
    method: 'PATCH' as UniApp.RequestOptions['method'],
    url: `/address/${id}`,
    data,
  })
}

/** 删除地址 */
export const deleteAddressApi = (id: number) => {
  return request<void>({ method: 'DELETE', url: `/address/${id}` })
}

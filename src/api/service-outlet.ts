import { request } from '@/utils/http'
import type { ServiceCity, ServiceOutlet } from '@/types/service-outlets'

/** 按城市 ID 获取启用的服务网点 */
export const getServiceOutletsByCityApi = (cityId: number) =>
  request<ServiceOutlet[]>({
    method: 'GET',
    url: '/service-outlet/by-city',
    data: { cityId },
  })

/** 获取所有启用的服务网点城市 */
export const getServiceCityApi = () =>
  request<ServiceCity[]>({
    method: 'GET',
    url: '/service-city/enabled',
  })

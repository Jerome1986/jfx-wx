import { request } from '@/utils/http'
import type { BannerItem } from '@/types/home'

/** 获取首页轮播图 */
export const getBannerListApi = () => {
  return request<BannerItem[]>({
    method: 'GET',
    url: '/banner',
  })
}

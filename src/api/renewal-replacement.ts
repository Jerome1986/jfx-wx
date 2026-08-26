import { request } from '@/utils/http'
import type { RenewalPlanProduct } from '@/types/space-renewal'

/** 获取可替换商品列表 */
export const getRenewalReplacementProductsApi = () => {
  return request<RenewalPlanProduct[]>({
    method: 'GET',
    url: '/product',
  })
}

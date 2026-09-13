import { request } from '@/utils/http'
import type {
  ConstructionServicePage,
  ConstructionServiceQuery,
  ProductReplacementPage,
  ProductReplacementQuery,
} from '@/types/renewal-replacement'

/** 从商品目录分页获取已上架且有库存的替换商品。 */
export const getRenewalReplacementProductsApi = (data: ProductReplacementQuery) =>
  request<ProductReplacementPage>({
    method: 'GET',
    url: '/product',
    data,
  })

/** 分页获取已启用的施工服务替换候选 */
export const getConstructionServiceListApi = (data: ConstructionServiceQuery) =>
  request<ConstructionServicePage>({
    method: 'GET',
    url: '/construction-service',
    data,
  })

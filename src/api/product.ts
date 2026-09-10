import { request } from '@/utils/http'
import type { ProductCategoryItem } from '@/types/product'

/** 获取商品分类树 */
export const productCategoryApi = () =>
  request<ProductCategoryItem[]>({
    method: 'GET',
    url: '/product-category',
  })

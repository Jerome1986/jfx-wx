import { request } from '@/utils/http'
import type {
  ProductCategoryNode,
  ProductDetail,
  ProductPage,
  ProductPageParams,
} from '@/types/product'

/** 商品详情；商品不存在时返回 null。 */
export const getProductDetail = (id: number) =>
  request<ProductDetail | null>({ method: 'GET', url: `/product/${id}` })

/**
 * 商品分类
 */
export const productCategory = () => {
  return request<ProductCategoryNode[]>({
    method: 'GET',
    url: '/product-category',
  })
}

/** 按分类 ID 查询已上架商品。/api 前缀由统一请求层添加。 */
export const getCategoryProducts = (categoryId: number, params: ProductPageParams) =>
  request<ProductPage>({
    method: 'GET',
    url: `/product/category/${categoryId}`,
    data: { ...params, isPublished: true },
  })

import { request, type Data } from '@/utils/http'
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

/** 按名称搜索商品，分页参数按接口约定传字符串。 */
export const searchProducts = async (params: {
  productName: string
  pageNum: string
  pageSize: string
}): Promise<Data<ProductPage>> => {
  // 兼容接口直接返回分页对象，以及项目统一响应包装。
  const response: Data<ProductPage> | ProductPage = await request<ProductPage>({
    method: 'GET',
    url: '/product/web/search',
    data: params,
  })
  if ('code' in response) return response
  return { code: 200, message: 'success', data: response }
}

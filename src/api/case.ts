import { request } from '@/utils/http'
import type {
  CaseCategoryItem,
  CaseListParams,
  RenovationCaseDetail,
  RenovationCasePage,
} from '@/types/case-api'

/** 获取案例分类 */
export const getCaseCategoryListApi = () =>
  request<CaseCategoryItem[]>({
    method: 'GET',
    url: '/case-category',
  })

/** 分页获取装修案例 */
export const getCasePageApi = (params: CaseListParams) =>
  request<RenovationCasePage>({
    method: 'GET',
    url: '/case',
    data: params,
  })

/** 分页获取指定分类下的装修案例 */
export const getCasePageByCategoryApi = (categoryId: number, pageNum: number, pageSize: number) =>
  request<RenovationCasePage>({
    method: 'GET',
    url: `/case-category/${categoryId}/cases`,
    data: { pageNum, pageSize },
  })

/** 获取装修案例详情，userId 用于判断当前用户是否已收藏 */
export const getCaseDetailApi = (id: number, userId: number) =>
  request<RenovationCaseDetail | null>({
    method: 'GET',
    url: `/case/detail/${id}`,
    data: { userId },
  })

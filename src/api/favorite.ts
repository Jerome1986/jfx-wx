import { request } from '@/utils/http'

export interface CreateFavoriteInput {
  userId: number
  caseId: number
}

export interface ToggleFavoriteResult {
  isFavorite: boolean
}

/** 收藏接口返回的案例详情，扩展字段以后端实际返回为准 */
export interface FavoriteCaseItem {
  id: number
  title: string
  cover?: string | null
  description?: string | null
  status?: string
  [key: string]: unknown
}

/** 用户收藏记录 */
export interface FavoriteItem {
  id: number
  userId: number
  caseId: number
  createdAt: string
  case: FavoriteCaseItem
}

/** 获取指定用户收藏的全部案例 */
export const getUserFavoritesApi = (userId: number) =>
  request<FavoriteItem[]>({
    method: 'GET',
    url: `/favorite/user/${userId}`,
  })

/** 切换装修案例收藏状态 */
export const toggleFavoriteApi = (data: CreateFavoriteInput) =>
  request<ToggleFavoriteResult>({
    method: 'POST',
    url: '/favorite/toggle',
    data,
  })

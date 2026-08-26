import { request } from '@/utils/http'

export interface CreateFavoriteInput {
  userId: number
  caseId: number
}

export interface ToggleFavoriteResult {
  isFavorite: boolean
}

/** 切换装修案例收藏状态 */
export const toggleFavoriteApi = (data: CreateFavoriteInput) =>
  request<ToggleFavoriteResult>({
    method: 'POST',
    url: '/favorite/toggle',
    data,
  })

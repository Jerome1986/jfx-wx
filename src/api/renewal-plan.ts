import { request } from '@/utils/http'
import type { RenewalPlan, RenewalPlanResponse } from '@/types/space-renewal'

const normalizePlan = (plan: RenewalPlanResponse): RenewalPlan => ({
  ...plan,
  summary: plan.summary ?? '',
  tags: Array.isArray(plan.tags)
    ? plan.tags.filter((tag) => typeof tag === 'string' && tag.trim().length > 0)
    : [],
  shareTitle: plan.shareTitle ?? '',
  shareImage: plan.shareImage ?? '',
})

/** 获取全部焕新方案（客户端展示时需自行过滤发布状态） */
export const getRenewalPlanListApi = async () => {
  const response = await request<RenewalPlanResponse[]>({
    method: 'GET',
    url: '/renewal-plan',
  })
  return { ...response, data: response.data.map(normalizePlan) }
}

/** 获取焕新方案详情 */
export const getRenewalPlanDetailApi = async (id: number) => {
  const response = await request<RenewalPlanResponse | null>({
    method: 'GET',
    url: `/renewal-plan/${id}`,
  })
  return { ...response, data: response.data ? normalizePlan(response.data) : null }
}

import { request } from '@/utils/http'
import type { RenewalPlan } from '@/types/space-renewal'

/** 获取全部焕新方案（客户端展示时需自行过滤发布状态） */
export const getRenewalPlanListApi = () => {
  return request<RenewalPlan[]>({
    method: 'GET',
    url: '/renewal-plan',
  })
}

/** 获取焕新方案详情 */
export const getRenewalPlanDetailApi = (id: number) => {
  return request<RenewalPlan | null>({
    method: 'GET',
    url: `/renewal-plan/${id}`,
  })
}

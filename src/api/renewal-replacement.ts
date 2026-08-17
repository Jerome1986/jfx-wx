import { request } from '@/utils/http'
import type {
  CreateRenewalAppointmentPayload,
  RenewalAppointmentResult,
} from '@/types/renewal-replacement'
import type { RenewalPlanProduct } from '@/types/space-renewal'

/** 获取可替换商品列表 */
export const getRenewalReplacementProductsApi = () => {
  return request<RenewalPlanProduct[]>({
    method: 'GET',
    url: '/product',
  })
}

/** 提交用户调整后的焕新方案预约快照 */
export const createRenewalAppointmentApi = (data: CreateRenewalAppointmentPayload) => {
  return request<RenewalAppointmentResult>({
    method: 'POST',
    url: '/renewal-appointment',
    data,
  })
}

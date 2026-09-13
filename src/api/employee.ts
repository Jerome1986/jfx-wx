import { request } from '@/utils/http'

/** 员工今日待办统计 */
export interface EmployeeSummary {
  pendingContactCount: number
  pendingVisitCount: number
  pendingConfirmCount: number
  inServiceCount: number
}

export const getEmployeeSummary = () => {
  return request<EmployeeSummary>({
    method: 'GET',
    url: '/employee/summary',
  })
}

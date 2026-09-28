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

/** 员工本月业绩概览，金额单位为元 */
export interface EmployeePerformanceSummary {
  month: string
  signedCustomerCount: number
  signedAmount: string
  completedProjectCount: number
  companyRank: number | null
}

export const getEmployeePerformanceSummary = () => {
  return request<EmployeePerformanceSummary>({
    method: 'GET',
    url: '/employee/performance/summary',
  })
}

export interface EmployeePerformanceRank {
  employeeId: number
  name: string
  rank: number | null
  signedAmount: string
}
export interface EmployeePerformanceProject {
  id: number
  name: string
  customerName: string
  mobile: string
  signedAmount: string
  planName: string | null
  completedAt: string | null
}
export interface EmployeePerformanceCenter {
  month: string
  summary: {
    signedAmount: string
    signedProjectCount: number
    completedProjectCount: number
    averageSignedAmount: string
    companyRank: number | null
  }
  totals: { signedAmount: string; completedProjectCount: number }
  rankings: EmployeePerformanceRank[]
  currentEmployee: EmployeePerformanceRank
  projects: {
    list: EmployeePerformanceProject[]
    total: number
    pageNum: number
    pageSize: number
    totalPage: number
  }
}
/** 业绩中心，month 为 YYYY-MM 或 all，金额单位为元 */
export const getEmployeePerformanceCenter = (params: {
  month: string
  pageNum: number
  pageSize: number
}) =>
  request<EmployeePerformanceCenter>({
    method: 'GET',
    url: '/employee/performance/center',
    data: params,
  })

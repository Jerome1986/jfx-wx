import { request } from '@/utils/http'
import type { Appointment, AppointmentType } from '@/types/renovation-business'

export interface PlanAppointmentItemInput {
  sourceItemId: number
  candidateId?: number | null
  productId?: number | null
  category: string
  name: string
  description?: string | null
  unit: string
  unitPrice: string
  quantity: string
  image?: string | null
}

export interface PlanAppointmentSnapshotInput {
  title: string
  cover?: string | null
  referencePrice: string
  items: PlanAppointmentItemInput[]
}

export interface CreatePlanAppointmentInput {
  userId: number
  planId: number
  snapshot: PlanAppointmentSnapshotInput
}

export interface CreatePlanAppointmentResult {
  appointmentId: number
  appointmentNo: string
}

/** 装修计算器预约提交参数 */
export interface CreateBudgetAppointmentInput {
  appointmentNo: string
  userId: number
  type: 'BUDGET'
  source: '装修计算器'
  mobile: string
  houseType: '旧房' | '新房'
  city: string
  area: string
  roomLayout: string
}

/** 预约列表查询参数 */
export interface AppointmentListParams {
  pageNum: number
  pageSize: number
  type: AppointmentType | 'ALL'
}

/** 预约列表分页结果 */
export interface AppointmentListResult {
  list: Appointment[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

/** 取消预约结果 */
export interface CancelAppointmentResult {
  id: number
  appointmentNo: string
  type: AppointmentType
  status: Appointment['status']
  canceledAt: string | null
}

/** 提交焕新方案预约 */
export const createPlanAppointmentApi = (data: CreatePlanAppointmentInput) =>
  request<CreatePlanAppointmentResult>({
    method: 'POST',
    url: '/appointment/plan',
    data,
  })

/** 提交装修计算器预约 */
export const createBudgetAppointmentApi = (data: CreateBudgetAppointmentInput) =>
  request<Appointment>({
    method: 'POST',
    url: '/appointment/budget',
    data,
  })

/** 分页获取预约列表 */
export const getAppointmentListApi = (params: AppointmentListParams) =>
  request<AppointmentListResult>({
    method: 'GET',
    url: '/appointment',
    data: params,
  })

/** 根据预约 ID 获取预约详情 */
export const getAppointmentDetailApi = (id: number) =>
  request<Appointment>({
    method: 'GET',
    url: `/appointment/detail/${id}`,
  })

/** 取消焕新方案预约 */
export const cancelAppointmentApi = (id: number) =>
  request<CancelAppointmentResult>({
    method: 'PATCH' as UniApp.RequestOptions['method'],
    url: `/appointment/${id}/cancel`,
  })

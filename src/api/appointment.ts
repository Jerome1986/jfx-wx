import type {
  AssignedAppointmentListParams,
  AppointmentListParams,
  CreateBudgetAppointmentInput,
  CreatePlanAppointmentInput,
  CreatePlanAppointmentResult,
  AppointmentListResult,
  CancelAppointmentResult,
  AppointmentFollowUpResult,
  AppointmentConfirmVisitResult,
  AppointmentCompleteResult,
  CompleteAppointmentInput,
} from '@/types/appointment'
import { request } from '@/utils/http'
import type { Appointment } from '@/types/renovation-business'

/** 分页获取分配给当前员工的预约 */
export const getAssignedAppointmentListApi = (params: AssignedAppointmentListParams) =>
  request<AppointmentListResult>({
    method: 'GET',
    url: '/appointment/assigned',
    data: params,
  })

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

/** 提交跟进记录 */
export const appointmentFollowUp = (id: number, content: string, employeeId: number) =>
  request<AppointmentFollowUpResult>({
    method: 'POST',
    url: `/appointment/${id}/follow-up`,
    data: { content, employeeId },
  })

/** 预约状态转换成待上门 */
export const appointmentConfirmVisit = (
  id: number,
  visitDate: string,
  timeSlot: string,
  visitAddress: string,
) =>
  request<AppointmentConfirmVisitResult>({
    method: 'POST',
    url: `/appointment/${id}/confirm-visit`,
    data: { visitDate, timeSlot, visitAddress },
  })

/** 完成预约；报价类预约同时提交上门测量后的预估报价 */
export const appointmentComplete = (id: number, data?: CompleteAppointmentInput) =>
  request<AppointmentCompleteResult>({
    method: 'POST',
    url: `/appointment/${id}/complete`,
    data,
  })

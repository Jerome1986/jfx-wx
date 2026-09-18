import { request } from '@/utils/http'
import type {
  CreateProjectInput,
  CreateProjectResult,
  ProjectDetailResult,
  EmployeeProjectListParams,
  EmployeeProjectListResult,
  UserProjectListParams,
  UserProjectListResult,
  UpdateProjectQuoteInput,
  CancelProjectInput,
} from '@/types/project'

// 后端取消接口已实现并完成本地迁移，启用真实请求。
export const PROJECT_CANCEL_API_ENABLED = true

/** 员工取消项目，传入原因及打开弹窗时的状态。 */
export const cancelEmployeeProjectApi = (id: number, data: CancelProjectInput) =>
  request<ProjectDetailResult>({
    method: 'PATCH' as UniApp.RequestOptions['method'],
    url: `/employee/projects/${id}/cancel`,
    data,
  })

/** 员工创建装修项目并保存报价明细 */
export const createEmployeeProjectApi = (data: CreateProjectInput) => {
  // 1. 将已校验的建项表单和报价明细提交给员工项目接口。
  return request<CreateProjectResult>({
    method: 'POST',
    url: '/employee/projects',
    data,
  })
}

/** 获取装修项目详情 */
export const getProjectDetailApi = (id: number) => {
  return request<ProjectDetailResult>({
    method: 'GET',
    url: `/renovation-project/${id}`,
  })
}

/** 获取员工负责的装修项目详情。 */
export const getEmployeeProjectDetailApi = (id: number) => {
  return request<ProjectDetailResult>({
    method: 'GET',
    url: `/employee/projects/${id}`,
  })
}

/** 分页获取员工负责的装修项目。 */
export const getEmployeeProjectListApi = (params: EmployeeProjectListParams) => {
  return request<EmployeeProjectListResult>({
    method: 'GET',
    url: '/employee/projects',
    data: params,
  })
}

/** 员工将服务中的装修项目标记为已完成。 */
export const completeEmployeeProjectApi = (id: number) => {
  return request<unknown>({
    method: 'PATCH' as UniApp.RequestOptions['method'],
    url: `/employee/projects/${id}/complete`,
  })
}

/** 客户确认项目报价并开始服务。 */
export const confirmProjectQuoteApi = (id: number, quoteVersion: number) => {
  return request<unknown>({
    method: 'PATCH' as UniApp.RequestOptions['method'],
    url: `/renovation-project/${id}/confirm`,
    data: { quoteVersion },
  })
}

/** 员工提交完整报价明细及进入编辑时的版本。 */
export const updateEmployeeProjectQuoteApi = (id: number, data: UpdateProjectQuoteInput) =>
  request<ProjectDetailResult>({
    method: 'PATCH' as UniApp.RequestOptions['method'],
    url: `/employee/projects/${id}/quote`,
    data,
  })

/** 分页获取当前用户的装修项目 */
export const getUserProjectListApi = (params: UserProjectListParams) => {
  return request<UserProjectListResult>({
    method: 'GET',
    url: '/renovation-project/user',
    data: params,
  })
}

import { request } from '@/utils/http'
import type {
  CreateProjectInput,
  CreateProjectResult,
  ProjectDetailResult,
  EmployeeProjectListParams,
  EmployeeProjectListResult,
  UserProjectListParams,
  UserProjectListResult,
} from '@/types/project'

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
export const confirmProjectQuoteApi = (id: number) => {
  return request<unknown>({
    method: 'PATCH' as UniApp.RequestOptions['method'],
    url: `/renovation-project/${id}/confirm`,
  })
}

/** 分页获取当前用户的装修项目 */
export const getUserProjectListApi = (params: UserProjectListParams) => {
  return request<UserProjectListResult>({
    method: 'GET',
    url: '/renovation-project/user',
    data: params,
  })
}

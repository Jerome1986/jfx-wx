import { request } from '@/utils/http'
import type {
  CreateProjectInput,
  CreateProjectResult,
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

/** 获取员工装修项目详情 */
export const getEmployeeProjectDetailApi = (id: number) => {
  return request<CreateProjectResult>({
    method: 'GET',
    url: `/renovation-project/${id}`,
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

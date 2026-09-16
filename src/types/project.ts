import type { ProjectQuote } from './project-quote'
import type { RenovationProject, RenovationProjectStatus } from './renovation-business'

export interface CreateProjectQuoteItemInput {
  productId?: number | null
  category: string
  name: string
  description?: string | null
  image?: string | null
  unit: string
  unitPrice: string
  quantity: string
}

export interface CreateProjectInput {
  appointmentId?: number | null
  userId?: number
  customerName: string
  mobile: string
  serviceAddress: string
  planId: number
  name: string
  quoteItems: CreateProjectQuoteItemInput[]
}

export interface ProjectQuoteItemResult extends CreateProjectQuoteItemInput {
  id?: number
  projectId?: number
  sort?: number
}

export interface CreateProjectResult extends Partial<Omit<RenovationProject, 'id'>> {
  id: number
  projectNo?: string
  status?: RenovationProjectStatus
  quote?: ProjectQuote
  quoteItems?: ProjectQuoteItemResult[]
}

export type UserProjectListStatus = 'ALL' | 'PENDING_CONFIRM' | 'IN_SERVICE' | 'COMPLETED'

/** 项目详情关联的员工信息。 */
export interface ProjectEmployeeResult {
  id: number
  employeeNo: string
  department: string
  position: string
  serviceRegions: string[]
  hiredAt: string
  status: boolean
  createdAt: string
  updatedAt: string
  user: {
    realName: string | null
  } | null
}

/** 项目详情关联的焕新方案信息。 */
export interface ProjectPlanResult {
  id: number
  name: string
  cover: string
  detail: string
  summary: string
  images: string[] | null
  tags: string[]
  startingPrice: string
  status: string
  sort: number
  isRecommended: boolean
  recommendSort: number
  shareTitle: string
  shareImage: string
  createdAt: string
  updatedAt: string
}

/** 项目详情金额兼容后端 Decimal 字符串。 */
export interface ProjectDetailResult extends Omit<CreateProjectResult, 'quotedAmount'> {
  quotedAmount?: number | string | null
  followUps?: import('./renovation-business').FollowUp[]
  employee?: ProjectEmployeeResult | null
  plan?: ProjectPlanResult | null
}

export interface UserProjectListParams {
  status: UserProjectListStatus
  pageNum: number
  pageSize: number
}

export interface UserProjectListResult {
  list: RenovationProject[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

export type EmployeeProjectListParams = UserProjectListParams
export type EmployeeProjectListResult = UserProjectListResult

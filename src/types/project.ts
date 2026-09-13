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
  planId?: number | null
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

export type QuoteSource = 'appointment' | 'api'

export interface ProjectQuoteLine {
  id: string
  source: QuoteSource
  productId?: number | null
  sourceItemId?: number
  candidateId?: number | null
  /** 后台方案明细分类，用于筛选同类替换项 */
  businessCategory?: string
  category: 'product' | 'service'
  name: string
  description: string
  image: string
  unit: string
  unitPrice: string
  quantity: string
}

export interface ProjectQuote {
  items: ProjectQuoteLine[]
  discount: string
}

export interface ProjectDraft {
  customerName: string
  mobile: string
  serviceAddress: string
  name: string
  renovationScope: string
  planId?: number
  planName?: string
  planSource?: QuoteSource
  quote: ProjectQuote
  remark: string
}

export interface ProjectPlanCandidate {
  id: number
  name: string
  description: string
  cover?: string
  items: ProjectQuoteLine[]
}

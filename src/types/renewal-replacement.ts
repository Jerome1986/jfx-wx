export type RenewalReplacementType = 'PRODUCT' | 'SERVICE'

export interface RenewalReplacementCandidate {
  id: number
  productId: number | null
  category: string
  name: string
  description: string
  unit: string
  unitPrice: string
  quantity: string
  image: string
}

export interface RenewalAppointmentItem {
  sourceItemId: number
  candidateId: number | null
  productId: number | null
  category: string
  name: string
  description: string
  unit: string
  unitPrice: string
  quantity: string
  image: string
}

export interface CreateRenewalAppointmentPayload {
  planId: number
  items: RenewalAppointmentItem[]
}

export interface RenewalAppointmentResult {
  id: number
}

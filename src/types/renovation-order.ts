export type RenovationStatus = 'pending' | 'servicing' | 'completed'
export type RenovationFilterStatus = 'all' | RenovationStatus

export interface RenovationOrder {
  id: number
  status: RenovationStatus
  description: string
  detailLabel: string
  detailValue: string
  amountLabel: string
  secondaryAction: string
  primaryAction: string
}

import type { RenovationStatus } from './renovation-order'

export type { RenovationStatus }

export interface RenovationStatusConfig {
  label: string
  description: string
  note: string
  footerAction: string
}

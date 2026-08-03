export type ServiceType = 'measure' | 'quote'
export type ServiceStatus = 'contact' | 'service' | 'completed'
export type ServiceFilterType = 'all' | ServiceType | 'completed'

export interface ServiceOrder {
  id: number
  title: string
  source: string
  type: ServiceType
  status: ServiceStatus
  lines: string[]
  footer: string
  secondaryAction?: string
  primaryAction: string
}

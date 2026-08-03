export type AppointmentServiceType = 'quote' | 'measure'
export type AppointmentServiceStatus = 'contact' | 'service' | 'completed'

export interface AppointmentInfoRow {
  label: string
  value: string
}

export interface AppointmentServiceItem {
  id: number
  type: AppointmentServiceType
  status: AppointmentServiceStatus
  title: string
  source: string
  submitTime: string
  customer: string
  mobile: string
  phoneNumber: string
  demand: string
  focus: string
  city: string
  info: AppointmentInfoRow[]
  serviceContent: string
  visitDate: string
  visitTime: string
  address: string
  communicationRecord: string
}

export interface AppointmentSchedule {
  visitDate: string
  visitTime: string
  address: string
  communicationRecord: string
}

export interface AppointmentDate {
  label: string
  date: string
  fullDate: string
  timestamp: number
}

export interface TimeSlot {
  time: string
  label: string
}

export interface CalendarConfirmEvent {
  value: number | number[] | null
}

export type UserRole = 'customer' | 'employee'

export interface MemberProfile {
  role?: UserRole
  employeeId?: string
  name?: string
  nickname?: string
  mobile?: string
  avatar?: string
  [key: string]: unknown
}

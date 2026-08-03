export type PointsType = 'all' | 'income' | 'expense'

export interface PointsRecord {
  id: number
  type: 'income' | 'expense'
  title: string
  description: string
  date: string
  amount: number
}

export type FeeTab = '全部' | '主材' | '人工+辅材'

export interface ServiceItem {
  id: number
  title: string
  description: string
  price: number
  quantity: number
  image: string
  selected: boolean
}

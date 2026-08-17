export type FeeTab = '全部' | '主材' | '人工+辅材'

export interface ServiceItem {
  id: number
  sourceItemId: number
  candidateId: number | null
  productId: number | null
  title: string
  description: string
  price: number
  quantity: number
  category: string
  unit: string
  image: string
  selected: boolean
}

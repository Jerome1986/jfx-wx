export type QuoteCategory = 'all' | 'main' | 'labor'

export interface QuoteItem {
  id: number
  category: Exclude<QuoteCategory, 'all'>
  title: string
  description: string
  price: number
  unit: string
  quantity: number
  image: string
  selected: boolean
}

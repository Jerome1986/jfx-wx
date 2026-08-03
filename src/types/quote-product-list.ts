export interface QuoteProductItem {
  id: number
  name: string
  description: string
  price: number
  image: string
}

export interface QuoteProductPage {
  getOpenerEventChannel?: () => UniApp.EventChannel
}

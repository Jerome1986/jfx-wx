export interface RenewalPlan {
  id: number
  name: string
  summary: string
  tags: string[]
  startingPrice: string
  cover: string
  images: string[]
  detail: string
  shareTitle: string
  shareImage: string
  sort: number
  isRecommended: boolean
  recommendSort: number
  status: 'DRAFT' | 'PUBLISHED' | 'OFFLINE'
  createdAt: string
  updatedAt: string
  items: RenewalPlanItem[]
}

export interface RenewalPlanItem {
  id: number
  planId: number
  productId: number | null
  category: string
  name: string
  description: string
  unit: string
  unitPrice: string
  quantity: string
  image: string
  sort: number
  product: RenewalPlanProduct | null
}

export interface RenewalPlanProduct {
  id: number
  categoryId: number
  name: string
  description: string
  brand: string
  model: string
  specifications: string[]
  price: string
  stock: number
  mainImage: string
  detailImages: string[]
  installationIncluded: boolean
  isPublished: boolean
  sort: number
  createdAt: string
  updatedAt: string
}

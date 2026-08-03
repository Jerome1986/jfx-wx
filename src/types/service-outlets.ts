export type OutletCategory = '全部' | '距离最近' | '装修咨询' | '售后服务'

export interface ServiceOutlet {
  id: number
  name: string
  distance: number
  time: string
  address: string
  categories: OutletCategory[]
  image: string
}

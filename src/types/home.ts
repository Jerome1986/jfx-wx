export interface SelectedCase {
  id: number
  title: string
  label: string
  isFavorite: boolean
  beforeCover: string
  afterCover: string
  location: string
  roomType: string
  area: string
  tags: string[]
  price: string
  duration: string
  receivedCount: number
}

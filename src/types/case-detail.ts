export interface CaseDetail {
  title: string
  label: string
  beforeCover: string
  afterCover: string
  location: string
  roomType: string
  area: string
  style: string
  price: string
  description: string
  highlights: Array<{ title: string; description: string }>
  costs: Array<{ name: string; value: string }>
}

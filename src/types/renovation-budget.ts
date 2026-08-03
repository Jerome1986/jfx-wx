export interface BudgetForm {
  houseType: 'old' | 'new'
  city: string
  area: string
  layout: string
  phone: string
}

export interface BenefitItem {
  icon: string
  title: string
  description: string
}

export interface CalculationNote {
  icon: string
  content: string
}

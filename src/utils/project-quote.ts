import type { ProjectQuote, ProjectQuoteLine } from '@/types/project-quote'
import type { RenewalReplacementCandidate } from '@/types/renewal-replacement'

export const copyQuoteData = <T>(value: T): T => JSON.parse(JSON.stringify(value))
export const newQuoteLineId = () => `line-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

// 金额按分、数量按百分之一计算，避免逐项浮点累加误差。
export const scaledValue = (value: string) => {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return NaN
  const [whole, fraction = ''] = value.trim().split('.')
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(result) ? result : NaN
}

export const lineCents = (line: ProjectQuoteLine) => {
  const product = scaledValue(line.unitPrice) * scaledValue(line.quantity)
  return Number.isSafeInteger(product) && product >= 0 && product <= Number.MAX_SAFE_INTEGER - 50
    ? Math.floor((product + 50) / 100)
    : NaN
}

export const quoteTotals = (quote: ProjectQuote) => {
  let product = 0
  let service = 0
  for (const item of quote.items) {
    const cents = lineCents(item)
    if (Number.isFinite(cents)) {
      if (item.category === 'product') product += cents
      else service += cents
    }
  }
  const discount = scaledValue(quote.discount)
  return {
    product,
    service,
    subtotal: product + service,
    discount,
    total: product + service - discount,
  }
}

export const validateQuoteLine = (item: ProjectQuoteLine) => {
  if (!item.name.trim() || !item.unit.trim()) return '请填写明细名称和计价单位'
  if (!(scaledValue(item.unitPrice) > 0)) return '单价须大于零，最多两位小数'
  if (!(scaledValue(item.quantity) > 0)) return '数量须大于零，最多两位小数'
  if (!Number.isFinite(lineCents(item)) || lineCents(item) <= 0)
    return '明细金额无效，请检查单价和数量'
  return ''
}

export const validateQuote = (quote: ProjectQuote) => {
  if (!quote.items.length) return '请至少添加一条报价明细'
  for (const item of quote.items) {
    const error = validateQuoteLine(item)
    if (error) return `${item.name || '报价明细'}：${error}`
  }
  const totals = quoteTotals(quote)
  if (!Number.isSafeInteger(totals.subtotal)) return '报价金额超出可计算范围'
  if (!Number.isFinite(totals.discount)) return '优惠须为非负金额，最多两位小数'
  if (totals.discount >= totals.subtotal) return '优惠须小于明细合计金额'
  return ''
}

export const moneyText = (cents: number) =>
  Number.isFinite(cents) ? (cents / 100).toFixed(2) : '—'

export const hasDuplicateReplacement = (
  items: ProjectQuoteLine[],
  current: ProjectQuoteLine,
  candidate: RenewalReplacementCandidate,
) =>
  items.some((item) => {
    if (item.id === current.id) return false
    if (candidate.productId !== null) return item.productId === candidate.productId
    if (item.category !== 'service') return false
    // 已替换服务按施工服务目录 ID 判断，原方案服务缺少目录 ID 时按名称兜底。
    return item.candidateId
      ? item.candidateId === candidate.id
      : item.name.trim() === candidate.name.trim()
  })

export const applyReplacement = (
  item: ProjectQuoteLine,
  candidate: RenewalReplacementCandidate,
) => {
  Object.assign(item, {
    candidateId: candidate.id,
    productId: candidate.productId,
    category: candidate.productId === null ? 'service' : 'product',
    businessCategory: candidate.category,
    name: candidate.name,
    description: candidate.description,
    unit: candidate.unit,
    unitPrice: candidate.unitPrice,
    quantity: candidate.quantity,
    image: candidate.image,
  })
}

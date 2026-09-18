import type { ProjectQuote, ProjectQuoteLine } from '@/types/project-quote'
import type { RenewalReplacementCandidate } from '@/types/renewal-replacement'
import type { UpdateProjectQuoteInput } from '@/types/project'

// 按更新接口白名单组装完整明细，保留进入编辑时的版本。
export const buildQuoteUpdate = (
  planId: number,
  quoteVersion: number,
  quoteRemark: string,
  items: ProjectQuoteLine[],
): UpdateProjectQuoteInput => {
  if (!Number.isSafeInteger(planId) || planId <= 0) throw new Error('请选择标准方案')
  if (!Number.isSafeInteger(quoteVersion) || quoteVersion <= 0)
    throw new Error('缺少报价版本，请重新加载')
  if (quoteRemark.trim().length > 500) throw new Error('修改说明不能超过500字')
  if (!items.length) throw new Error('请至少添加一条报价明细')
  return {
    planId,
    quoteVersion,
    quoteRemark: quoteRemark.trim() || null,
    quoteItems: items.map((item) => {
      const category = item.businessCategory?.trim() || ''
      if (!category || !item.name.trim() || !item.unit.trim())
        throw new Error('明细分类、名称和单位不能为空')
      if (!(scaledValue(item.unitPrice) >= 0)) throw new Error('单价须为非负数，最多两位小数')
      if (!(scaledValue(item.quantity) > 0)) throw new Error('数量须大于零，最多两位小数')
      return {
        productId: item.productId ?? null,
        category,
        name: item.name.trim(),
        unit: item.unit.trim(),
        unitPrice: item.unitPrice.trim(),
        quantity: item.quantity.trim(),
        description: item.description.trim() || null,
        image: item.image.trim() || null,
      }
    }),
  }
}

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
    const raw = scaledValue(item.unitPrice) * scaledValue(item.quantity)
    if (Number.isSafeInteger(raw) && raw >= 0) {
      if (item.category === 'product') product += raw
      else service += raw
    }
  }
  // 先汇总万分之一元，再统一四舍五入到分，与后端总金额规则一致。
  const round = (value: number) =>
    Number.isSafeInteger(value + 50) ? Math.floor((value + 50) / 100) : NaN
  const subtotal = round(product + service)
  const discount = scaledValue(quote.discount)
  return {
    product: round(product),
    service: round(service),
    subtotal,
    discount,
    total: subtotal - discount,
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

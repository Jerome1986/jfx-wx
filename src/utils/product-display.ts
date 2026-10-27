import type { ProductResponseItem, ProductSku, ProductItem } from '@/types/product'

export const validSkuPrice = (price: unknown): boolean =>
  (typeof price === 'number' || typeof price === 'string') &&
  String(price).trim() !== '' &&
  Number.isFinite(Number(price)) &&
  Number(price) >= 0

export const enabledSkus = (product: Pick<ProductResponseItem, 'skus'>): ProductSku[] =>
  (Array.isArray(product.skus) ? product.skus : []).filter(
    (sku) => sku.isEnabled === true && !sku.deletedAt,
  )

export const productPriceText = (product: Pick<ProductResponseItem, 'skus'>): string => {
  const prices = enabledSkus(product)
    .filter((sku) => validSkuPrice(sku.price))
    .map((sku) => Number(sku.price))
  if (!prices.length) return '暂无报价'
  const min = Math.min(...prices)
  return `¥${min.toFixed(2)}${Math.max(...prices) > min ? '起' : ''}`
}

export const toProductItem = (product: ProductResponseItem): ProductItem => {
  const prices = enabledSkus(product)
    .filter((sku) => validSkuPrice(sku.price))
    .map((sku) => Number(sku.price))
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? '',
    image: product.mainImage?.[0] ?? '',
    price: prices.length ? Math.min(...prices) : null,
    priceText: productPriceText(product),
  }
}

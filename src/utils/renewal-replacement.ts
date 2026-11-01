import type {
  ProductReplacementPage,
  RenewalReplacementCandidate,
} from '@/types/renewal-replacement'
import { enabledSkus, validSkuPrice } from './product-display'

/** 每个可选规格使用自己的价格，规格名称随方案快照保存。 */
export const toReplacementCandidates = (
  product: ProductReplacementPage['list'][number],
  category: string,
  quantity: string,
): RenewalReplacementCandidate[] =>
  enabledSkus(product)
    .filter((sku) => sku.stock > 0 && validSkuPrice(sku.price))
    .map((sku) => ({
      id: product.id,
      skuId: sku.id,
      productId: product.id,
      category,
      name: `${product.name}（${sku.name}）`,
      description: product.description ?? '',
      unit: product.unit,
      unitPrice: Number(sku.price).toFixed(2),
      quantity,
      image: product.mainImage?.[0] ?? '',
    }))

export const replacementCandidateKey = (candidate: RenewalReplacementCandidate) =>
  candidate.productId === null
    ? `service-${candidate.id}`
    : `product-${candidate.id}-${candidate.skuId}`

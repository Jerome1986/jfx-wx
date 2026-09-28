import { computed, ref, watch } from 'vue'
import { onUnload } from '@dcloudio/uni-app'
import { getProductDetail } from '@/api/product'
import type { ProductDetail } from '@/types/product'
import type { CartItem } from '@/types/cart'
import { cartItemKey } from '@/stores/modules/cart'

// undefined 表示校验失败，null 表示商品已不存在，两者不能混为下架。
export const productIssue = (
  product: ProductDetail | null | undefined,
  specification: string,
  quantity: number,
): string => {
  if (product === undefined) return '商品校验失败，请重试'
  if (product === null) return '商品已不存在'
  if (
    typeof product.isPublished !== 'boolean' ||
    !Number.isInteger(product.stock) ||
    product.stock < 0 ||
    !['string', 'number'].includes(typeof product.price) ||
    String(product.price).trim() === '' ||
    !Number.isFinite(Number(product.price)) ||
    Number(product.price) < 0 ||
    !(product.specifications === null || Array.isArray(product.specifications))
  ) {
    return '商品信息不完整，请重试'
  }
  if (!product.isPublished) return '商品已下架'
  const specifications = product.specifications ?? []
  if (specifications.length ? !specifications.includes(specification) : !!specification)
    return '商品规格已失效，请重新选择'
  if (quantity > product.stock) return '库存不足，请调整数量'
  return ''
}

// 购物车与结算页共用，校验结果仅保留在当前页面，不持久化旧库存。
export const useProductCheck = (getItems: () => CartItem[], getOwner: () => string) => {
  const checking = ref(false)
  const notice = ref('')
  const details = ref<Record<number, ProductDetail | null | undefined>>({})
  let version = 0
  const issues = computed(() => {
    const items = getItems()
    return Object.fromEntries(
      items.map((item) => {
        const quantity = item.selected
          ? items
              .filter((other) => other.id === item.id && other.selected)
              .reduce((sum, other) => sum + other.quantity, 0)
          : item.quantity
        return [
          cartItemKey(item),
          productIssue(details.value[item.id], item.specification, quantity),
        ]
      }),
    )
  })
  const invalidate = () => {
    version++
    checking.value = false
    notice.value = ''
    details.value = {}
  }
  watch(getOwner, invalidate, { flush: 'sync' })
  onUnload(invalidate)

  const refresh = async () => {
    if (checking.value || !getOwner()) return false
    const current = ++version
    const owner = getOwner()
    const snapshot = JSON.stringify(getItems())
    const ids = [...new Set(getItems().map((item) => item.id))]
    const latest: Record<number, ProductDetail | null | undefined> = {}
    checking.value = true
    notice.value = ''
    // 分组请求，限制微信端并发数，同商品多规格只查询一次。
    for (let start = 0; start < ids.length; start += 4) {
      await Promise.all(
        ids.slice(start, start + 4).map(async (id) => {
          try {
            const result = await getProductDetail(id)
            latest[id] = result.code === 200 ? result.data : undefined
          } catch (error) {
            latest[id] = (error as { statusCode?: number }).statusCode === 404 ? null : undefined
          }
        }),
      )
      if (current !== version || owner !== getOwner()) return false
    }
    checking.value = false
    if (snapshot !== JSON.stringify(getItems())) {
      notice.value = '商品选择已变化，请重新校验'
      return false
    }
    details.value = latest
    let priceChanged = false
    for (const item of getItems()) {
      const product = latest[item.id]
      if (!product || productIssue(product, item.specification, 0)) continue
      if (Math.round(item.price * 100) !== Math.round(Number(product.price) * 100))
        priceChanged = true
      item.price = Number(product.price)
      item.name = product.name
      item.image = product.mainImage
      item.installationIncluded = product.installationIncluded
    }
    const invalid = getItems().find((item) => item.selected && issues.value[cartItemKey(item)])
    notice.value = invalid
      ? invalid.name + '：' + issues.value[cartItemKey(invalid)]
      : priceChanged
      ? '商品价格已更新，请核对金额后再次提交'
      : ''
    return !invalid && !priceChanged
  }
  return { checking, notice, issues, refresh }
}

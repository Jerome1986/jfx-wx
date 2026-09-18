import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useMemberStore } from './member'
import type { CartItem } from '@/types/cart'

export type CartProduct = Omit<CartItem, 'quantity' | 'selected'>
export const cartItemKey = (item: Pick<CartItem, 'id' | 'specification'>) =>
  JSON.stringify([item.id, item.specification])
export const priceInCents = (price: number) => Math.round((price + Number.EPSILON) * 100)
export const formatPrice = (price: number) => (priceInCents(price) / 100).toFixed(2)
const sumCents = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + priceInCents(item.price) * item.quantity, 0)

export const useCartStore = defineStore(
  'cart',
  () => {
    const member = useMemberStore()
    const carts = ref<Record<string, CartItem[]>>({})
    const checkoutSnapshot = ref<CartItem[]>([])
    const checkoutOwner = ref('')
    const userId = computed(() => {
      const id = member.profile?.id
      return member.token && typeof id === 'number' && Number.isSafeInteger(id) && id > 0
        ? String(id)
        : ''
    })
    const items = computed(() => (userId.value ? carts.value[userId.value] ?? [] : []))
    const totalCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
    const selectedItems = computed(() => items.value.filter((item) => item.selected))
    const selectedCount = computed(() =>
      selectedItems.value.reduce((sum, item) => sum + item.quantity, 0),
    )
    const selectedTotal = computed(() => (sumCents(selectedItems.value) / 100).toFixed(2))
    const allSelected = computed(
      () => items.value.length > 0 && items.value.every((item) => item.selected),
    )
    const checkoutItems = computed(() =>
      userId.value && checkoutOwner.value === userId.value ? checkoutSnapshot.value : [],
    )
    const checkoutTotal = computed(() => (sumCents(checkoutItems.value) / 100).toFixed(2))
    const validProduct = (item: CartProduct) =>
      Number.isSafeInteger(item.id) && item.id > 0 && Number.isFinite(item.price) && item.price >= 0

    const addItem = (product: CartProduct) => {
      if (!userId.value || !validProduct(product)) return false
      const list = carts.value[userId.value] ?? (carts.value[userId.value] = [])
      const item = list.find((entry) => cartItemKey(entry) === cartItemKey(product))
      if (item) {
        Object.assign(item, product, { quantity: item.quantity + 1, selected: true })
      } else list.push({ ...product, quantity: 1, selected: true })
      return true
    }
    const setQuantity = (key: string, quantity: number) => {
      if (!Number.isSafeInteger(quantity) || quantity < 1) return
      const item = items.value.find((entry) => cartItemKey(entry) === key)
      if (item) item.quantity = quantity
    }
    const removeItem = (key: string) => {
      if (userId.value)
        carts.value[userId.value] = items.value.filter((item) => cartItemKey(item) !== key)
    }
    const setSelected = (key: string, selected: boolean) => {
      const item = items.value.find((entry) => cartItemKey(entry) === key)
      if (item) item.selected = selected
    }
    const selectAll = (selected: boolean) =>
      items.value.forEach((item) => {
        item.selected = selected
      })
    const clearCheckout = () => {
      checkoutSnapshot.value = []
      checkoutOwner.value = ''
    }
    const prepareCheckout = (product?: CartProduct) => {
      clearCheckout()
      if (!userId.value || (product && !validProduct(product))) return false
      const list = product ? [{ ...product, quantity: 1, selected: true }] : selectedItems.value
      if (!list.length) return false
      checkoutSnapshot.value = list.map((item) => ({ ...item }))
      checkoutOwner.value = userId.value
      return true
    }
    watch(userId, clearCheckout, { flush: 'sync' })
    return {
      carts,
      items,
      userId,
      totalCount,
      selectedItems,
      selectedCount,
      selectedTotal,
      allSelected,
      checkoutSnapshot,
      checkoutOwner,
      checkoutItems,
      checkoutTotal,
      addItem,
      setQuantity,
      removeItem,
      setSelected,
      selectAll,
      prepareCheckout,
      clearCheckout,
    }
  },
  { persist: { paths: ['carts'] } },
)

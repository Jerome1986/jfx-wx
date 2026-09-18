import { useCartStore } from '@/stores/modules/cart'

let openingLogin = false
export const requireCartLogin = (returnTo: string) => {
  if (useCartStore().userId) return true
  if (!openingLogin) {
    openingLogin = true
    uni.showToast({ title: '请先登录', icon: 'none' })
    uni.navigateTo({
      url: `/pages/login/login?returnTo=${encodeURIComponent(returnTo)}`,
      complete: () => {
        openingLogin = false
      },
    })
  }
  return false
}

export const syncCartBadge = (count: number) => {
  if (count > 0)
    uni.setTabBarBadge({ index: 2, text: count > 99 ? '99+' : String(count), fail: () => {} })
  else uni.removeTabBarBadge({ index: 2, fail: () => {} })
}

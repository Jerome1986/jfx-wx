<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { watch } from 'vue'
import { useCartStore } from '@/stores/modules/cart'
import { syncCartBadge } from '@/utils/cart-access'

const cartStore = useCartStore()
watch(() => cartStore.totalCount, syncCartBadge)

onLaunch(() => {
  console.log('App Launch')
})
onShow(() => {
  syncCartBadge(cartStore.totalCount)
  console.log('App Show')
})
onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@use '@/styles/wot-theme.scss';
@import '@/styles/iconfonts/iconfont.css';

page {
  background-color: $jfx-pageBackGroundColor;
  height: 100%;
  // 原生页面允许内容滚动；使用 scroll-view 的页面自行约束容器高度。
  box-sizing: border-box;
}
</style>

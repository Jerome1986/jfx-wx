<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
})
onShow(() => {
  console.log('App Show')
})
onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@import '@/styles/iconfonts/iconfont.css';

page {
  background-color: $jfx-pageBackGroundColor;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
</style>

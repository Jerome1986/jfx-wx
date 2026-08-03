<script setup lang="ts">
defineProps<{
  title: string
  subTitle: string
}>()

const emit = defineEmits<{
  more: []
}>()
</script>

<template>
  <view class="section-header">
    <view class="title-group">
      <view class="title">{{ title }}</view>
      <view class="sub-title">{{ subTitle }}</view>
    </view>
    <view class="more-link" @click="emit('more')">
      <text>查看全部</text>
      <text class="iconfont icon-youjiantou"></text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.section-header {
  padding: 0 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title-group {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .title {
      color: $jfx-font-title;
      font-weight: bold;
    }

    .sub-title {
      color: $jfx-font-dec;
      font-size: 24rpx;
    }
  }

  .more-link {
    display: flex;
    align-items: center;
    font-size: 24rpx;
    color: $jfx-font-dec2;

    .icon-youjiantou {
      font-size: 20rpx;
      font-weight: bold;
    }
  }
}
</style>

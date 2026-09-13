<script setup lang="ts">
import type { ProjectQuoteLine } from '@/types/project-quote'
defineProps<{ item: ProjectQuoteLine; replaceable?: boolean }>()
defineEmits<{ (event: 'replace'): void }>()
</script>
<template>
  <view class="service-card">
    <image
      v-if="item.image"
      class="service-image"
      :class="{ 'material-image': item.category === 'product' }"
      :src="item.image"
      :mode="item.category === 'product' ? 'aspectFit' : 'aspectFill'"
    />
    <view v-else class="service-image image-placeholder"
      ><text>{{ item.category === 'product' ? '商品' : '服务' }}</text></view
    >
    <view class="service-content">
      <view class="service-title">{{ item.name }}</view>
      <view class="service-description">{{ item.description || '暂无描述' }}</view>
      <view class="service-price"
        ><text class="price-number">¥ {{ item.unitPrice }}</text
        ><text>/{{ item.unit }} × {{ item.quantity }}</text></view
      >
    </view>
    <button v-if="replaceable" class="replace-button" @click="$emit('replace')">替换</button>
  </view>
</template>
<style scoped lang="scss">
.service-card {
  position: relative;
  display: flex;
  min-height: 180rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(48, 35, 30, 0.035);
}
.service-image {
  width: 150rpx;
  height: 150rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
  background: #f0efed;
}
.material-image {
  object-fit: contain;
  background: #f7f7f7;
}
.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 22rpx;
}
.service-content {
  min-width: 0;
  padding: 0 92rpx 0 18rpx;
  flex: 1;
}
.service-title {
  display: -webkit-box;
  overflow: hidden;
  color: #333;
  font-size: 27rpx;
  line-height: 38rpx;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.service-description {
  overflow: hidden;
  margin-top: 6rpx;
  color: #999;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 32rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.service-price {
  display: flex;
  margin-top: 12rpx;
  align-items: baseline;
  color: #888;
  font-size: 21rpx;
  font-weight: 400;
}
.price-number {
  margin-right: 8rpx;
  color: #e83228;
  font-size: 28rpx;
  font-weight: 600;
}
.replace-button {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  width: auto;
  height: 48rpx;
  padding: 0 20rpx;
  margin: 0;
  color: #e83228;
  background: #fff;
  border: 1rpx solid #e83228;
  border-radius: 24rpx;
  font-size: 22rpx;
  line-height: 46rpx;
}
.replace-button::after {
  border: 0;
}
</style>

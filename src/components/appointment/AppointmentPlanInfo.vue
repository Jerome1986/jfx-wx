<script setup lang="ts">
import { computed } from 'vue'
import type { Appointment } from '@/types/renovation-business'

const props = defineProps<{ appointment: Appointment }>()
const items = computed(() => props.appointment.snapshot?.items || [])
</script>

<template>
  <view class="card">
    <view class="section-title">焕新方案</view>
    <view class="plan-title">{{
      appointment.snapshot?.title || appointment.demand || '方案信息待确认'
    }}</view>
    <view v-if="appointment.snapshot?.referencePrice" class="price"
      >参考金额 ¥{{ appointment.snapshot.referencePrice }}</view
    >
    <view v-if="items.length" class="items">
      <view v-for="(item, index) in items" :key="item.sourceItemId || index" class="item">
        <text>{{ item.name }}</text
        ><text>{{ item.quantity || '-' }}{{ item.unit || '' }}</text>
      </view>
    </view>
    <view v-else class="hint">方案明细待确认</view>
  </view>
</template>

<style scoped lang="scss">
.card {
  margin-bottom: 20rpx;
  padding: 26rpx;
  background: #fff;
  border-radius: 18rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 700;
}
.plan-title {
  margin-top: 20rpx;
  color: #333;
  font-size: 27rpx;
  font-weight: 600;
}
.price {
  margin-top: 12rpx;
  color: #d92d20;
  font-size: 24rpx;
}
.items {
  margin-top: 18rpx;
  border-top: 1rpx solid #eee;
}
.item {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  padding: 16rpx 0;
  color: #555;
  font-size: 23rpx;
  border-bottom: 1rpx solid #eee;
}
.hint {
  margin-top: 16rpx;
  color: #999;
  font-size: 23rpx;
}
</style>

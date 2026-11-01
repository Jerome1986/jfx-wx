<script setup lang="ts">
import type { RenovationProject } from '@/types/renovation-business'
defineProps<{ project: RenovationProject }>()
</script>

<template>
  <view v-if="project.contractAmount != null" class="project-coupon-summary">
    <view v-if="project.couponSnapshot" class="coupon-line">
      <text>{{ project.couponSnapshot.name }}</text>
      <text>−¥{{ Number(project.couponDiscount || 0).toFixed(2) }}</text>
    </view>
    <view v-if="project.couponReturnedAt" class="coupon-returned"
      >项目已取消，优惠券已返还；过期券不可再次使用</view
    >
    <view class="coupon-line contract-amount">
      <text>{{ project.status === 'CANCELED' ? '原合同金额' : '合同金额' }}</text>
      <text>¥{{ Number(project.contractAmount).toFixed(2) }}</text>
    </view>
  </view>
</template>

<style scoped>
.coupon-line {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 20rpx;
  font-size: 26rpx;
}
.contract-amount {
  color: #d92d20;
  font-weight: 600;
}
.coupon-returned {
  margin-top: 16rpx;
  color: #777;
  font-size: 24rpx;
}
</style>

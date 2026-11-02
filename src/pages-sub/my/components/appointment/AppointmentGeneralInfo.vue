<script setup lang="ts">
import type { Appointment } from '@/types/renovation-business'

defineProps<{ appointment: Appointment }>()
</script>

<template>
  <view class="card">
    <view class="section-title">预约资料</view>
    <view class="row"
      ><text>房屋类型</text><text>{{ appointment.houseType || '待沟通确认' }}</text></view
    >
    <view class="row"
      ><text>所在城市</text><text>{{ appointment.city || '待沟通确认' }}</text></view
    >
    <view class="row"
      ><text>房屋面积</text
      ><text>{{ appointment.area ? `${appointment.area}㎡` : '待沟通确认' }}</text></view
    >
    <view class="row"
      ><text>房屋户型</text><text>{{ appointment.roomLayout || '待沟通确认' }}</text></view
    >
    <view class="row"
      ><text>预约需求</text><text>{{ appointment.demand || '待沟通确认' }}</text></view
    >
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
.row {
  display: flex;
  justify-content: space-between;
  gap: 30rpx;
  margin-top: 20rpx;
  color: #777;
  font-size: 24rpx;
}
.row text:last-child {
  max-width: 70%;
  color: #333;
  text-align: right;
  overflow-wrap: anywhere;
}
</style>

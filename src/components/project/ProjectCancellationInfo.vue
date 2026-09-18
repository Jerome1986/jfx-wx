<script setup lang="ts">
import type { RenovationProject } from '@/types/renovation-business'
import { formatDateTime } from '@/utils/format'
defineProps<{ project: RenovationProject }>()
</script>
<template>
  <view class="cancellation">
    <view class="heading">取消记录</view>
    <view class="reason">{{ project.cancelReason || '暂无取消原因记录' }}</view>
    <view v-if="project.canceledAt" class="time"
      >取消时间：{{ formatDateTime(project.canceledAt) }}</view
    >
    <view class="note">项目已停止，原报价及明细保留供查看。</view>
  </view>
</template>
<style scoped lang="scss">
.cancellation {
  margin: 24rpx 0;
  padding: 26rpx;
  background: #f2f0ee;
  border-radius: 16rpx;
}
.heading {
  color: #665e58;
  font-size: 26rpx;
  font-weight: 500;
}
.reason {
  margin-top: 16rpx;
  color: #777;
  font-size: 25rpx;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.time,
.note {
  margin-top: 12rpx;
  color: #99918c;
  font-size: 22rpx;
  line-height: 1.5;
}
</style>

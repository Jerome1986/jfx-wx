<script setup lang="ts">
import { projectStatusText } from '@/stores/modules/renovation-business'
import type { RenovationProjectStatus } from '@/types/renovation-business'

defineProps<{ status: RenovationProjectStatus }>()
const statusClass: Record<RenovationProjectStatus, string> = {
  PENDING_CONFIRM: 'status--pending',
  IN_SERVICE: 'status--active',
  COMPLETED: 'status--completed',
  CANCELED: 'status--cancelled',
}
</script>

<template>
  <view class="status" :class="statusClass[status]">{{ projectStatusText[status] }}</view>
</template>

<style scoped lang="scss">
.status {
  flex-shrink: 0;
  padding: 7rpx 14rpx;
  color: #9b6c21;
  font-size: 20rpx;
  line-height: 1.2;
  background: #fff6e7;
  border-radius: 999rpx;
}

.status--active {
  color: #35679b;
  background: #eef6ff;
}

.status--completed {
  color: #31815a;
  background: #edf8f1;
}

.status--cancelled {
  color: #8d8885;
  background: #f2f1f0;
}
</style>

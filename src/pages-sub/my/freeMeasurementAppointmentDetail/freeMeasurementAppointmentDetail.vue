<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import AppointmentServiceDetail from '@/components/AppointmentServiceDetail.vue'

// 预约编号
const appointmentId = ref(0)
// 返回详情页时通知子组件重新读取预约及关联项目。
const refreshVersion = ref(0)
onShow(() => refreshVersion.value++)

onLoad((options) => {
  // 当前数据编号
  const id = Number(options?.id)
  if (Number.isInteger(id) && id > 0) appointmentId.value = id
})
</script>

<template>
  <AppointmentServiceDetail :appointment-id="appointmentId" :refresh-version="refreshVersion" />
</template>

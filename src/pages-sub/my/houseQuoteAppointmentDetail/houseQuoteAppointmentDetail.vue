<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppointmentServiceDetail from '@/components/AppointmentServiceDetail.vue'

const appointmentId = ref(1)

onLoad((options) => {
  const id = Number(options?.id)
  if (Number.isInteger(id) && id > 0) appointmentId.value = id
})
</script>

<template>
  <AppointmentServiceDetail :appointment-id="appointmentId" />
</template>

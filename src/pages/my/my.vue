<script setup lang="ts">
import { computed } from 'vue'
import { useMemberStore } from '@/stores'
import CustomerMy from '@/components/my/CustomerMy.vue'
import EmployeeMy from '@/components/my/EmployeeMy.vue'

const memberStore = useMemberStore()
const isEmployee = computed(() => memberStore.profile?.role === 'employee')
</script>

<template>
  <EmployeeMy v-if="isEmployee" />
  <CustomerMy v-else />
</template>

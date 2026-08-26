<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed } from 'vue'
import { getUserSummary, userInfoFindOne } from '@/api/user'
import { useMemberStore } from '@/stores'
import CustomerMy from '@/components/my/CustomerMy.vue'
import EmployeeMy from '@/components/my/EmployeeMy.vue'

// 会员状态仓库
const memberStore = useMemberStore()
// 当前用户是否为员工
const isEmployee = computed(() => memberStore.profile?.role === 'EMPLOYEE')
// 刷新状态
let refreshing = false

// 每次进入“我的”页面时刷新用户资料和统计概览
onShow(async () => {
  // 当前用户资料
  const currentProfile = memberStore.profile
  // 用户编号
  const userId = Number(currentProfile?.id)
  if (!currentProfile || !Number.isInteger(userId) || userId <= 0 || refreshing) return

  refreshing = true
  try {
    const [{ data: userInfo }, { data: summary }] = await Promise.all([
      userInfoFindOne(userId),
      getUserSummary(userId),
    ])
    memberStore.setProfile({
      ...currentProfile,
      ...userInfo,
      ...summary,
      role: userInfo.role,
      name: userInfo.realName,
    })
  } catch (error) {
    console.error('刷新用户资料失败：', error)
  } finally {
    refreshing = false
  }
})
</script>

<template>
  <EmployeeMy v-if="isEmployee" />
  <CustomerMy v-else />
</template>

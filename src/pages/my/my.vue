<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed } from 'vue'
import { getUserSummary, userInfoFindOne } from '@/api/user'
import { useMemberStore } from '@/stores'
import CustomerMy from '@/components/my/CustomerMy.vue'
import EmployeeMy from '@/components/my/EmployeeMy.vue'

// 会员状态仓库
const memberStore = useMemberStore()
// 是否为开发环境
const isDevelopment = import.meta.env.DEV
// 打开开发调试页面
const openDevDebug = () => {
  uni.navigateTo({ url: '/pages-sub/my/devDebug/devDebug' })
}
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
    // 切换账号后忽略旧账号尚未完成的请求。
    if (memberStore.profile !== currentProfile) return
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
  <view v-if="isDevelopment" class="dev-debug-entry">
    <button class="dev-debug-button" @click="openDevDebug">开发调试</button>
  </view>
</template>

<style scoped lang="scss">
.dev-debug-entry {
  position: fixed;
  right: 24rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom) + var(--window-bottom, 0px));
  z-index: 10;
}
.dev-debug-button {
  color: #d92d20;
  font-size: 28rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.12);
  &::after {
    border: 0;
  }
}
</style>

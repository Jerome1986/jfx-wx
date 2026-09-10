<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { devLoginApi } from '@/api/dev-login'
import { useMemberStore, useRenovationBusinessStore } from '@/stores'
import { useAddressStore } from '@/stores/modules/address'
import type { UserRole } from '@/types/UserItem'

// 是否为开发环境
const isDevelopment = import.meta.env.DEV
// 会员状态仓库
const memberStore = useMemberStore()
// 地址状态仓库
const addressStore = useAddressStore()
// 装修业务状态仓库
const businessStore = useRenovationBusinessStore()
// 正在切换的账号角色
const pendingRole = ref<UserRole | ''>('')
// 开发登录错误信息
const errorMessage = ref('')
// 当前账号角色名称
const currentRole = computed(() =>
  memberStore.profile?.role === 'EMPLOYEE' ? '员工账号' : '用户账号',
)

onLoad(() => {
  if (!isDevelopment) uni.reLaunch({ url: '/pages/my/my' })
})

// 登录指定角色的测试账号
const login = async (role: UserRole) => {
  if (!isDevelopment || pendingRole.value) return
  pendingRole.value = role
  errorMessage.value = ''
  try {
    const { data } = await devLoginApi(role)
    if (
      !data?.token ||
      typeof data.token !== 'string' ||
      !Number.isInteger(data.user?.id) ||
      data.user.id <= 0 ||
      data.user.role !== role
    ) {
      errorMessage.value = '登录信息不完整或角色不匹配，请检查开发登录接口返回。'
      return
    }

    // 成功获取目标会话后再清理，接口失败时保留当前账号。
    addressStore.setAddresses([])
    businessStore.$patch({ appointments: [], followUps: [], projects: [] })
    memberStore.clearProfile()
    memberStore.setProfile({ ...data.user, name: data.user.realName })
    memberStore.setToken(data.token)
    // 等待持久化完成，请求拦截器会从 storage 读取新 token。
    await nextTick()
    memberStore.$persist()
    uni.reLaunch({
      url: '/pages/my/my',
      fail: () => {
        errorMessage.value = '账号已切换，页面跳转失败，请手动返回“我的”。'
      },
    })
  } catch {
    errorMessage.value = '开发登录失败，请确认后端接口已接入且服务可用。'
  } finally {
    pendingRole.value = ''
  }
}
</script>

<template>
  <view v-if="isDevelopment" class="debug-page">
    <view class="account-card">
      <text class="caption">当前登录账号</text>
      <template v-if="memberStore.profile">
        <text class="account-name">
          {{ memberStore.profile.nickname || memberStore.profile.name || '未设置姓名' }}
        </text>
        <text class="account-detail">{{ currentRole }} · ID：{{ memberStore.profile.id }}</text>
      </template>
      <text v-else class="account-name">尚未登录</text>
    </view>

    <view class="login-card">
      <text class="title">切换测试账号</text>
      <text class="description">选择账号登录，成功后自动返回“我的”。</text>
      <button
        class="login-button employee"
        :loading="pendingRole === 'EMPLOYEE'"
        :disabled="!!pendingRole"
        @click="login('EMPLOYEE')"
      >
        员工登录
      </button>
      <button
        class="login-button customer"
        :loading="pendingRole === 'CUSTOMER'"
        :disabled="!!pendingRole"
        @click="login('CUSTOMER')"
      >
        用户登录
      </button>
      <text v-if="errorMessage" class="error-message">{{ errorMessage }}</text>
    </view>
    <text class="footnote">仅开发环境可用 · 使用真实测试账号数据</text>
  </view>
</template>

<style scoped lang="scss">
.debug-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 32rpx;
  background: #f8f7f5;
}
.account-card,
.login-card {
  padding: 36rpx;
  margin-bottom: 28rpx;
  background: #fff;
  border-radius: 24rpx;
}
.caption,
.account-name,
.account-detail,
.title,
.description,
.error-message,
.footnote {
  display: block;
}
.caption,
.description,
.account-detail {
  color: #777;
  font-size: 26rpx;
  line-height: 42rpx;
}
.account-name,
.title {
  color: #252525;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 52rpx;
}
.account-name {
  margin: 14rpx 0 6rpx;
}
.description {
  margin: 12rpx 0 32rpx;
}
.login-button {
  margin-top: 24rpx;
  font-size: 30rpx;
  border-radius: 16rpx;
  &::after {
    border: 0;
  }
}
.employee {
  color: #fff;
  background: #d92d20;
}
.customer {
  color: #d92d20;
  background: #fff0ed;
}
.error-message {
  margin-top: 24rpx;
  color: #d92d20;
  font-size: 26rpx;
  line-height: 40rpx;
}
.footnote {
  color: #999;
  text-align: center;
  font-size: 24rpx;
}
</style>

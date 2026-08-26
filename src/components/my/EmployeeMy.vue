<script setup lang="ts">
import { computed } from 'vue'
import { useMemberStore } from '@/stores'

const memberStore = useMemberStore()
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0
const isLoggedIn = computed(() => Boolean(memberStore.profile))
const fallbackAvatar =
  'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/avatar/kefutouxiang.png'
const consultantIcon =
  'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/钻石 1.png'
const caseImage = 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/房屋改造后.png'

const employeeName = computed(
  () => memberStore.profile?.nickname || memberStore.profile?.name || '点击登录',
)
const employeeAvatar = computed(() => memberStore.profile?.avatar || fallbackAvatar)
const employeeMobile = computed(() => {
  const mobile = memberStore.profile?.mobile
  if (!mobile) return '登录后查看工作数据'
  if (mobile.length < 7) return mobile
  return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
})

const todos = [
  { value: '8', label: '待联系', highlight: true },
  { value: '18', label: '待上门' },
  { value: '811', label: '待确认' },
  { value: '3', label: '服务中' },
]
const performance = [
  { value: '32', label: '签约客户' },
  { value: '18', label: '签约金额' },
  { value: '18', label: '完成项目' },
  { value: '100', label: '公司排名' },
]
const workbench = [
  {
    label: '我的客户',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/客户1.png',
  },
  {
    label: '我的项目',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/跟进记录1.png',
  },
  {
    label: '业绩中心',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/收入统计1.png',
  },
  {
    label: '我的案例',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/我的案例1.png',
  },
]

const showComingSoon = (label: string) => {
  uni.showToast({ title: `${label}功能建设中`, icon: 'none' })
}

const requireLogin = () => {
  if (isLoggedIn.value) return true
  uni.navigateTo({ url: '/pages/login/login' })
  return false
}

const openPerformanceCenter = () => {
  if (!requireLogin()) return
  uni.navigateTo({ url: '/pages-sub/my/performanceCenter/performanceCenter' })
}

const openCaseList = () => {
  if (!requireLogin()) return
  uni.navigateTo({ url: '/pages/caseList/caseList?source=employee' })
}

const openProfile = () => {
  if (!requireLogin()) return
  uni.navigateTo({ url: '/pages-sub/my/settings/settings' })
}

const handleWorkbenchClick = (label: string) => {
  if (!requireLogin()) return
  if (label === '我的客户') {
    uni.navigateTo({
      url: '/pages-sub/my/appointmentService/appointmentService?status=all',
    })
    return
  }

  if (label === '我的项目') {
    uni.navigateTo({
      url: '/pages-sub/my/employeeRenovationOrder/employeeRenovationOrder?status=all',
    })
    return
  }

  if (label === '我的案例') {
    uni.navigateTo({
      url: '/pages-sub/my/favorites/favorites?source=employee',
    })
    return
  }

  if (label === '业绩中心') {
    openPerformanceCenter()
    return
  }
  showComingSoon(label)
}

const handleTodoClick = (label: string) => {
  if (!requireLogin()) return
  const renovationStatus = {
    待确认: 'PENDING_CONFIRM',
    服务中: 'IN_SERVICE',
  }[label]

  if (renovationStatus) {
    uni.navigateTo({
      url: `/pages-sub/my/employeeRenovationOrder/employeeRenovationOrder?status=${renovationStatus}`,
    })
    return
  }

  const appointmentStatus = {
    待联系: 'PENDING_CONTACT',
    待上门: 'PENDING_VISIT',
  }[label]

  if (appointmentStatus) {
    uni.navigateTo({
      url: `/pages-sub/my/appointmentService/appointmentService?status=${appointmentStatus}`,
    })
    return
  }
  showComingSoon(label)
}
</script>

<template>
  <view class="employee-page">
    <scroll-view class="employee-scroll" scroll-y :show-scrollbar="false">
      <view class="profile-hero">
        <view class="safe-area" :style="{ height: `${statusBarHeight}px` }" />
        <view class="page-title"><text>我</text><text class="brand-text">的</text></view>
        <view class="profile-row" @click="openProfile">
          <image class="avatar" :src="employeeAvatar" mode="aspectFill" />
          <view class="profile-copy">
            <view class="profile-name">{{ employeeName }}</view>
            <view class="profile-mobile">{{ employeeMobile }}</view>
            <view v-if="isLoggedIn" class="consultant-badge">
              <image class="consultant-icon" :src="consultantIcon" mode="aspectFit" />
              <text>高级顾问</text>
            </view>
            <view v-else class="login-tip"
              >立即登录 <text class="iconfont icon-youjiantou login-arrow"
            /></view>
          </view>
        </view>
      </view>

      <view class="page-content">
        <view class="content-card todo-card">
          <view class="card-heading">
            <text class="card-title">今日待办</text>
            <view class="all-link" @click="requireLogin() && showComingSoon('全部待办')">
              <text>共有18项待办</text><text class="iconfont icon-youjiantou arrow" />
            </view>
          </view>
          <view class="data-grid">
            <view
              v-for="item in todos"
              :key="item.label"
              class="data-item"
              @click="handleTodoClick(item.label)"
            >
              <text :class="['data-value', { highlight: item.highlight }]">{{ item.value }}</text>
              <text class="data-label">{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="content-card notice-card" @click="requireLogin() && showComingSoon('公告')">
          <text class="notice-label">公告</text>
          <text class="notice-copy">本周六有《谈单技巧提升》线下培训，欢迎参加~</text>
        </view>

        <view class="content-card performance-card" @click="openPerformanceCenter">
          <view class="card-heading">
            <text class="card-title">业绩概览</text>
            <view class="all-link">
              <text>本月数据</text><text class="iconfont icon-youjiantou arrow" />
            </view>
          </view>
          <view class="data-grid performance-grid">
            <view v-for="item in performance" :key="item.label" class="data-item">
              <text class="data-value">{{ item.value }}</text>
              <text class="data-label muted">{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="content-card workbench-card">
          <view class="card-title">我的工作台</view>
          <view class="workbench-grid">
            <view
              v-for="item in workbench"
              :key="item.label"
              class="workbench-item"
              @click="handleWorkbenchClick(item.label)"
            >
              <image class="workbench-icon" :src="item.icon" mode="aspectFit" />
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="case-banner" @click="openCaseList">
          <image class="case-image" :src="caseImage" mode="aspectFill" />
          <view class="case-copy">
            <view class="case-title">精选案例分享</view>
            <view class="case-subtitle">最新装修案例与谈单素材</view>
            <view class="case-button">
              <text>立即查看</text><text class="iconfont icon-youjiantou case-arrow" />
            </view>
          </view>
        </view>

        <view class="bottom-space" />
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.employee-page {
  height: 100vh;
  overflow: hidden;
  color: #222;
  background: #f8f7f5;
}

.employee-scroll {
  height: 100%;
}

.profile-hero {
  box-sizing: border-box;
  padding: 0 24rpx 26rpx;
  background: #fff
    url('https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/beijingtu/my-beijing.png')
    center bottom / cover no-repeat;
}

.safe-area {
  width: 100%;
  flex-shrink: 0;
}

.page-title {
  padding-top: 19rpx;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 54rpx;
}

.brand-text {
  color: #ed342e;
}

.profile-row {
  display: flex;
  margin-top: 12rpx;
  align-items: center;
}

.avatar {
  width: 122rpx;
  height: 122rpx;
  flex-shrink: 0;
  background: #eee;
  border-radius: 50%;
}

.profile-copy {
  margin-left: 28rpx;
}

.profile-name {
  font-size: 29rpx;
  font-weight: 500;
  line-height: 40rpx;
}

.profile-mobile {
  margin-top: 2rpx;
  font-size: 25rpx;
  line-height: 34rpx;
}

.login-tip {
  display: flex;
  margin-top: 10rpx;
  align-items: center;
  color: #ed342e;
  font-size: 24rpx;
  line-height: 34rpx;
}

.login-arrow {
  margin-left: 4rpx;
  font-size: 22rpx;
}

.consultant-badge {
  display: flex;
  width: fit-content;
  height: 38rpx;
  margin-top: 10rpx;
  padding: 0 16rpx;
  align-items: center;
  color: #ed342e;
  font-size: 22rpx;
  line-height: 38rpx;
  background: #fff0ef;
  border-radius: 20rpx;
}

.consultant-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 8rpx;
}

.page-content {
  padding: 0 24rpx;
}

.content-card {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 5rpx 24rpx rgba(55, 42, 32, 0.035);
}

.todo-card {
  box-sizing: border-box;
  height: 188rpx;
  padding: 26rpx 24rpx 20rpx;
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
  line-height: 38rpx;
}

.all-link {
  display: flex;
  align-items: center;
  color: #888;
  font-size: 23rpx;
  line-height: 34rpx;
}

.arrow {
  margin-left: 4rpx;
  font-size: 24rpx;
  line-height: 1;
}

.data-grid {
  display: grid;
  margin-top: 28rpx;
  grid-template-columns: repeat(4, 1fr);
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.data-value {
  font-size: 26rpx;
  line-height: 36rpx;
}

.data-value.highlight {
  color: #e52d24;
}

.data-label {
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 34rpx;
}

.notice-card {
  display: flex;
  height: 88rpx;
  margin-top: 24rpx;
  padding: 0 24rpx;
  align-items: center;
}

.notice-label {
  flex-shrink: 0;
  color: #e52d24;
  font-size: 27rpx;
  font-weight: 600;
}

.notice-copy {
  overflow: hidden;
  margin-left: 20rpx;
  color: #777;
  font-size: 23rpx;
  line-height: 34rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.performance-card {
  box-sizing: border-box;
  height: 190rpx;
  margin-top: 24rpx;
  padding: 26rpx 24rpx 20rpx;
}

.performance-grid {
  margin-top: 28rpx;
}

.data-label.muted {
  color: #777;
}

.workbench-card {
  box-sizing: border-box;
  height: 206rpx;
  margin-top: 24rpx;
  padding: 26rpx 24rpx 22rpx;
}

.workbench-grid {
  display: grid;
  margin-top: 28rpx;
  grid-template-columns: repeat(4, 1fr);
}

.workbench-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 34rpx;
}

.workbench-icon {
  width: 50rpx;
  height: 50rpx;
  margin-bottom: 10rpx;
}

.case-banner {
  position: relative;
  height: 270rpx;
  margin-top: 24rpx;
  overflow: hidden;
  background: #f1dfca;
  border-radius: 18rpx;
}

.case-image {
  position: absolute;
  top: 0;
  right: 0;
  width: 62%;
  height: 100%;
}

.case-copy {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  width: 48%;
  height: 100%;
  padding: 58rpx 0 0 40rpx;
  background: rgba(250, 232, 211, 0.94);
}

.case-title {
  font-size: 36rpx;
  font-weight: 600;
  line-height: 48rpx;
}

.case-subtitle {
  margin-top: 8rpx;
  color: #555;
  font-size: 22rpx;
  line-height: 32rpx;
}

.case-button {
  display: flex;
  width: fit-content;
  height: 52rpx;
  margin-top: 24rpx;
  padding: 0 22rpx;
  align-items: center;
  color: #fff;
  font-size: 22rpx;
  background: #ff4a43;
  border-radius: 28rpx;
  box-shadow: 0 5rpx 12rpx rgba(229, 45, 36, 0.22);
}

.case-arrow {
  margin-left: 10rpx;
  font-size: 20rpx;
}

.bottom-space {
  height: calc(40rpx + env(safe-area-inset-bottom));
}
</style>

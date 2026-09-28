<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow, onUnload } from '@dcloudio/uni-app'
import {
  getEmployeePerformanceCenter,
  type EmployeePerformanceCenter,
  type EmployeePerformanceProject,
} from '@/api/employee'
import { useMemberStore } from '@/stores'

const memberStore = useMemberStore()
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0
const periods = ref<{ value: string; label: string }[]>([])
const activePeriod = ref('')
const result = ref<EmployeePerformanceCenter>()
const projects = ref<EmployeePerformanceProject[]>([])
const loading = ref(false)
const error = ref(false)
const pageNum = ref(0)
const totalPage = ref(0)
let requestId = 0
let currentMonth = ''

const updatePeriods = () => {
  const date = new Date(Date.now() + 8 * 60 * 60 * 1000)
  const months = Array.from({ length: 3 }, (_, index) => {
    const month = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - index, 1))
    const value = month.toISOString().slice(0, 7)
    return { value, label: value.replace('-', '年') + '月' }
  })
  if (!activePeriod.value || activePeriod.value === currentMonth)
    activePeriod.value = months[0].value
  currentMonth = months[0].value
  if (activePeriod.value !== 'all' && !months.some((item) => item.value === activePeriod.value)) {
    activePeriod.value = currentMonth
  }
  periods.value = [...months, { value: 'all', label: '累计' }]
}
const clearData = () => {
  requestId++
  result.value = undefined
  projects.value = []
  pageNum.value = 0
  totalPage.value = 0
  loading.value = false
  error.value = false
}
watch([() => memberStore.profile?.id, () => memberStore.profile?.role], clearData, {
  flush: 'sync',
})
const fetchData = async (append = false) => {
  if (append && (loading.value || pageNum.value >= totalPage.value)) return
  // 保留已展示内容，避免刷新时卡片卸载、页面高度塌陷。
  if (!append) {
    pageNum.value = 0
    totalPage.value = 0
  }
  if (memberStore.profile?.role !== 'EMPLOYEE') {
    clearData()
    return
  }
  const id = ++requestId
  const nextPage = append ? pageNum.value + 1 : 1
  loading.value = true
  error.value = false
  try {
    const { data } = await getEmployeePerformanceCenter({
      month: activePeriod.value,
      pageNum: nextPage,
      pageSize: 10,
    })
    if (id !== requestId) return
    result.value = data
    const existing = append ? projects.value : []
    projects.value = [
      ...new Map([...existing, ...data.projects.list].map((item) => [item.id, item])).values(),
    ]
    pageNum.value = data.projects.pageNum
    totalPage.value = data.projects.totalPage
  } catch {
    if (id === requestId) error.value = true
  } finally {
    if (id === requestId) loading.value = false
  }
}
const selectPeriod = (value: string) => {
  if (activePeriod.value === value) return
  activePeriod.value = value
  void fetchData()
}
const loadMore = () => {
  if (!error.value) void fetchData(true)
}
const retry = () => void fetchData(pageNum.value > 0)
onShow(() => {
  updatePeriods()
  void fetchData()
})
onUnload(clearData)

const displayMonth = computed(() => {
  const month = result.value?.month ?? activePeriod.value
  return month === 'all' ? '累计' : month.replace('-', '年') + '月'
})
const currentEmployee = computed(() => result.value?.currentEmployee)
const rankings = computed(() => result.value?.rankings ?? [])
const showCurrentEmployee = computed(
  () =>
    currentEmployee.value &&
    !rankings.value.some((item) => item.employeeId === currentEmployee.value?.employeeId),
)
const formatAmount = (value?: string) => (value == null ? '—' : '¥' + value)
const formatRank = (value?: number | null) => (value == null ? '—' : '第' + value + '名')
const formatDate = (value: string | null) => {
  if (!value) return '—'
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return '—'
  return new Date(timestamp + 8 * 60 * 60 * 1000).toISOString().slice(0, 10) + ' 已完工'
}
const goBack = () => uni.navigateBack()
const openProject = (id: number) =>
  uni.navigateTo({
    url: '/pages-sub/my/employeeRenovationOrderDetail/employeeRenovationOrderDetail?id=' + id,
  })
</script>

<template>
  <view class="performance-page">
    <view class="safe-area" :style="{ height: statusBarHeight + 'px' }" />
    <view class="custom-navigation">
      <view class="back-button" @click="goBack"
        ><text class="iconfont icon-youjiantou back-icon"
      /></view>
      <text class="navigation-title">业绩中心</text>
      <view class="nav-placeholder" />
    </view>
    <scroll-view class="page-scroll" scroll-y :show-scrollbar="false" @scrolltolower="loadMore">
      <view class="page-content">
        <view class="card filter-card">
          <view class="section-title">月份筛选</view>
          <view v-if="result && pageNum === 0" class="refresh-status">
            <text v-if="loading">更新中…</text>
            <text v-else-if="error" @click="retry">更新失败，点击重试</text>
          </view>
          <view class="period-row">
            <view
              v-for="period in periods"
              :key="period.value"
              :class="['period-pill', { active: activePeriod === period.value }]"
              @click="selectPeriod(period.value)"
              >{{ period.label }}</view
            >
          </view>
        </view>
        <view v-if="memberStore.profile?.role !== 'EMPLOYEE'" class="state-text"
          >请使用员工账号登录后查看</view
        >
        <view v-else-if="loading && !result" class="state-text">加载中…</view>
        <view v-else-if="error && !result" class="state-text" @click="retry"
          >加载失败，点击重试</view
        >
        <view v-if="result" :class="['result-content', { refreshing: pageNum === 0 }]">
          <view class="card summary-card">
            <view class="section-heading">
              <text class="section-title">{{
                result.month === 'all' ? '累计签约' : '签约概览'
              }}</text>
              <text class="section-note">{{ displayMonth }}</text>
            </view>
            <view class="metric-grid">
              <view class="metric"
                ><text class="metric-value red">{{
                  formatAmount(result.summary.signedAmount)
                }}</text
                ><text class="metric-label">签约金额</text></view
              >
              <view class="metric"
                ><text class="metric-value">{{ result.summary.completedProjectCount }}</text
                ><text class="metric-label">完成项目</text></view
              >
              <view class="metric"
                ><text class="metric-value">{{
                  formatAmount(result.summary.averageSignedAmount)
                }}</text
                ><text class="metric-label">平均单值</text></view
              >
              <view class="metric"
                ><text class="metric-value red">{{ formatRank(result.summary.companyRank) }}</text
                ><text class="metric-label">公司排名</text></view
              >
            </view>
            <view class="total-row"
              ><text>累计签约金额</text
              ><text class="total-value">{{ formatAmount(result.totals.signedAmount) }}</text
              ><text class="total-projects"
                >累计完成{{ result.totals.completedProjectCount }}个项目</text
              ></view
            >
          </view>
          <view class="card ranking-card">
            <view class="section-heading"
              ><text class="section-title">公司签约排名</text
              ><text class="ranking-note">{{
                currentEmployee?.rank == null
                  ? '当前员工暂未上榜'
                  : '当前员工' + formatRank(currentEmployee.rank)
              }}</text></view
            >
            <view v-if="!rankings.length" class="state-text">暂无签约排名</view>
            <view
              v-for="item in rankings"
              :key="item.employeeId"
              :class="['rank-row', { current: item.employeeId === currentEmployee?.employeeId }]"
            >
              <text class="rank-number">{{ item.rank ?? '—' }}</text
              ><text class="rank-name">{{ item.name }}</text
              ><text class="rank-amount">{{ formatAmount(item.signedAmount) }}</text>
            </view>
            <template v-if="showCurrentEmployee && currentEmployee">
              <view
                v-if="currentEmployee.rank != null && currentEmployee.rank > rankings.length + 1"
                class="ranking-ellipsis"
                >省略中间排名</view
              >
              <view class="rank-row current"
                ><text class="rank-number">{{ currentEmployee.rank ?? '—' }}</text
                ><text class="rank-name">{{ currentEmployee.name }}</text
                ><text class="rank-amount">{{
                  formatAmount(currentEmployee.signedAmount)
                }}</text></view
              >
            </template>
          </view>
          <view class="project-heading"
            ><text class="section-title">完成项目</text
            ><text class="section-note">按完成时间排序</text></view
          >
          <view v-for="project in projects" :key="project.id" class="card project-card">
            <view class="project-top"
              ><view
                ><view class="project-title">{{ project.name }}</view
                ><view class="customer">{{ project.customerName }} {{ project.mobile }}</view></view
              ><button class="view-button" @click="openProject(project.id)">查看</button></view
            >
            <view class="detail-row"
              ><text class="detail-label">签约金额</text
              ><text class="red">{{ formatAmount(project.signedAmount) }}</text></view
            >
            <view class="detail-row"
              ><text class="detail-label">装修方案</text
              ><text>{{ project.planName || '—' }}</text></view
            >
            <view class="detail-row"
              ><text class="detail-label">完成时间</text
              ><text>{{ formatDate(project.completedAt) }}</text></view
            >
          </view>
          <view v-if="loading" class="state-text">加载中…</view>
          <view v-else-if="error" class="state-text" @click="retry">加载失败，点击重试</view>
          <view v-else-if="!projects.length" class="state-text">暂无完成项目</view>
          <view v-else-if="pageNum < totalPage" class="state-text" @click="loadMore"
            >点击加载更多</view
          >
          <view v-else class="state-text">已全部加载</view>
        </view>
        <view class="card statistics-card">
          <view class="section-title">统计口径</view>
          <view class="statistics-copy"
            >签约金额按已完工项目的合同金额统计，月份以完成时间为准</view
          >
          <view class="statistics-copy">平均单值 = 签约金额 ÷ 完成项目数</view>
        </view>
        <view class="bottom-space" />
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.performance-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: #252527;
  background: #f8f7f5;
}
.safe-area {
  flex-shrink: 0;
}
.custom-navigation {
  position: relative;
  display: flex;
  height: 88rpx;
  padding: 0 24rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
}
.back-button,
.nav-placeholder {
  display: flex;
  width: 76rpx;
  height: 100%;
  align-items: center;
}
.back-icon {
  color: #aaa;
  font-size: 34rpx;
  transform: rotate(180deg);
}
.navigation-title {
  position: absolute;
  left: 50%;
  font-size: 34rpx;
  font-weight: 600;
  transform: translateX(-50%);
}
.page-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.page-content {
  padding: 20rpx 24rpx 0;
}
.card {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(55, 42, 32, 0.045);
}
.section-title {
  font-size: 29rpx;
  font-weight: 600;
  line-height: 42rpx;
}
.section-heading,
.project-heading,
.project-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-note {
  color: #777;
  font-size: 24rpx;
}
.filter-card {
  padding: 26rpx 24rpx 24rpx;
}
.period-row {
  display: flex;
  margin-top: 20rpx;
  gap: 24rpx;
}
.period-pill {
  display: flex;
  height: 42rpx;
  padding: 0 20rpx;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  background: #f7f6f4;
  border: 2rpx solid transparent;
  border-radius: 24rpx;
}
.period-pill.active {
  color: #ef342d;
  background: #fff;
  border-color: #ef342d;
}
.summary-card {
  margin-top: 24rpx;
  padding: 26rpx 24rpx 22rpx;
}
.metric-grid {
  display: grid;
  margin-top: 22rpx;
  grid-template-columns: repeat(4, 1fr);
}
.metric {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.metric + .metric::before {
  position: absolute;
  top: 10rpx;
  left: 0;
  width: 2rpx;
  height: 42rpx;
  content: '';
  background: #eee;
}
.metric-value {
  font-size: 27rpx;
  font-weight: 500;
  line-height: 38rpx;
  white-space: nowrap;
}
.red {
  color: #ed342e;
}
.metric-label {
  margin-top: 9rpx;
  color: #777;
  font-size: 23rpx;
  line-height: 32rpx;
  white-space: nowrap;
}
.total-row {
  display: flex;
  height: 52rpx;
  margin-top: 17rpx;
  padding: 0 8rpx;
  align-items: center;
  color: #777;
  font-size: 23rpx;
  background: #fafafa;
  border: 2rpx solid #eee;
  border-radius: 8rpx;
}
.total-value {
  margin-left: 30rpx;
  color: #ed342e;
  font-size: 27rpx;
}
.total-projects {
  margin-left: auto;
}
.ranking-card {
  margin-top: 24rpx;
  padding: 26rpx 24rpx 24rpx;
}
.ranking-note {
  color: #ed342e;
  font-size: 24rpx;
}
.rank-row {
  display: flex;
  height: 40rpx;
  margin-top: 20rpx;
  padding: 0 14rpx;
  align-items: center;
  color: #777;
  font-size: 23rpx;
  background: #fafafa;
  border: 2rpx solid #eee;
  border-radius: 7rpx;
}
.rank-number {
  width: 30rpx;
}
.rank-name {
  margin-left: 4rpx;
}
.rank-amount {
  margin-left: auto;
}
.ranking-ellipsis {
  margin: 20rpx 0 0;
  color: #aaa;
  font-size: 23rpx;
  text-align: center;
}
.rank-row.current {
  margin-top: 18rpx;
  color: #252527;
  background: #fff0ef;
}
.current .rank-number,
.current .rank-amount {
  color: #ed342e;
}
.project-heading {
  margin: 26rpx 0 18rpx;
}
.project-card {
  margin-bottom: 18rpx;
  padding: 24rpx;
  border-left: 2rpx solid #777;
}
.project-top {
  align-items: flex-start;
}
.project-title {
  font-size: 28rpx;
  font-weight: 500;
  line-height: 38rpx;
}
.customer {
  margin-top: 3rpx;
  color: #777;
  font-size: 23rpx;
  line-height: 34rpx;
}
.view-button {
  width: 104rpx;
  height: 43rpx;
  margin: 0;
  padding: 0;
  flex-shrink: 0;
  color: #ed342e;
  font-size: 23rpx;
  line-height: 43rpx;
  background: #fff0ef;
  border-radius: 24rpx;
}
.view-button::after {
  border: 0;
}
.detail-row {
  display: flex;
  margin-top: 10rpx;
  font-size: 23rpx;
  line-height: 31rpx;
}
.detail-label {
  width: 112rpx;
  flex-shrink: 0;
  color: #aaa;
}
.statistics-card {
  margin-top: 24rpx;
  padding: 26rpx 24rpx;
}
.statistics-copy {
  margin-top: 16rpx;
  color: #777;
  font-size: 23rpx;
  line-height: 32rpx;
}
.statistics-copy + .statistics-copy {
  margin-top: 8rpx;
}
.bottom-space {
  height: calc(38rpx + env(safe-area-inset-bottom));
}

.period-row {
  flex-wrap: wrap;
  gap: 16rpx;
}
.metric {
  min-width: 0;
}
.metric-value {
  max-width: 100%;
  font-size: 24rpx;
  white-space: normal;
  overflow-wrap: anywhere;
  text-align: center;
}
.total-row {
  height: auto;
  min-height: 52rpx;
  padding: 8rpx;
  flex-wrap: wrap;
  gap: 8rpx 16rpx;
}
.total-value {
  margin-left: 0;
  overflow-wrap: anywhere;
}
.rank-row {
  height: auto;
  min-height: 40rpx;
  gap: 8rpx;
}
.rank-number {
  width: auto;
  min-width: 30rpx;
  flex-shrink: 0;
}
.rank-name {
  min-width: 0;
  overflow-wrap: anywhere;
}
.rank-amount {
  flex-shrink: 0;
}
.detail-label {
  flex-shrink: 0;
}
.project-top > view,
.detail-row > text:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
}
.state-text {
  padding: 28rpx 0;
  color: #888;
  font-size: 24rpx;
  text-align: center;
}

.filter-card {
  position: relative;
}
.refresh-status {
  position: absolute;
  top: 30rpx;
  right: 24rpx;
  color: #888;
  font-size: 23rpx;
  line-height: 34rpx;
}
.result-content.refreshing {
  pointer-events: none;
}
</style>

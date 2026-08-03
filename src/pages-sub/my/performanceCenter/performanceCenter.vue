<script setup lang="ts">
import { computed, ref } from 'vue'

type Period = '2026年07月' | '06月' | '05月' | '累计'

const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0
const activePeriod = ref<Period>('2026年07月')
const periods: Period[] = ['2026年07月', '06月', '05月', '累计']
const rankings = [
  { rank: 1, name: '刘经理', amount: '¥15.2万' },
  { rank: 2, name: '王经理', amount: '¥12.2万' },
  { rank: 3, name: '陈经理', amount: '¥10.6万' },
  { rank: 4, name: '黄经理', amount: '¥9.2万' },
  { rank: 5, name: '吴经理', amount: '¥8.9万' },
]
const projects = [
  {
    id: 1,
    title: '68m²老房翻新焕新颜',
    customer: '李律师 137****6819',
    amount: '¥28600',
    content: '老房翻新/厨卫改造',
    date: '06月18日 完成验收',
  },
  {
    id: 2,
    title: '68m²老房翻新焕新颜',
    customer: '李律师 137****6819',
    amount: '¥18680',
    content: '老房翻新/厨卫改造',
    date: '06月18日 完成验收',
  },
]

const displayMonth = computed(() =>
  activePeriod.value === '累计'
    ? '累计数据'
    : activePeriod.value.includes('年')
    ? activePeriod.value
    : `2026年${activePeriod.value}`,
)
const goBack = () => uni.navigateBack()
const openProject = (id: number) =>
  uni.navigateTo({
    url: `/pages-sub/my/employeeRenovationOrderDetail/employeeRenovationOrderDetail?status=completed&id=${id}`,
  })
</script>

<template>
  <view class="performance-page">
    <view class="safe-area" :style="{ height: `${statusBarHeight}px` }" />
    <view class="custom-navigation">
      <view class="back-button" @click="goBack"
        ><text class="iconfont icon-youjiantou back-icon"
      /></view>
      <text class="navigation-title">业绩中心</text>
      <view class="nav-placeholder" />
    </view>

    <scroll-view class="page-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="card filter-card">
          <view class="section-title">月份筛选</view>
          <view class="period-row">
            <view
              v-for="period in periods"
              :key="period"
              :class="['period-pill', { active: activePeriod === period }]"
              @click="activePeriod = period"
              >{{ period }}</view
            >
          </view>
        </view>

        <view class="card summary-card">
          <view class="section-heading"
            ><text class="section-title">本月业绩</text
            ><text class="section-note">{{ displayMonth }}</text></view
          >
          <view class="metric-grid">
            <view class="metric"
              ><text class="metric-value red">¥8.43万</text
              ><text class="metric-label">业绩金额</text></view
            >
            <view class="metric"
              ><text class="metric-value">3</text><text class="metric-label">完成项目</text></view
            >
            <view class="metric"
              ><text class="metric-value">¥2.81万</text
              ><text class="metric-label">平均单值</text></view
            >
            <view class="metric"
              ><text class="metric-value red">第100名</text
              ><text class="metric-label">公司排名</text></view
            >
          </view>
          <view class="total-row"
            ><text>合计总业绩</text><text class="total-value">¥42.8万</text
            ><text class="total-projects">累计完成18个项目</text></view
          >
        </view>

        <view class="card ranking-card">
          <view class="section-heading"
            ><text class="section-title">公司业绩排名</text
            ><text class="ranking-note">当前员工第100名</text></view
          >
          <view v-for="item in rankings" :key="item.rank" class="rank-row"
            ><text class="rank-number">{{ item.rank }}</text
            ><text class="rank-name">{{ item.name }}</text
            ><text class="rank-amount">{{ item.amount }}</text></view
          >
          <view class="ranking-ellipsis">省略中间排名</view>
          <view class="rank-row current"
            ><text class="rank-number">100</text><text class="rank-name">张先生</text
            ><text class="rank-amount">¥8.9万</text></view
          >
        </view>

        <view class="project-heading"
          ><text class="section-title">完成项目</text
          ><text class="section-note">按完成时间排序</text></view
        >
        <view v-for="project in projects" :key="project.id" class="card project-card">
          <view class="project-top"
            ><view
              ><view class="project-title">{{ project.title }}</view
              ><view class="customer">{{ project.customer }}</view></view
            ><button class="view-button" @click="openProject(project.id)">查看</button></view
          >
          <view class="detail-row"
            ><text class="detail-label">业绩金额</text
            ><text class="red">{{ project.amount }}</text></view
          >
          <view class="detail-row"
            ><text class="detail-label">项目内容</text><text>{{ project.content }}</text></view
          >
          <view class="detail-row"
            ><text class="detail-label">完成时间</text><text>{{ project.date }}</text></view
          >
        </view>

        <view class="card statistics-card">
          <view class="section-title">统计口径</view>
          <view class="statistics-copy">小程序只展示业绩汇总与排名，不发放佣金</view>
          <view class="statistics-copy">业绩按已完成的项目金额统计</view>
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
</style>

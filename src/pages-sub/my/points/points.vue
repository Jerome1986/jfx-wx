<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PointsRecord, PointsType } from '@/types/points'

// 当前类型
const activeType = ref<PointsType>('all')

// 积分记录筛选项
const filters: Array<{ label: string; value: PointsType }> = [
  { label: '全部', value: 'all' },
  { label: '收入', value: 'income' },
  { label: '使用', value: 'expense' },
]

// 记录列表
const records: PointsRecord[] = [
  {
    id: 1,
    type: 'income',
    title: '完成厨房改造订单',
    description: '订单服务完成后获得积分',
    date: '2026-06-17 18:24',
    amount: 260,
  },
  {
    id: 2,
    type: 'income',
    title: '完成厨房改造订单',
    description: '订单服务完成后获得积分',
    date: '2026-06-17 18:24',
    amount: 260,
  },
  {
    id: 3,
    type: 'income',
    title: '完成厨房改造订单',
    description: '订单服务完成后获得积分',
    date: '2026-06-17 18:24',
    amount: 260,
  },
  {
    id: 4,
    type: 'income',
    title: '完成厨房改造订单',
    description: '订单服务完成后获得积分',
    date: '2026-06-17 18:24',
    amount: 260,
  },
  {
    id: 5,
    type: 'expense',
    title: '商品购买',
    description: '抵扣积分',
    date: '2026-06-17 18:24',
    amount: -300,
  },
]

// 可见记录列表
const visibleRecords = computed(() =>
  activeType.value === 'all' ? records : records.filter((item) => item.type === activeType.value),
)

// 显示积分
const showPointsHelp = () => {
  uni.showModal({
    title: '积分使用说明',
    content: '确认订单时系统会自动计算可抵扣积分，实际抵扣金额以下单页展示为准。',
    showCancel: false,
    confirmText: '知道了',
    confirmColor: '#D92D20',
  })
}
</script>

<template>
  <view class="points-page">
    <scroll-view class="points-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="summary-card">
          <view class="summary-top">
            <view class="balance-block">
              <view class="summary-label">可用积分</view>
              <view class="balance-value">811</view>
              <view class="balance-caption">当前可用于订单抵扣的积分</view>
            </view>
            <view class="usable-card">
              <view class="usable-heading">
                <text>下单可用</text>
                <view class="help-button" @click="showPointsHelp">
                  <image
                    class="help-icon"
                    src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/问号 1.png"
                    mode="aspectFit"
                  />
                </view>
              </view>
              <view class="usable-copy">确认订单时自动计算<br />可抵扣金额以下单页为准</view>
            </view>
          </view>
          <view class="summary-stats">
            <view class="summary-stat">
              <text class="stat-name">本月收入</text>
              <text class="stat-number income-number">+320</text>
            </view>
            <view class="summary-stat">
              <text class="stat-name">累计收入</text>
              <text class="stat-number">1460</text>
            </view>
            <view class="summary-stat">
              <text class="stat-name">已抵扣</text>
              <text class="stat-number">649</text>
            </view>
          </view>
        </view>

        <view class="detail-heading">积分明细</view>
        <view class="filter-tabs">
          <view
            v-for="item in filters"
            :key="item.value"
            :class="['filter-tab', { active: activeType === item.value }]"
            @click="activeType = item.value"
          >
            {{ item.label }}
          </view>
        </view>

        <view class="records-card">
          <view v-if="visibleRecords.length" class="records-list">
            <view v-for="item in visibleRecords" :key="item.id" class="record-item">
              <view :class="['record-icon', item.type]">
                <image
                  class="record-symbol"
                  :src="
                    item.type === 'income'
                      ? 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/add.png'
                      : 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/minus.png'
                  "
                  mode="aspectFit"
                />
              </view>
              <view class="record-copy">
                <view class="record-title">{{ item.title }}</view>
                <view class="record-description">{{ item.description }}</view>
                <view class="record-date">{{ item.date }}</view>
              </view>
              <view :class="['record-amount', item.type]">{{
                item.amount > 0 ? `+${item.amount}` : item.amount
              }}</view>
            </view>
          </view>
          <view v-else class="empty-state">暂无积分记录</view>
          <view class="history-tip">仅显示近6个月积分记录</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.points-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: #222;
  background: #f8f7f5;
}
.points-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.page-content {
  padding: 24rpx 24rpx 80rpx;
}
.summary-card,
.records-card {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(55, 42, 32, 0.05);
}
.summary-card {
  padding: 32rpx 24rpx 0;
}
.summary-top {
  display: flex;
  min-height: 164rpx;
  align-items: flex-start;
  justify-content: space-between;
}
.balance-block {
  min-width: 0;
  padding-top: 2rpx;
  flex: 1;
}
.summary-label {
  color: #737373;
  font-size: 28rpx;
  line-height: 40rpx;
}
.balance-value {
  margin-top: 10rpx;
  color: #202124;
  font-size: 48rpx;
  font-weight: 500;
  line-height: 58rpx;
}
.balance-caption {
  margin-top: 12rpx;
  color: #6f6f6f;
  font-size: 24rpx;
  line-height: 34rpx;
  white-space: nowrap;
}
.usable-card {
  width: 276rpx;
  min-height: 132rpx;
  padding: 18rpx 18rpx 16rpx;
  flex-shrink: 0;
  background: #fff6f4;
  border-radius: 16rpx;
}
.usable-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #d92d20;
  font-size: 27rpx;
  line-height: 38rpx;
}
.help-button {
  display: flex;
  align-items: center;
  justify-content: center;
}
.help-icon {
  width: 32rpx;
  height: 32rpx;
}
.usable-copy {
  margin-top: 9rpx;
  color: #a4a4a4;
  font-size: 21rpx;
  line-height: 31rpx;
  white-space: nowrap;
}
.summary-stats {
  position: relative;
  display: flex;
  height: 102rpx;
  margin-top: 8rpx;
  align-items: center;
  border-top: 2rpx solid #f0f0f0;
}
.summary-stat {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
}
.summary-stat:not(:last-child)::after {
  position: absolute;
  top: 8rpx;
  right: 0;
  width: 2rpx;
  height: 42rpx;
  background: #eee;
  content: '';
}
.stat-name {
  color: #696969;
  font-size: 25rpx;
  line-height: 34rpx;
}
.stat-number {
  margin-top: 2rpx;
  color: #222;
  font-size: 25rpx;
  font-weight: 500;
  line-height: 34rpx;
}
.income-number {
  color: #d92d20;
}
.detail-heading {
  margin-top: 28rpx;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 42rpx;
}
.filter-tabs {
  display: flex;
  margin-top: 18rpx;
  gap: 24rpx;
}
.filter-tab {
  display: flex;
  width: 96rpx;
  height: 44rpx;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 25rpx;
  line-height: 44rpx;
  background: #fff;
  border-radius: 22rpx;
}
.filter-tab.active {
  color: #d92d20;
  background: #fff0ef;
}
.records-card {
  margin-top: 24rpx;
  padding: 24rpx 24rpx 0;
}
.record-item {
  display: flex;
  min-height: 130rpx;
  align-items: center;
}
.record-icon {
  display: flex;
  width: 40rpx;
  height: 40rpx;
  margin-right: 32rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.record-icon.income {
  background: #fff0ef;
}
.record-icon.expense {
  background: #f5f2ee;
}
.record-symbol {
  width: 40rpx;
  height: 40rpx;
}
.record-copy {
  min-width: 0;
  padding: 16rpx 0 18rpx;
  flex: 1;
  border-bottom: 2rpx solid #f0f0f0;
}
.record-title {
  color: #222;
  font-size: 26rpx;
  line-height: 36rpx;
}
.record-description {
  margin-top: 2rpx;
  color: #777;
  font-size: 24rpx;
  line-height: 34rpx;
}
.record-date {
  margin-top: 2rpx;
  color: #aaa;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 32rpx;
}
.record-amount {
  align-self: stretch;
  display: flex;
  min-width: 90rpx;
  padding-left: 12rpx;
  align-items: center;
  justify-content: flex-end;
  font-size: 26rpx;
  font-weight: 500;
  border-bottom: 2rpx solid #f0f0f0;
}
.record-amount.income {
  color: #d92d20;
}
.record-amount.expense {
  color: #777;
}
.empty-state {
  padding: 100rpx 0;
  color: #aaa;
  font-size: 24rpx;
  text-align: center;
}
.history-tip {
  padding: 38rpx 0 28rpx;
  color: #aaa;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 34rpx;
}
</style>

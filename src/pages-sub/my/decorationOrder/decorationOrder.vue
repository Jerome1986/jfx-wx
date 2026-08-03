<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  ServiceFilterType as FilterType,
  ServiceOrder,
  ServiceStatus,
} from '@/types/decoration-order'

const activeFilter = ref<FilterType>('all')

const filters: Array<{ label: string; value: FilterType }> = [
  { label: '全部', value: 'all' },
  { label: '量房服务', value: 'measure' },
  { label: '报价服务', value: 'quote' },
  { label: '已完成', value: 'completed' },
]

const orders = ref<ServiceOrder[]>([
  {
    id: 1,
    title: '房屋报价服务',
    source: '装修预算计算器',
    type: 'quote',
    status: 'contact',
    lines: ['提交于06月18日 14：32', '已留电话：13824245628'],
    footer: '需求：厨房改造/95㎡',
    secondaryAction: '取消',
    primaryAction: '补充信息',
  },
  {
    id: 2,
    title: '房屋报价服务',
    source: '免费量房',
    type: 'quote',
    status: 'service',
    lines: ['上门时间：06月24日 10:00', '服务地址：洪山区珞喻路88号'],
    footer: '内容：上门量房、记录房屋情况',
    secondaryAction: '改期',
    primaryAction: '联系顾问',
  },
  {
    id: 3,
    title: '房屋报价服务',
    source: '装修预算计算器',
    type: 'quote',
    status: 'completed',
    lines: ['沟通完成：06月24日 12:00', '结果：已沟通预算和改造范围'],
    footer: '本次报价服务已结束',
    primaryAction: '查看记录',
  },
  {
    id: 4,
    title: '免费量房服务',
    source: '免费量房',
    type: 'measure',
    status: 'completed',
    lines: ['量房完成：06月24日 12:00', '结果：已记录尺寸和需求'],
    footer: '本次量房服务已结束',
    primaryAction: '查看记录',
  },
])

const visibleOrders = computed(() => {
  if (activeFilter.value === 'all') return orders.value
  if (activeFilter.value === 'completed')
    return orders.value.filter((item) => item.status === 'completed')
  return orders.value.filter((item) => item.type === activeFilter.value)
})

const serviceCount = computed(() => orders.value.length)
const contactCount = computed(() => orders.value.filter((item) => item.status === 'contact').length)
const servingCount = computed(() => orders.value.filter((item) => item.status === 'service').length)
const completedCount = computed(
  () => orders.value.filter((item) => item.status === 'completed').length,
)

const statusText: Record<ServiceStatus, string> = {
  contact: '待确认',
  service: '待服务',
  completed: '已完成',
}

const runAction = (label: string) => uni.showToast({ title: `${label}功能建设中`, icon: 'none' })
const viewOrderDetail = (item: ServiceOrder) => {
  uni.navigateTo({
    url: `/pages-sub/my/decorationOrderDetail/decorationOrderDetail?id=${item.id}&type=${item.type}`,
  })
}
const runSecondaryAction = (item: ServiceOrder) => {
  if (item.secondaryAction === '取消') {
    uni.showModal({
      title: '取消服务',
      content: '确定取消本次房屋报价服务吗？',
      confirmText: '确定取消',
      confirmColor: '#D92D20',
      success: ({ confirm }) => {
        if (!confirm) return
        orders.value = orders.value.filter((order) => order.id !== item.id)
      },
    })
    return
  }
  runAction(item.secondaryAction || '')
}
</script>

<template>
  <view class="order-page">
    <scroll-view class="order-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="summary-card">
          <view class="summary-title">只记录量房服务、房屋报价服务</view>
          <view class="summary-description"
            >单次服务记录，不展示装修订单状态，转化由顾问线下跟进</view
          >
          <view class="summary-stats">
            <view class="summary-stat">
              <text class="stat-number contact-number">{{ contactCount }}</text>
              <text class="stat-label">待确认</text>
            </view>
            <view class="summary-stat">
              <text class="stat-number">{{ servingCount }}</text>
              <text class="stat-label">待服务</text>
            </view>
            <view class="summary-stat">
              <text class="stat-number">{{ completedCount }}</text>
              <text class="stat-label">已完成</text>
            </view>
          </view>
        </view>

        <view class="filter-list">
          <view
            v-for="item in filters"
            :key="item.value"
            :class="['filter-item', { active: activeFilter === item.value }]"
            @click="activeFilter = item.value"
          >
            {{ item.label }}
          </view>
        </view>

        <view class="service-count">共 {{ serviceCount }} 条服务</view>

        <view class="service-list">
          <view
            v-for="item in visibleOrders"
            :key="item.id"
            :class="['service-card', `status-${item.status}`]"
            @click="viewOrderDetail(item)"
          >
            <view class="card-header">
              <view>
                <view class="service-title">{{ item.title }}</view>
                <view class="service-source">来源：{{ item.source }}</view>
              </view>
              <view :class="['status-badge', item.status]">{{ statusText[item.status] }}</view>
            </view>

            <view class="service-lines">
              <view v-for="line in item.lines" :key="line" class="service-line">
                <text class="line-dot">•</text>
                <text>{{ line }}</text>
              </view>
            </view>

            <view class="card-footer">
              <view class="footer-copy">
                <text class="line-dot">•</text>
                <text>{{ item.footer }}</text>
              </view>
              <view class="card-actions">
                <button
                  v-if="item.secondaryAction"
                  class="secondary-button"
                  @click.stop="runSecondaryAction(item)"
                >
                  {{ item.secondaryAction }}
                </button>
                <button class="primary-button" @click.stop="runAction(item.primaryAction)">
                  {{ item.primaryAction }}
                </button>
              </view>
            </view>
          </view>
        </view>

        <view v-if="!visibleOrders.length" class="empty-state">暂无相关服务记录</view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.order-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.order-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.page-content {
  padding: 24rpx 24rpx calc(48rpx + env(safe-area-inset-bottom));
}

.summary-card {
  padding: 26rpx 24rpx 20rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(55, 42, 32, 0.05);
}

.summary-title {
  color: #222;
  font-size: 27rpx;
  line-height: 40rpx;
}

.summary-description {
  margin-top: 5rpx;
  color: #777;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 34rpx;
  white-space: nowrap;
}

.summary-stats {
  display: flex;
  height: 80rpx;
  margin-top: 17rpx;
  align-items: center;
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
  top: 12rpx;
  right: 0;
  width: 2rpx;
  height: 42rpx;
  background: #eee;
  content: '';
}

.stat-number {
  color: #222;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 38rpx;
}

.contact-number {
  color: $jfx-brandColor;
}

.stat-label {
  color: #777;
  font-size: 23rpx;
  line-height: 32rpx;
}

.filter-list {
  display: flex;
  margin-top: 26rpx;
  gap: 24rpx;
}

.filter-item {
  display: flex;
  height: 50rpx;
  padding: 0 22rpx;
  align-items: center;
  justify-content: center;
  color: #222;
  font-size: 24rpx;
  background: #fff;
  border: 2rpx solid transparent;
  border-radius: 8rpx;
}

.filter-item.active {
  color: $jfx-brandColor;
  background: #fff7f6;
  border-color: $jfx-brandColor;
}

.service-count {
  margin: 24rpx 0 26rpx;
  color: #aaa;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 34rpx;
}

.service-card {
  position: relative;
  overflow: hidden;
  min-height: 268rpx;
  padding: 16rpx 24rpx 0;
  background: #fff;
  border-left: 3rpx solid #777;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(55, 42, 32, 0.045);
}

.service-card.status-contact {
  border-left-color: $jfx-brandColor;
}

.service-card.status-service {
  border-left-color: #d58a27;
}

.service-card + .service-card {
  margin-top: 24rpx;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.service-title {
  color: #222;
  font-size: 27rpx;
  line-height: 38rpx;
}

.service-source {
  margin-top: 2rpx;
  color: #aaa;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 34rpx;
}

.status-badge {
  display: flex;
  height: 42rpx;
  padding: 0 20rpx;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  line-height: 42rpx;
  border-radius: 22rpx;
}

.status-badge.contact {
  color: $jfx-brandColor;
  background: #fff0ef;
}

.status-badge.service {
  color: #c77a17;
  background: #fff5e8;
}

.status-badge.completed {
  color: #777;
  background: #f3f2f0;
}

.service-lines {
  margin-top: 14rpx;
  padding: 9rpx 0 10rpx;
  border-top: 2rpx solid #f0f0f0;
  border-bottom: 2rpx solid #f0f0f0;
}

.service-line {
  display: flex;
  color: #555;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 40rpx;
}

.line-dot {
  margin-right: 7rpx;
  flex-shrink: 0;
  color: #d9a47f;
  font-size: 28rpx;
  line-height: inherit;
}

.card-footer {
  display: flex;
  min-height: 62rpx;
  padding: 16rpx 0;
  align-items: center;
  justify-content: space-between;
}

.footer-copy {
  display: flex;
  min-width: 0;
  align-items: center;
  color: #666;
  font-size: 22rpx;
  font-weight: 400;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  margin-left: 14rpx;
  flex-shrink: 0;
  gap: 16rpx;
}

.secondary-button,
.primary-button {
  height: 42rpx;
  margin: 0;
  padding: 0 24rpx;
  font-size: 22rpx;
  line-height: 42rpx;
  border-radius: 12rpx;
}

.secondary-button {
  color: #777;
  background: #fff;
  border: 2rpx solid #eee;
}

.primary-button {
  min-width: 144rpx;
  color: #fff;
  background: $jfx-brandColor;
}

.secondary-button::after,
.primary-button::after {
  border: 0;
}

.empty-state {
  padding: 160rpx 0;
  color: #aaa;
  font-size: 24rpx;
  font-weight: 400;
  text-align: center;
}
</style>

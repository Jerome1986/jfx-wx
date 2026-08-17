<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type {
  RenovationFilterStatus as FilterStatus,
  RenovationOrder,
  RenovationStatus,
} from '@/types/renovation-order'

// 装修订单筛选项
const filters: Array<{ label: string; value: FilterStatus }> = [
  { label: '全部', value: 'all' },
  { label: '待确认', value: 'pending' },
  { label: '服务中', value: 'servicing' },
  { label: '已完成', value: 'completed' },
]

// 状态文案
const statusText: Record<RenovationStatus, string> = {
  pending: '待确认',
  servicing: '服务中',
  completed: '已完成',
}

// 当前筛选条件
const activeFilter = ref<FilterStatus>('all')
// 订单列表
const orders = ref<RenovationOrder[]>([
  {
    id: 1,
    status: 'pending',
    description: '请确认报价与服务地址，确认后顾问将安排上门',
    detailLabel: '下一步',
    detailValue: '确认后安排顾问上门',
    amountLabel: '预估费用',
    secondaryAction: '取消',
    primaryAction: '确认',
  },
  {
    id: 2,
    status: 'servicing',
    description: '顾问正在推进方案与施工，有问题可随时联系',
    detailLabel: '当前进度',
    detailValue: '方案沟通与施工推进中',
    amountLabel: '订单金额',
    secondaryAction: '联系',
    primaryAction: '详情',
  },
  {
    id: 3,
    status: 'completed',
    description: '服务已完成验收，后续如有问题可申请售后',
    detailLabel: '完成时间',
    detailValue: '06月15日 已完成验收',
    amountLabel: '订单金额',
    secondaryAction: '售后',
    primaryAction: '详情',
  },
])

// 可见订单列表
const visibleOrders = computed(() =>
  activeFilter.value === 'all'
    ? orders.value
    : orders.value.filter((item) => item.status === activeFilter.value),
)

onLoad((query) => {
  // 查询参数状态
  const queryStatus = query?.status as FilterStatus | undefined
  if (filters.some((item) => item.value === queryStatus)) activeFilter.value = queryStatus!
})

// 取消订单
const cancelOrder = (order: RenovationOrder) => {
  uni.showModal({
    title: '取消装修订单',
    content: '确定取消该装修订单吗？',
    confirmText: '确定取消',
    confirmColor: '#D92D20',
    success: ({ confirm }) => {
      if (confirm) orders.value = orders.value.filter((item) => item.id !== order.id)
    },
  })
}

// 执行操作
const runSecondaryAction = (order: RenovationOrder) => {
  if (order.secondaryAction === '取消') {
    cancelOrder(order)
    return
  }
  if (order.secondaryAction === '联系') {
    uni.showToast({ title: '正在为您联系装修顾问', icon: 'none' })
    return
  }
  uni.showToast({ title: '售后申请功能建设中', icon: 'none' })
}

// 打开订单详情
const openOrderDetail = (order: RenovationOrder) => {
  uni.navigateTo({
    url: `/pages-sub/my/renovationOrderDetail/renovationOrderDetail?id=${order.id}&status=${order.status}`,
  })
}

// 执行主要操作
const runPrimaryAction = (order: RenovationOrder) => {
  openOrderDetail(order)
}
</script>

<template>
  <view class="renovation-page">
    <view class="filter-card">
      <view
        v-for="item in filters"
        :key="item.value"
        class="filter-item"
        :class="{ active: activeFilter === item.value }"
        @click="activeFilter = item.value"
      >
        {{ item.label }}
      </view>
    </view>

    <scroll-view class="order-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="order-count">共 8 个订单</view>

        <view v-if="visibleOrders.length" class="order-list">
          <view
            v-for="order in visibleOrders"
            :key="order.id"
            :class="['order-card', `card-${order.status}`]"
            @click="openOrderDetail(order)"
          >
            <view class="card-header">
              <view class="order-title">95m²老房厨房改造</view>
              <view :class="['status-badge', `status-${order.status}`]">
                {{ statusText[order.status] }}
              </view>
            </view>
            <view class="order-description">{{ order.description }}</view>

            <view class="order-detail">
              <view class="detail-line">
                <text class="detail-label">服务地址</text>
                <text class="detail-value">武汉市洪山区珞瑜路</text>
              </view>
              <view class="detail-line">
                <text class="detail-label">{{ order.detailLabel }}</text>
                <text class="detail-value">{{ order.detailValue }}</text>
              </view>
            </view>

            <view class="card-footer">
              <view class="amount-group">
                <text class="amount-label">{{ order.amountLabel }}</text>
                <text class="amount-value">¥11.6万</text>
              </view>
              <view class="card-actions">
                <button class="secondary-button" @click.stop="runSecondaryAction(order)">
                  {{ order.secondaryAction }}
                </button>
                <button class="primary-button" @click.stop="runPrimaryAction(order)">
                  {{ order.primaryAction }}
                </button>
              </view>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">暂无相关装修订单</view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.renovation-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.filter-card {
  display: flex;
  height: 90rpx;
  margin: 24rpx 24rpx 0;
  padding: 0 24rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-radius: 18rpx;
  box-shadow: 0 7rpx 24rpx rgba(55, 42, 32, 0.04);
}

.filter-item {
  display: flex;
  height: 44rpx;
  padding: 0 30rpx;
  align-items: center;
  justify-content: center;
  color: #666666;
  font-size: 24rpx;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 23rpx;
}

.filter-item.active {
  color: #e52e24;
  background: #fff0ef;
}

.order-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.page-content {
  padding: 24rpx 24rpx calc(48rpx + env(safe-area-inset-bottom));
}

.order-count {
  color: #aaaaaa;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 34rpx;
}

.order-list {
  margin-top: 24rpx;
}

.order-card {
  position: relative;
  min-height: 272rpx;
  padding: 20rpx 24rpx 0;
  overflow: hidden;
  background: #ffffff;
  border-left: 2rpx solid #5ca965;
  border-radius: 18rpx;
  box-shadow: 0 7rpx 25rpx rgba(55, 42, 32, 0.04);
}

.order-card + .order-card {
  margin-top: 24rpx;
}

.order-card.card-pending {
  border-left-color: #e42b22;
}

.order-card.card-completed {
  border-left-color: #777777;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.order-title {
  color: #222222;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 40rpx;
}

.status-badge {
  display: flex;
  height: 42rpx;
  padding: 0 20rpx;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  line-height: 42rpx;
  border-radius: 23rpx;
}

.status-pending {
  color: #e52e24;
  background: #fff0ef;
}

.status-servicing {
  color: #55a35d;
  background: #eef8ef;
}

.status-completed {
  color: #777777;
  background: #f3f2f0;
}

.order-description {
  margin-top: 5rpx;
  overflow: hidden;
  color: #aaaaaa;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 34rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-detail {
  margin-top: 16rpx;
  padding: 12rpx 0;
  border-top: 2rpx solid #eeeeee;
  border-bottom: 2rpx solid #eeeeee;
}

.detail-line {
  display: flex;
  color: #777777;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 40rpx;
}

.detail-label {
  width: 112rpx;
  flex-shrink: 0;
}

.detail-value {
  color: #666666;
}

.card-footer {
  display: flex;
  min-height: 68rpx;
  padding: 12rpx 0;
  align-items: center;
  justify-content: space-between;
}

.amount-group {
  display: flex;
  min-width: 0;
  align-items: center;
}

.amount-label {
  color: #aaaaaa;
  font-size: 23rpx;
  font-weight: 400;
}

.amount-value {
  margin-left: 18rpx;
  color: #e42b22;
  font-size: 29rpx;
  font-weight: 400;
}

.card-actions {
  display: flex;
  margin-left: 12rpx;
  flex-shrink: 0;
  gap: 16rpx;
}

.secondary-button,
.primary-button {
  height: 44rpx;
  margin: 0;
  padding: 0 24rpx;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 42rpx;
  border-radius: 12rpx;
}

.secondary-button {
  color: #666666;
  background: #ffffff;
  border: 2rpx solid #eeeeee;
}

.primary-button {
  color: #ffffff;
  background: #e42b22;
}

.secondary-button::after,
.primary-button::after {
  border: 0;
}

.empty-state {
  padding: 180rpx 0;
  color: #aaaaaa;
  font-size: 24rpx;
  font-weight: 400;
  text-align: center;
}
</style>

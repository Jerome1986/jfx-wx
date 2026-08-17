<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type {
  ProductOrder,
  ProductOrderFilterStatus as FilterStatus,
  ProductOrderStatus as OrderStatus,
} from '@/types/product-order'

// 商品订单筛选项
const filters: Array<{ label: string; value: FilterStatus }> = [
  { label: '全部', value: 'all' },
  { label: '待付款', value: 'pending-payment' },
  { label: '待安装', value: 'pending-installation' },
  { label: '服务中', value: 'servicing' },
  { label: '已完成', value: 'completed' },
]

// 状态文案
const statusText: Record<OrderStatus, string> = {
  'pending-payment': '待付款',
  'pending-installation': '待安装',
  servicing: '服务中',
  completed: '已完成',
}

// 当前筛选条件
const activeFilter = ref<FilterStatus>('all')
// 订单列表
const orders = ref<ProductOrder[]>([
  {
    id: 1,
    orderNo: 'JFX202606180012',
    status: 'pending-payment',
    footer: '30分钟内未支付将自动取消',
    secondaryAction: '取消',
    primaryAction: '付款',
  },
  {
    id: 2,
    orderNo: 'JFX202606180012',
    status: 'pending-installation',
    footer: '待预约上门安装时间',
    secondaryAction: '详情',
    primaryAction: '预约',
  },
  {
    id: 3,
    orderNo: 'JFX202606180012',
    status: 'servicing',
    footer: '已派工作人员上门安装中',
    secondaryAction: '联系',
    primaryAction: '进度',
  },
  {
    id: 4,
    orderNo: 'JFX202606180012',
    status: 'completed',
    footer: '订单已完成',
    primaryAction: '查看详情',
  },
])

// 可见订单列表
const visibleOrders = computed(() =>
  activeFilter.value === 'all'
    ? orders.value
    : orders.value.filter((item) => item.status === activeFilter.value),
)

onLoad((query) => {
  // 状态
  const status = query?.status as FilterStatus | undefined
  if (filters.some((item) => item.value === status)) activeFilter.value = status!
})

// 选择筛选条件
const selectFilter = (status: FilterStatus) => {
  activeFilter.value = status
}

// 打开商品订单详情
const openDetails = (order: ProductOrder) => {
  uni.navigateTo({
    url: `/pages-sub/my/productOrderDetail/productOrderDetail?id=${order.id}&status=${order.status}`,
  })
}

// 执行操作
const runSecondaryAction = (order: ProductOrder) => {
  if (order.secondaryAction === '取消') {
    uni.showModal({
      title: '取消订单',
      content: '确定取消该商品订单吗？',
      confirmText: '确定取消',
      confirmColor: '#D92D20',
      success: ({ confirm }) => {
        if (confirm) orders.value = orders.value.filter((item) => item.id !== order.id)
      },
    })
    return
  }

  if (order.secondaryAction === '详情') {
    openDetails(order)
    return
  }

  if (order.secondaryAction === '联系') {
    uni.showToast({ title: '正在为您联系服务人员', icon: 'none' })
  }
}

// 执行主要操作
const runPrimaryAction = (order: ProductOrder) => {
  if (order.primaryAction === '付款') {
    uni.showToast({ title: '支付功能建设中', icon: 'none' })
    return
  }
  if (order.primaryAction === '预约') {
    uni.navigateTo({ url: '/pages-sub/my/appointment/appointment' })
    return
  }
  if (order.primaryAction === '进度') {
    uni.showToast({ title: '安装人员正在上门服务', icon: 'none' })
    return
  }
  openDetails(order)
}
</script>

<template>
  <view class="product-order-page">
    <view class="filter-card">
      <view
        v-for="item in filters"
        :key="item.value"
        class="filter-item"
        :class="{ active: activeFilter === item.value }"
        @click="selectFilter(item.value)"
      >
        {{ item.label }}
      </view>
    </view>

    <scroll-view class="order-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="summary-row">
          <text>共 8 个订单</text>
          <text>商品价格已包含基础安装服务</text>
        </view>

        <view v-if="visibleOrders.length" class="order-list">
          <view v-for="order in visibleOrders" :key="order.id" class="order-card">
            <view class="order-header">
              <view>
                <view class="order-title">家翻新商品订单</view>
                <view class="order-number">{{ order.orderNo }}</view>
              </view>
              <view :class="['status-badge', `status-${order.status}`]">
                {{ statusText[order.status] }}
              </view>
            </view>

            <view class="product-row" @click="openDetails(order)">
              <view class="product-image-wrap">
                <image
                  class="product-image"
                  src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-gooseneck-faucet.png"
                  mode="aspectFit"
                />
              </view>
              <view class="product-copy">
                <view class="product-name">九牧抗菌枪灰抽拉厨房龙头</view>
                <view class="product-description">四重水花 节能防撞</view>
                <view class="product-tags">
                  <text class="install-tag">含基础安装</text>
                  <text class="quantity-tag">共2件</text>
                </view>
              </view>
              <view class="product-price">¥623</view>
            </view>

            <view class="order-footer">
              <text class="footer-copy">{{ order.footer }}</text>
              <view class="order-actions">
                <button
                  v-if="order.secondaryAction"
                  class="secondary-button"
                  @click.stop="runSecondaryAction(order)"
                >
                  {{ order.secondaryAction }}
                </button>
                <button class="primary-button" @click.stop="runPrimaryAction(order)">
                  {{ order.primaryAction }}
                </button>
              </view>
            </view>
          </view>
        </view>

        <view v-else class="empty-state">暂无相关商品订单</view>
        <view v-if="activeFilter === 'all'" class="load-more">继续下滑查看更多订单</view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.product-order-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.filter-card {
  display: flex;
  height: 98rpx;
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
  height: 46rpx;
  padding: 0 24rpx;
  align-items: center;
  justify-content: center;
  color: #666666;
  font-size: 24rpx;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 25rpx;
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
  padding: 24rpx 24rpx calc(52rpx + env(safe-area-inset-bottom));
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #aaaaaa;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 34rpx;
}

.order-list {
  margin-top: 24rpx;
}

.order-card {
  min-height: 322rpx;
  padding: 18rpx 24rpx 0;
  background: #ffffff;
  border-radius: 18rpx;
  box-shadow: 0 7rpx 25rpx rgba(55, 42, 32, 0.04);
}

.order-card + .order-card {
  margin-top: 24rpx;
}

.order-header {
  display: flex;
  min-height: 76rpx;
  align-items: flex-start;
  justify-content: space-between;
}

.order-title {
  color: #222222;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 36rpx;
}

.order-number {
  margin-top: 2rpx;
  color: #aaaaaa;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 32rpx;
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

.status-pending-payment {
  color: #e52e24;
  background: #fff0ef;
}

.status-pending-installation {
  color: #c87443;
  background: #fff5eb;
}

.status-servicing {
  color: #55a35d;
  background: #eef8ef;
}

.status-completed {
  color: #777777;
  background: #f3f2f0;
}

.product-row {
  display: flex;
  height: 158rpx;
  padding: 24rpx 0;
  align-items: center;
  border-top: 2rpx solid #eeeeee;
  border-bottom: 2rpx solid #eeeeee;
}

.product-image-wrap {
  display: flex;
  width: 116rpx;
  height: 116rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f8f6f3;
  border-radius: 14rpx;
}

.product-image {
  width: 104rpx;
  height: 104rpx;
}

.product-copy {
  min-width: 0;
  margin-left: 28rpx;
  flex: 1;
}

.product-name {
  overflow: hidden;
  color: #222222;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 36rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-description {
  color: #777777;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 32rpx;
}

.product-tags {
  display: flex;
  margin-top: 10rpx;
  align-items: center;
  gap: 10rpx;
}

.install-tag,
.quantity-tag {
  display: inline-flex;
  height: 38rpx;
  padding: 0 18rpx;
  align-items: center;
  font-size: 21rpx;
  font-weight: 500;
  line-height: 38rpx;
  border-radius: 20rpx;
}

.install-tag {
  color: #e52e24;
  background: #fff0ef;
}

.quantity-tag {
  color: #777777;
  background: #f5f3f1;
}

.product-price {
  margin-left: 10rpx;
  flex-shrink: 0;
  color: #222222;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 40rpx;
}

.order-footer {
  display: flex;
  min-height: 72rpx;
  padding: 14rpx 0;
  align-items: center;
  justify-content: space-between;
}

.footer-copy {
  min-width: 0;
  overflow: hidden;
  color: #c3c3c3;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 32rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-actions {
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

.load-more {
  padding: 44rpx 0 20rpx;
  color: #aaaaaa;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 34rpx;
  text-align: center;
}

.empty-state {
  padding: 180rpx 0;
  color: #aaaaaa;
  font-size: 24rpx;
  font-weight: 400;
  text-align: center;
}
</style>

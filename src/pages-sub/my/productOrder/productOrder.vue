<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { cancelOrder, getUserOrders, payOrder, requestWechatPayment } from '@/api/order'
import { formatBeijingTimestamp, orderInstallationText } from '@/utils/order-booking'
import { formatTimestamp } from '@/utils/format'
import type {
  ProductOrderApiStatus,
  ProductOrderFilterStatus,
  UserProductOrder,
} from '@/types/product-order'

const filters: {
  label: string
  value: ProductOrderFilterStatus
  status: ProductOrderApiStatus | 'ALL'
}[] = [
  { label: '全部', value: 'all', status: 'ALL' },
  { label: '待付款', value: 'pending-payment', status: 'PENDING_PAYMENT' },
  { label: '待安装', value: 'pending-installation', status: 'PENDING_INSTALLATION' },
  { label: '服务中', value: 'servicing', status: 'IN_SERVICE' },
  { label: '待确认', value: 'pending-confirmation', status: 'PENDING_CONFIRMATION' },
  { label: '已完成', value: 'completed', status: 'COMPLETED' },
]
const statusText: Record<ProductOrderApiStatus, string> = {
  PENDING_PAYMENT: '待付款',
  PENDING_INSTALLATION: '待安装',
  IN_SERVICE: '服务中',
  PENDING_CONFIRMATION: '待确认',
  COMPLETED: '已完成',
  CANCELED: '已取消',
  REFUNDING: '退款中',
  REFUNDED: '已退款',
}
const statusClass = (status: ProductOrderApiStatus) =>
  filters.find((item) => item.status === status)?.value || 'completed'
const activeFilter = ref<ProductOrderFilterStatus>('all')
const orders = ref<UserProductOrder[]>([])
const total = ref(0)
const pageNum = ref(0)
const totalPage = ref(0)
const loading = ref(false)
const loadFailed = ref(false)
const cancelingOrderId = ref<number | null>(null)
const payingOrderId = ref<number | null>(null)
const hasMore = computed(() => pageNum.value < totalPage.value)
let requestId = 0
const formatAmount = (amount: string | number) => Number(amount).toFixed(2)

const itemCount = (order: UserProductOrder) =>
  order.items?.reduce((count, item) => count + item.quantity, 0) ?? 0

const productSummary = (order: UserProductOrder) => {
  if (!order.items?.length) return ''
  const names = order.items
    .slice(0, 2)
    .map((item) => item.productName)
    .join('、')
  return names + (order.items.length > 2 ? '等' : '') + '，共 ' + itemCount(order) + ' 件商品'
}
const requiresInstallation = (order: UserProductOrder) =>
  order.items?.some((item) => item.requiresInstall) ?? false

const installationBookingText = (order: UserProductOrder) => {
  const booking =
    order.installation?.appointmentDate && order.installation.timeSlot ? order.installation : order
  if (!booking.appointmentDate || !booking.timeSlot) return '安装时间待确认'
  const date = formatTimestamp(booking.appointmentDate, 1)
  return date ? `${date} ${booking.timeSlot}` : '安装时间待确认'
}
const installationText = (order: UserProductOrder) => {
  const text = orderInstallationText(order)
  return text === '待派单' ? '待安装' : text
}

const loadOrders = async (reset = false) => {
  if (!reset && (loading.value || !hasMore.value)) return
  const currentRequest = ++requestId
  const nextPage = reset ? 1 : pageNum.value + 1
  if (reset) {
    orders.value = []
    total.value = 0
    pageNum.value = 0
    totalPage.value = 0
  }
  loading.value = true
  loadFailed.value = false
  try {
    const { data } = await getUserOrders({
      status: filters.find((item) => item.value === activeFilter.value)!.status,
      pageNum: nextPage,
      pageSize: 10,
    })

    console.log(data)

    // 忽略切换标签前的旧请求，避免覆盖当前列表。
    if (currentRequest !== requestId) return
    orders.value = reset ? data.list : [...orders.value, ...data.list]
    total.value = data.total
    pageNum.value = Number(data.pageNum)
    totalPage.value = data.totalPage
  } catch (error) {
    if (currentRequest !== requestId) return
    loadFailed.value = true
    console.error('获取商品订单列表失败：', error)
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}
onLoad((query) => {
  const filter = filters.find(
    (item) => item.value === query?.status || item.status === query?.status,
  )
  if (filter) activeFilter.value = filter.value
})
onShow(() => {
  void loadOrders(true)
})
onUnload(() => {
  requestId++
})
const selectFilter = (status: ProductOrderFilterStatus) => {
  if (activeFilter.value === status) return
  activeFilter.value = status
  void loadOrders(true)
}
const openDetails = (order: UserProductOrder) => {
  uni.navigateTo({ url: '/pages-sub/my/productOrderDetail/productOrderDetail?id=' + order.id })
}
const handleCancelOrder = async (order: UserProductOrder) => {
  if (
    cancelingOrderId.value !== null ||
    payingOrderId.value !== null ||
    order.status !== 'PENDING_PAYMENT'
  )
    return
  cancelingOrderId.value = order.id
  try {
    const { confirm } = await uni.showModal({
      title: '取消订单',
      content: '确定取消该订单吗？',
      confirmText: '取消订单',
      cancelText: '暂不取消',
      confirmColor: '#D92D20',
    })
    if (!confirm) return
    const response = await cancelOrder(order.id)
    if (response.code !== 200) {
      uni.showToast({ title: response.message || '取消失败，请重试', icon: 'none' })
      return
    }
    uni.showToast({ title: '订单已取消', icon: 'success' })
    await loadOrders(true)
  } catch (error) {
    // 请求层统一提示接口与网络错误，保留订单以便重试。
    console.error('取消订单失败：', error)
  } finally {
    cancelingOrderId.value = null
  }
}

const handlePayOrder = async (order: UserProductOrder) => {
  if (
    payingOrderId.value !== null ||
    cancelingOrderId.value !== null ||
    order.status !== 'PENDING_PAYMENT'
  )
    return
  payingOrderId.value = order.id
  try {
    const response = await payOrder(order.id)
    if (response.code !== 200 || !response.data) {
      uni.showToast({ title: response.message || '暂时无法支付', icon: 'none' })
      return
    }
    try {
      await requestWechatPayment(response.data)
      uni.showToast({ title: '支付完成，正在确认', icon: 'success' })
    } catch (error) {
      const errMsg = (error as { errMsg?: string }).errMsg || ''
      if (!errMsg.includes('cancel')) {
        uni.showToast({ title: '支付未完成，请稍后重试', icon: 'none' })
      }
    }
  } catch (error) {
    // 请求层已提示鉴权、订单状态、微信冲突或网络错误。
    console.error('获取订单支付参数失败：', error)
  } finally {
    payingOrderId.value = null
    await loadOrders(true)
  }
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
        >{{ item.label }}</view
      >
    </view>
    <scroll-view
      class="order-scroll"
      scroll-y
      :show-scrollbar="false"
      @scrolltolower="loadOrders()"
    >
      <view class="page-content">
        <view v-if="orders.length" class="order-list">
          <view v-for="order in orders" :key="order.id" class="order-card">
            <view class="order-header">
              <text class="order-date"
                >下单时间：{{ formatBeijingTimestamp(order.createdAt, 2) }}
              </text>
              <text :class="['status-badge', 'status-' + statusClass(order.status)]">{{
                order.status === 'PENDING_INSTALLATION'
                  ? installationText(order)
                  : statusText[order.status] || order.status
              }}</text>
            </view>
            <view class="order-products">
              <view v-if="order.items?.length" class="product-gallery" @click="openDetails(order)">
                <view class="product-covers">
                  <view
                    v-for="product in order.items.slice(0, 3)"
                    :key="product.id"
                    class="product-image-wrap"
                  >
                    <image
                      v-if="product.image"
                      class="product-image"
                      :src="product.image"
                      mode="aspectFit"
                    />
                    <view v-else class="cover-placeholder"
                      ><wd-icon name="image" size="32px" color="#c5c5c5"
                    /></view>
                    <text class="cover-quantity">×{{ product.quantity }}</text>
                  </view>
                </view>
              </view>
              <view v-if="!order.items?.length" class="order-overview">暂无商品信息</view>
            </view>
            <view v-if="order.items?.length" class="product-info">
              <view class="product-summary">{{ productSummary(order) }}</view>
              <text v-if="requiresInstallation(order)" class="installation-tag">需安装</text>
            </view>
            <view class="booking-copy">安装时间：{{ installationBookingText(order) }}</view>
            <view v-if="order.status === 'PENDING_CONFIRMATION'" class="booking-copy">
              <view v-if="order.confirmationDeadlineAt"
                >确认截止时间：{{ formatBeijingTimestamp(order.confirmationDeadlineAt, 2) }}</view
              >
              <view>{{
                order.autoCompletionPaused
                  ? '自动完成已暂停，您仍可主动确认完成'
                  : '安装已完工，请确认完成；符合条件的订单到期后将自动完成'
              }}</view>
            </view>
            <view class="order-summary">
              <text
                v-if="order.status === 'PENDING_INSTALLATION' && requiresInstallation(order)"
                class="installation-hint"
                >{{ installationText(order) }}</text
              >
              <view class="order-amount"
                >{{ order.status === 'PENDING_PAYMENT' ? '待付款' : '合计'
                }}<text class="total-price"
                  ><text class="currency">¥</text>{{ formatAmount(order.payableAmount) }}</text
                ></view
              >
            </view>
            <view
              v-if="
                [
                  'PENDING_PAYMENT',
                  'PENDING_INSTALLATION',
                  'IN_SERVICE',
                  'PENDING_CONFIRMATION',
                  'COMPLETED',
                ].includes(order.status)
              "
              class="order-footer"
            >
              <view class="order-actions">
                <template v-if="order.status === 'PENDING_PAYMENT'">
                  <button
                    class="secondary-button"
                    :disabled="cancelingOrderId !== null || payingOrderId !== null"
                    :loading="cancelingOrderId === order.id"
                    @click="handleCancelOrder(order)"
                  >
                    取消订单
                  </button>
                  <button
                    class="primary-button"
                    :disabled="payingOrderId !== null || cancelingOrderId !== null"
                    :loading="payingOrderId === order.id"
                    @click="handlePayOrder(order)"
                  >
                    去付款
                  </button>
                </template>
                <template v-else-if="order.status === 'PENDING_CONFIRMATION'">
                  <button class="primary-button" @click="openDetails(order)">查看并确认</button>
                </template>
                <template v-else-if="order.status === 'PENDING_INSTALLATION'">
                  <button class="secondary-button" @click="openDetails(order)">查看详情</button>
                </template>
                <button
                  v-else-if="order.status === 'IN_SERVICE' || order.status === 'COMPLETED'"
                  class="secondary-button"
                  @click="openDetails(order)"
                >
                  查看详情
                </button>
              </view>
            </view>
          </view>
        </view>
        <view v-if="loading" class="load-more">加载中...</view>
        <view v-else-if="loadFailed" class="load-more" @click="loadOrders(pageNum === 0)"
          >加载失败，点击重试</view
        >
        <view v-else-if="!orders.length" class="empty-state">暂无相关商品订单</view>
        <view v-else class="load-more" @click="loadOrders()">{{
          hasMore ? '继续下滑查看更多订单' : '没有更多订单了'
        }}</view>
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
  padding: 0 8rpx;
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

.order-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.order-card {
  padding: 28rpx;
  background: #ffffff;
  border: 1rpx solid rgba(29, 29, 31, 0.035);
  border-radius: 20rpx;
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.order-date {
  min-width: 0;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 32rpx;
}

.status-badge {
  flex-shrink: 0;
  color: $jfx-font-dec;
  font-size: 23rpx;
  line-height: 32rpx;
}

.status-pending-payment {
  color: $jfx-brandColor;
}

.status-completed {
  color: $jfx-font-dec2;
}

.product-gallery {
  width: 100%;
}

.product-covers {
  display: flex;
  gap: 16rpx;
  overflow: hidden;
}

.product-image-wrap {
  position: relative;
  width: calc((100% - 32rpx) / 3);
  height: 0;
  padding-bottom: calc((100% - 32rpx) / 3);
  flex-shrink: 0;
  overflow: hidden;
  background: $jfx-pageBackGroundColor;
  border-radius: 12rpx;
}

.product-image,
.cover-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-quantity {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  padding: 1rpx 9rpx;
  border-radius: 6rpx;
  color: $jfx-font-dec;
  background: rgba(255, 255, 255, 0.92);
  font-size: 20rpx;
  line-height: 28rpx;
}

.order-overview {
  padding: 32rpx 0;
  color: $jfx-font-dec2;
  font-size: 23rpx;
}

.booking-copy {
  margin-top: 14rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 34rpx;
}
.order-summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 24rpx;
}

.product-info {
  margin-top: 20rpx;
}

.product-summary {
  @include ellipsis(1);
  color: $jfx-font-title;
  font-size: 25rpx;
  line-height: 38rpx;
}

.installation-tag {
  display: inline-block;
  margin-top: 12rpx;
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
  color: #9b7455;
  background: #faf3eb;
  font-size: 20rpx;
  line-height: 30rpx;
}

.installation-hint {
  color: $jfx-font-dec2;
  font-size: 22rpx;
}

.order-amount {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
  margin-left: auto;
  color: $jfx-font-dec;
  font-size: 22rpx;
}

.total-price {
  color: $jfx-font-title;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 42rpx;
  font-variant-numeric: tabular-nums;
}

.currency {
  margin-right: 3rpx;
  font-size: 23rpx;
  font-weight: 500;
}

.order-footer {
  margin-top: 24rpx;
}

.order-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 16rpx;
}

.secondary-button,
.primary-button {
  box-sizing: border-box;
  min-width: 148rpx;
  height: 60rpx;
  margin: 0;
  padding: 0 24rpx;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 56rpx;
  border-radius: 12rpx;
}

.secondary-button {
  color: $jfx-font-dec;
  background: #ffffff;
  border: 2rpx solid $jfx-border2;
}

.primary-button {
  color: $jfx-brandColor;
  background: #fff5f3;
  border: 2rpx solid #f5ded9;
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

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onLoad, onShow, onHide, onUnload } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores/modules/member'
import {
  formatBeijingTimestamp,
  canConfirmOrderCompletion,
  orderBookingText,
  orderInstallationText,
} from '@/utils/order-booking'
import {
  getUserOrderDetail,
  confirmOrderCompletion,
  cancelOrder,
  payOrder,
  requestWechatPayment,
} from '@/api/order'
import { maskMobile } from '@/utils/format'
import type { ProductOrderDetail } from '@/types/product-order-detail'
import type { ProductOrderApiStatus } from '@/types/product-order'

const order = ref<ProductOrderDetail | null>(null)
const orderId = ref<number | null>(null)
const loading = ref(false)
const errorMessage = ref('')
let requestId = 0
const memberStore = useMemberStore()
const ownerId = memberStore.profile?.id
const confirmingPayment = ref(false)
const submittingCompletion = ref(false)
const pendingAction = ref<'pay' | 'cancel' | null>(null)
const canConfirmCompletion = computed(() => !!order.value && canConfirmOrderCompletion(order.value))
const confirmationPaused = ref(false)
const refreshLoading = ref(false)
const accessBlocked = ref(false)
let visible = false
const invalidateRequest = () => {
  requestId++
  loading.value = false
  refreshLoading.value = false
}
const configs: Record<ProductOrderApiStatus, { title: string; description: string; tone: string }> =
  {
    PENDING_PAYMENT: { title: '待付款', description: '订单已提交，等待付款', tone: 'red' },
    PENDING_INSTALLATION: { title: '待安装', description: '订单等待安排安装服务', tone: 'orange' },
    IN_SERVICE: { title: '服务中', description: '订单服务进行中', tone: 'green' },
    PENDING_CONFIRMATION: {
      title: '待确认',
      description: '安装已完工，待您确认完成',
      tone: 'orange',
    },
    COMPLETED: { title: '已完成', description: '订单已完成，感谢您的信任', tone: 'gray' },
    CANCELED: { title: '已取消', description: '订单已取消', tone: 'gray' },
    REFUNDING: { title: '退款中', description: '订单退款处理中', tone: 'orange' },
    REFUNDED: { title: '已退款', description: '订单已退款', tone: 'gray' },
  }
const config = computed(() => {
  if (confirmingPayment.value)
    return {
      title: '支付结果确认中',
      description: '正在等待支付结果，请勿重复下单',
      tone: 'orange',
    }
  if (!order.value) return null
  if (order.value.paymentStatus === 'CLOSED')
    return { title: '订单已关闭', description: '订单支付已关闭', tone: 'gray' }
  const current = configs[order.value.status] ?? {
    title: '订单详情',
    description: '',
    tone: 'gray',
  }
  return order.value.status === 'PENDING_INSTALLATION'
    ? { ...current, description: orderInstallationText(order.value) }
    : current
})
const totalQuantity = computed(
  () => order.value?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
)
const displayStatus = computed(() => {
  const text =
    order.value?.status === 'PENDING_INSTALLATION' &&
    !confirmingPayment.value &&
    order.value.paymentStatus !== 'CLOSED'
      ? orderInstallationText(order.value)
      : config.value?.title
  return text === '待派单' ? '待安装' : text
})
const requiresInstall = computed(
  () => order.value?.items.some((item) => item.requiresInstall) ?? false,
)
const installation = computed(() => order.value?.installation)
const primaryAction = computed(() => {
  if (confirmingPayment.value || order.value?.paymentStatus === 'CLOSED') return ''
  if (order.value?.status === 'PENDING_PAYMENT') return '立即付款'
  if (canConfirmCompletion.value) return '确认完成'
  if (order.value?.status === 'IN_SERVICE') return '意见反馈'
  return ''
})
const money = (value: string | number | null | undefined) => {
  if (value == null || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : '—'
}
const loadOrder = async () => {
  if (!orderId.value || !visible || refreshLoading.value || accessBlocked.value) return
  if (memberStore.profile?.id !== ownerId) return
  const currentRequest = ++requestId
  refreshLoading.value = true
  loading.value = !order.value
  errorMessage.value = ''
  confirmationPaused.value = false
  try {
    const result = await getUserOrderDetail(orderId.value)
    if (currentRequest !== requestId || !visible || memberStore.profile?.id !== ownerId) return
    if (result.code !== 200) throw { statusCode: result.code }
    if (!result.data) throw { statusCode: 404 }
    order.value = result.data
    if (confirmingPayment.value) {
      if (['PAID', 'REFUNDING', 'REFUNDED', 'CLOSED'].includes(result.data.paymentStatus)) {
        confirmingPayment.value = false
      } else {
        confirmationPaused.value = true
      }
    }
  } catch (error) {
    if (currentRequest !== requestId) return
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
      confirmingPayment.value = false
      accessBlocked.value = true
      order.value = null
      errorMessage.value = statusCode === 401 ? '请重新登录后查看订单' : '订单不存在或已无法查看'
    } else if (confirmingPayment.value) {
      confirmationPaused.value = true
    } else {
      errorMessage.value = '订单加载失败，请重试'
    }
  } finally {
    if (currentRequest === requestId) {
      loading.value = false
      refreshLoading.value = false
    }
  }
}
const refreshPayment = () => {
  if (refreshLoading.value) return
  invalidateRequest()
  void loadOrder()
}
onLoad((query) => {
  const rawId = String(query?.id ?? '')
  const id = Number(rawId)
  if (!/^\d+$/.test(rawId) || !Number.isInteger(id) || id <= 0 || id > 2147483647) {
    errorMessage.value = '订单参数无效，请返回订单列表重新进入'
    return
  }
  orderId.value = id
  confirmingPayment.value = query?.confirmPayment === '1'
})
onShow(() => {
  visible = true
  void loadOrder()
})
onHide(() => {
  visible = false
  invalidateRequest()
})
onUnload(() => {
  visible = false
  invalidateRequest()
})
watch(
  () => memberStore.profile?.id,
  (id) => {
    if (id === ownerId) return
    invalidateRequest()
    order.value = null
    confirmingPayment.value = false
    accessBlocked.value = true
    errorMessage.value = '登录账号已变更，请返回订单列表重新进入'
  },
  { flush: 'sync' },
)
const canActOnPendingOrder = () =>
  visible &&
  !accessBlocked.value &&
  !refreshLoading.value &&
  !confirmingPayment.value &&
  memberStore.profile?.id === ownerId &&
  order.value?.status === 'PENDING_PAYMENT' &&
  order.value.paymentStatus !== 'CLOSED'

const handleCancelOrder = async () => {
  if (pendingAction.value || !canActOnPendingOrder()) return
  pendingAction.value = 'cancel'
  try {
    const { confirm } = await uni.showModal({
      title: '取消订单',
      content: '确定取消该订单吗？',
      confirmText: '取消订单',
      cancelText: '暂不取消',
      confirmColor: '#D92D20',
    })
    if (!confirm || !canActOnPendingOrder()) return
    invalidateRequest()
    const response = await cancelOrder(orderId.value!)
    if (!visible || memberStore.profile?.id !== ownerId) return
    uni.showToast({
      title: response.code === 200 ? '订单已取消' : response.message || '取消失败，请重试',
      icon: response.code === 200 ? 'success' : 'none',
    })
  } catch {
    // Refresh server state after cancellation errors.
  } finally {
    invalidateRequest()
    await loadOrder()
    pendingAction.value = null
  }
}

const handlePayOrder = async () => {
  if (pendingAction.value || !canActOnPendingOrder()) return
  pendingAction.value = 'pay'
  try {
    invalidateRequest()
    const response = await payOrder(orderId.value!)
    if (!canActOnPendingOrder()) return
    if (response.code !== 200 || !response.data) {
      uni.showToast({ title: response.message || '暂时无法支付', icon: 'none' })
      return
    }
    try {
      await requestWechatPayment(response.data)
      if (memberStore.profile?.id !== ownerId || accessBlocked.value) return
      confirmingPayment.value = true
    } catch (error) {
      if (memberStore.profile?.id !== ownerId || accessBlocked.value) return
      const errMsg = (error as { errMsg?: string }).errMsg || ''
      if (!errMsg.includes('cancel')) {
        uni.showToast({ title: '支付未完成，请稍后重试', icon: 'none' })
      }
    }
  } catch {
    // The request layer displays payment errors.
  } finally {
    invalidateRequest()
    await loadOrder()
    pendingAction.value = null
  }
}
const confirmCompletion = async () => {
  if (
    submittingCompletion.value ||
    refreshLoading.value ||
    !canConfirmCompletion.value ||
    !visible ||
    accessBlocked.value
  )
    return
  if (memberStore.profile?.id !== ownerId) return
  submittingCompletion.value = true
  try {
    const result = await uni.showModal({
      title: '确认完成',
      content: '请确认安装服务已完成。确认后订单将标记为已完成。',
      confirmText: '确认完成',
      confirmColor: '#D92D20',
    })
    if (
      !result.confirm ||
      !visible ||
      memberStore.profile?.id !== ownerId ||
      !canConfirmCompletion.value
    )
      return
    const id = orderId.value!
    invalidateRequest()
    try {
      const response = await confirmOrderCompletion(id)
      if (!visible || memberStore.profile?.id !== ownerId) return
      if (response.code !== 200) {
        uni.showToast({ title: response.message || '确认失败，请刷新后重试', icon: 'none' })
      } else {
        uni.showToast({ title: '订单已确认完成', icon: 'success' })
      }
    } catch {
      // 请求层提示错误；包括 409 竞争冲突，随后以服务端最新状态为准。
    }
    if (visible && memberStore.profile?.id === ownerId) {
      invalidateRequest()
      await loadOrder()
    }
  } finally {
    submittingCompletion.value = false
  }
}
const runPrimaryAction = () => {
  if (!order.value || confirmingPayment.value || order.value.paymentStatus === 'CLOSED') return
  if (order.value.status === 'PENDING_CONFIRMATION') {
    void confirmCompletion()
    return
  }
  if (order.value.status === 'PENDING_PAYMENT') {
    void handlePayOrder()
    return
  }
  if (order.value.status === 'IN_SERVICE') {
    uni.navigateTo({ url: '/pages-sub/my/feedback/feedback' })
    return
  }
}
const copyOrderNo = () => {
  if (order.value) uni.setClipboardData({ data: order.value.orderNo })
}
</script>

<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view v-if="loading" class="page-state">正在加载订单...</view>
      <view v-else-if="errorMessage" class="page-state">
        <view>{{ errorMessage }}</view>
        <button v-if="orderId && !accessBlocked" class="retry-button" @click="loadOrder">
          重新加载
        </button>
      </view>
      <view v-else-if="order && config" class="page-content">
        <view class="detail-card goods-card">
          <view class="card-heading">
            <text class="section-title">商品信息</text>
            <text :class="['order-status', 'tone-' + config.tone]">{{ displayStatus }}</text>
          </view>
          <view v-if="confirmingPayment" class="confirmation-note">
            <text>服务端结果暂未确认，请勿重复下单</text>
            <text v-if="confirmationPaused" class="text-action" @click="refreshPayment"
              >刷新结果</text
            >
          </view>
          <view v-if="order.status === 'PENDING_CONFIRMATION'" class="service-record">
            <view>安装已完工，请核实后确认完成</view>
            <view v-if="order.confirmationDeadlineAt"
              >确认截止时间：{{ formatBeijingTimestamp(order.confirmationDeadlineAt, 2) }}</view
            >
            <view>{{
              order.autoCompletionPaused
                ? '自动完成已暂停，您仍可主动确认完成'
                : '符合条件的订单到期后将自动完成；自动完成前您仍可主动确认'
            }}</view>
          </view>
          <view v-for="item in order.items" :key="item.id" class="product-row">
            <view class="product-image-wrap">
              <image v-if="item.image" class="product-image" :src="item.image" mode="aspectFit" />
              <text v-else class="muted">暂无图片</text>
            </view>
            <view class="product-copy">
              <view class="product-name">{{ item.productName }}</view>
              <view class="product-description">{{ item.skuDescription || '默认规格' }}</view>
              <view class="product-bottom"
                ><text class="product-price">¥{{ money(item.unitPrice) }}</text
                ><text class="quantity">×{{ item.quantity }}</text></view
              >
            </view>
          </view>
          <view v-if="!order.items.length" class="empty-products">暂无商品明细</view>
          <view v-if="order.items.length" class="goods-caption">
            <text>共 {{ totalQuantity }} 件商品</text>
            <text v-if="requiresInstall">{{
              order.items.every((item) => item.requiresInstall) ? '需安装' : '部分商品需安装'
            }}</text>
          </view>
        </view>

        <view class="detail-card">
          <view class="section-title">安装安排</view>
          <view class="booking-block"
            ><text class="field-label">预约时间</text
            ><view class="booking-time">{{ orderBookingText(order) }}</view></view
          >
          <view class="address-block">
            <view class="contact-line"
              ><text>{{ order.contactName }}</text
              ><text>{{ maskMobile(order.contactPhone) }}</text></view
            >
            <view class="address-line">{{ order.serviceAddress || '暂无地址信息' }}</view>
          </view>
          <view v-if="installation?.serviceRecord" class="service-record"
            ><text class="field-label">服务记录</text
            ><view>{{ installation.serviceRecord }}</view></view
          >
          <view v-if="installation?.completedAt" class="record-line"
            ><text>安装完成</text
            ><text>{{ formatBeijingTimestamp(installation.completedAt, 2) }}</text></view
          >
        </view>

        <view class="detail-card">
          <view class="section-title">订单信息</view>
          <view class="cost-lines">
            <view class="record-line"
              ><text>订单编号</text
              ><view class="order-number"
                ><text>{{ order.orderNo }}</text
                ><text class="copy-action" @click="copyOrderNo">复制</text></view
              ></view
            >
            <view class="record-line"
              ><text>下单时间</text
              ><text>{{ formatBeijingTimestamp(order.createdAt, 2) }}</text></view
            >
            <view class="record-line"
              ><text>付款时间</text
              ><text>{{ order.paidAt ? formatBeijingTimestamp(order.paidAt, 2) : '—' }}</text></view
            >
            <view class="record-line"
              ><text>商品金额</text><text>¥{{ money(order.productAmount) }}</text></view
            >
            <view class="record-line"
              ><text>应付金额</text><text>¥{{ money(order.payableAmount) }}</text></view
            >
          </view>
          <view v-if="order.completedAt" class="record-line">
            <text>订单完成时间</text><text>{{ formatBeijingTimestamp(order.completedAt, 2) }}</text>
          </view>
          <view v-if="order.completionType" class="record-line">
            <text>完成方式</text
            ><text>{{
              order.completionType === 'CUSTOMER_CONFIRMED' ? '客户确认完成' : '超时自动完成'
            }}</text>
          </view>
          <view
            v-if="installation?.customerConfirmed && installation.customerConfirmedAt"
            class="record-line"
          >
            <text>客户确认时间</text
            ><text>{{ formatBeijingTimestamp(installation.customerConfirmedAt, 2) }}</text>
          </view>
          <view class="total-line"
            ><text>实付款</text
            ><view class="total-price"
              ><text class="currency">¥</text>{{ money(order.paidAmount) }}</view
            ></view
          >
        </view>
      </view>
      <view v-else-if="confirmingPayment" class="page-state">
        <view>支付结果确认中</view>
        <button
          v-if="confirmationPaused"
          class="retry-button"
          :disabled="refreshLoading"
          @click="refreshPayment"
        >
          刷新支付结果
        </button>
      </view>
    </scroll-view>
    <view v-if="order && !loading && !errorMessage && primaryAction" class="bottom-bar">
      <button
        v-if="order.status === 'PENDING_PAYMENT'"
        class="secondary-footer-button"
        :loading="pendingAction === 'cancel'"
        :disabled="!!pendingAction || refreshLoading"
        @click="handleCancelOrder"
      >
        取消订单
      </button>
      <button
        class="primary-footer-button"
        :loading="submittingCompletion || pendingAction === 'pay'"
        :disabled="submittingCompletion || !!pendingAction || refreshLoading"
        @click="runPrimaryAction"
      >
        {{ primaryAction }}
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.detail-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}
.detail-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.page-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 24rpx 24rpx calc(36rpx + env(safe-area-inset-bottom));
}
.detail-card {
  padding: 28rpx;
  background: #fff;
  border-radius: 20rpx;
}
.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.section-title {
  font-size: 27rpx;
  font-weight: 600;
  line-height: 40rpx;
}
.order-status {
  flex-shrink: 0;
  font-size: 23rpx;
  line-height: 34rpx;
}
.tone-red {
  color: $jfx-brandColor;
}
.tone-orange {
  color: #a9784a;
}
.tone-green {
  color: #5b8064;
}
.tone-gray {
  color: $jfx-font-dec2;
}
.product-row {
  display: flex;
  gap: 22rpx;
  padding-top: 28rpx;
}
.product-image-wrap {
  display: flex;
  width: 140rpx;
  height: 140rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: $jfx-pageBackGroundColor;
  border-radius: 12rpx;
}
.product-image {
  width: 100%;
  height: 100%;
}
.product-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}
.product-name {
  @include ellipsis(2);
  font-size: 26rpx;
  font-weight: 500;
  line-height: 38rpx;
}
.product-description {
  @include ellipsis(1);
  margin-top: 5rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 32rpx;
}
.product-bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
  padding-top: 12rpx;
  margin-top: auto;
}
.product-price {
  font-size: 26rpx;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.quantity,
.muted {
  color: $jfx-font-dec2;
  font-size: 22rpx;
}
.goods-caption {
  display: flex;
  justify-content: space-between;
  margin-top: 26rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid $jfx-border;
  color: $jfx-font-dec2;
  font-size: 22rpx;
}
.booking-block {
  margin-top: 24rpx;
}
.field-label {
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 34rpx;
}
.booking-time {
  margin-top: 6rpx;
  font-size: 27rpx;
  font-weight: 500;
  line-height: 40rpx;
}
.address-block {
  margin-top: 22rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid $jfx-border;
}
.contact-line {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  font-size: 25rpx;
  line-height: 38rpx;
}
.address-line {
  margin-top: 8rpx;
  color: $jfx-font-dec;
  font-size: 23rpx;
  line-height: 36rpx;
  overflow-wrap: anywhere;
}
.service-record {
  margin-top: 20rpx;
  font-size: 23rpx;
  line-height: 36rpx;
  color: $jfx-font-dec;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.cost-lines {
  margin-top: 20rpx;
}
.record-line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 14rpx;
  color: $jfx-font-dec;
  font-size: 23rpx;
  line-height: 36rpx;
}
.record-line > text:first-child {
  flex-shrink: 0;
  color: $jfx-font-dec2;
}
.record-line > text:last-child {
  min-width: 0;
  text-align: right;
  overflow-wrap: anywhere;
}
.total-line {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 24rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid $jfx-border;
  font-size: 24rpx;
}
.total-price {
  color: $jfx-brandColor;
  font-size: 38rpx;
  font-weight: 600;
  line-height: 46rpx;
  font-variant-numeric: tabular-nums;
}
.currency {
  margin-right: 4rpx;
  font-size: 24rpx;
}
.order-number {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 14rpx;
  min-width: 0;
}
.order-number > text:first-child {
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: right;
}
.copy-action {
  flex-shrink: 0;
  color: $jfx-font-dec;
  border-left: 1rpx solid $jfx-border2;
  padding-left: 14rpx;
}
.confirmation-note {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12rpx;
  padding-top: 16rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 34rpx;
}
.text-action {
  color: $jfx-brandColor;
}
.bottom-bar {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 20rpx;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid $jfx-border;
}
.primary-footer-button,
.secondary-footer-button {
  min-width: 190rpx;
  height: 72rpx;
  margin: 0;
  padding: 0 32rpx;
  font-size: 26rpx;
  line-height: 68rpx;
  border-radius: 14rpx;
  box-sizing: border-box;
}
.primary-footer-button {
  color: #fff;
  background: $jfx-brandColor;
  border: 2rpx solid $jfx-brandColor;
}
.secondary-footer-button {
  color: $jfx-font-dec;
  background: #fff;
  border: 2rpx solid $jfx-border2;
}
button::after {
  border: 0;
}
.page-state {
  padding: 180rpx 32rpx;
  color: $jfx-font-dec2;
  font-size: 26rpx;
  text-align: center;
}
.retry-button {
  margin: 28rpx auto 0;
  width: 240rpx;
  font-size: 25rpx;
  color: $jfx-brandColor;
  background: #fff5f3;
}
.empty-products {
  padding: 32rpx 0;
  color: $jfx-font-dec2;
  font-size: 24rpx;
}
</style>

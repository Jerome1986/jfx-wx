<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type {
  ProductOrderDetailStatus as OrderStatus,
  ProductOrderStatusConfig as StatusConfig,
} from '@/types/product-order-detail'

const configs: Record<OrderStatus, StatusConfig> = {
  'pending-payment': {
    title: '待付款',
    description: '请在30分钟内完成支付，超时订单自动取消',
    tone: 'red',
    activeStep: 1,
    footerPrimary: '立即付款',
    footerSecondary: '取消订单',
  },
  'pending-installation': {
    title: '待安装',
    description: '订单已支付，请预约上门安装时间',
    tone: 'orange',
    activeStep: 2,
    footerPrimary: '预约安装',
  },
  servicing: {
    title: '服务中',
    description: '师傅已接单，正在安排上门安装服务',
    tone: 'green',
    activeStep: 3,
    footerPrimary: '意见反馈',
  },
  completed: {
    title: '已完成',
    description: '商品安装服务已完成，支持售后服务',
    tone: 'gray',
    activeStep: 4,
    footerPrimary: '申请售后',
  },
}

const status = ref<OrderStatus>('servicing')
const config = computed(() => configs[status.value])
const steps = ['提交订单', '预约安装', '上门服务', '完成']
const products = [1, 2, 3]

onLoad((query) => {
  const queryStatus = query?.status as OrderStatus | undefined
  if (queryStatus && configs[queryStatus]) status.value = queryStatus
})

const openAddress = () => uni.navigateTo({ url: '/pages-sub/my/address/address' })
const openAppointment = () => uni.navigateTo({ url: '/pages-sub/my/appointment/appointment' })

const contactInstaller = () => {
  uni.makePhoneCall({
    phoneNumber: '13800015611',
    fail: () => uni.showToast({ title: '联系电话：13800015611', icon: 'none' }),
  })
}

const runPrimaryAction = () => {
  if (status.value === 'pending-payment') {
    uni.showToast({ title: '支付功能建设中', icon: 'none' })
    return
  }
  if (status.value === 'pending-installation') {
    openAppointment()
    return
  }
  if (status.value === 'servicing') {
    uni.navigateTo({ url: '/pages-sub/my/feedback/feedback' })
    return
  }
  uni.showToast({ title: '售后申请功能建设中', icon: 'none' })
}

const cancelOrder = () => {
  uni.showModal({
    title: '取消订单',
    content: '确定取消该商品订单吗？',
    confirmText: '确定取消',
    confirmColor: '#D92D20',
    success: ({ confirm }) => {
      if (confirm) uni.navigateBack()
    },
  })
}
</script>

<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="status-card">
          <view :class="['status-title', `tone-${config.tone}`]">{{ config.title }}</view>
          <view class="status-description">{{ config.description }}</view>
          <view class="install-label">商品已含基础安装</view>
        </view>

        <view class="progress-card">
          <view class="section-title">服务进度</view>
          <view class="progress-list">
            <view v-for="(step, index) in steps" :key="step" class="progress-item">
              <view class="step-track">
                <view
                  v-if="index > 0"
                  class="track-line track-before"
                  :class="{ active: index + 1 <= config.activeStep }"
                />
                <view class="step-number" :class="{ active: index + 1 <= config.activeStep }">
                  {{ index + 1 }}
                </view>
                <view
                  v-if="index < steps.length - 1"
                  class="track-line track-after"
                  :class="{ active: index + 1 < config.activeStep }"
                />
              </view>
              <view class="step-label" :class="{ active: index + 1 <= config.activeStep }">
                {{ step }}
              </view>
            </view>
          </view>
        </view>

        <view v-if="status === 'servicing'" class="service-card">
          <view class="service-copy">
            <view class="service-title">安装服务</view>
            <view class="service-name">王师傅</view>
            <view class="service-phone">联系电话：13800015611</view>
          </view>
          <button class="service-action" @click="contactInstaller">联系师傅</button>
        </view>

        <view v-if="status === 'pending-installation'" class="service-card">
          <view class="service-copy">
            <view class="service-title">安装时间</view>
            <view class="service-phone">师傅将 6月18日 15:00-18:00 上门安装</view>
          </view>
          <button class="service-action" @click="openAppointment">修改时间</button>
        </view>

        <view class="address-card" @click="openAddress">
          <image
            class="address-icon"
            src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/定位%201.png"
            mode="aspectFit"
          />
          <view class="address-copy">
            <view class="contact-line">张先生 138****5628</view>
            <view class="address-line">湖北省武汉市洪山区珞瑜路88号</view>
            <view class="address-detail">详细地址：家翻新社区服务中心2楼</view>
          </view>
          <text class="iconfont icon-youjiantou address-arrow" />
        </view>

        <view class="order-info-card">
          <view class="section-title order-heading">订单信息</view>
          <view class="product-list">
            <view v-for="item in products" :key="item" class="product-row">
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
                <view class="product-tag">含基础安装</view>
              </view>
              <view class="product-amount">
                <view class="product-quantity">x1</view>
                <view class="product-price">¥623</view>
              </view>
            </view>
          </view>

          <view class="order-summary">
            <view class="summary-line"><text>订单编号</text><text>JFX202606160089</text></view>
            <view class="summary-line"><text>下单时间</text><text>2026-06-16 15:08</text></view>
            <view class="summary-line"><text>商品金额（含安装）</text><text>¥689</text></view>
            <view class="summary-line"><text>优惠抵扣</text><text>-¥0</text></view>
          </view>
          <view class="total-price">¥689</view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <button v-if="config.footerSecondary" class="secondary-footer-button" @click="cancelOrder">
        {{ config.footerSecondary }}
      </button>
      <button class="primary-footer-button" @click="runPrimaryAction">
        {{ config.footerPrimary }}
      </button>
    </view>
  </view>
</template>

<style lang="scss">
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
  padding: 24rpx 24rpx 36rpx;
}

.status-card,
.progress-card,
.service-card,
.address-card,
.order-info-card {
  background: #ffffff;
  border-radius: 18rpx;
  box-shadow: 0 7rpx 25rpx rgba(55, 42, 32, 0.04);
}

.status-card {
  min-height: 164rpx;
  padding: 26rpx 24rpx 24rpx;
}

.status-title {
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.tone-red {
  color: #e52e24;
}
.tone-orange {
  color: #c87443;
}
.tone-green {
  color: #55a35d;
}
.tone-gray {
  color: #777777;
}

.status-description {
  margin-top: 8rpx;
  color: #777777;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 34rpx;
}

.install-label {
  display: flex;
  width: fit-content;
  height: 38rpx;
  margin-top: 12rpx;
  padding: 0 17rpx;
  align-items: center;
  color: #e52e24;
  font-size: 21rpx;
  font-weight: 500;
  line-height: 38rpx;
  background: #fff0ef;
  border-radius: 20rpx;
}

.progress-card {
  min-height: 174rpx;
  margin-top: 24rpx;
  padding: 26rpx 24rpx 24rpx;
}

.section-title {
  color: #222222;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.progress-list {
  display: flex;
  margin-top: 22rpx;
}

.progress-item {
  min-width: 0;
  flex: 1;
  text-align: center;
}

.step-track {
  position: relative;
  display: flex;
  height: 36rpx;
  align-items: center;
  justify-content: center;
}

.step-number {
  position: relative;
  z-index: 2;
  display: flex;
  width: 34rpx;
  height: 34rpx;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 19rpx;
  font-weight: 400;
  background: #aaaaaa;
  border-radius: 50%;
}

.step-number.active {
  background: #e42b22;
}

.track-line {
  position: absolute;
  top: 16rpx;
  width: 50%;
  height: 2rpx;
  background: #c8c8c8;
}

.track-line.active {
  background: #e42b22;
}

.track-before {
  left: 0;
}
.track-after {
  right: 0;
}

.step-label {
  margin-top: 10rpx;
  color: #aaaaaa;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 34rpx;
  white-space: nowrap;
}

.step-label.active {
  color: #222222;
}

.service-card {
  display: flex;
  min-height: 120rpx;
  margin-top: 24rpx;
  padding: 26rpx 24rpx;
  align-items: center;
  justify-content: space-between;
}

.service-title {
  color: #222222;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 36rpx;
}

.service-name,
.service-phone {
  color: #aaaaaa;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 32rpx;
}

.service-action {
  height: 44rpx;
  margin: 0 0 0 16rpx;
  padding: 0 20rpx;
  flex-shrink: 0;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 44rpx;
  background: #e42b22;
  border-radius: 12rpx;
}

.address-card {
  display: flex;
  min-height: 142rpx;
  margin-top: 24rpx;
  padding: 24rpx 24rpx;
  align-items: center;
}

.address-icon {
  width: 50rpx;
  height: 50rpx;
  margin-right: 26rpx;
  flex-shrink: 0;
}

.address-copy {
  min-width: 0;
  flex: 1;
}

.contact-line,
.address-line {
  color: #222222;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 34rpx;
}

.address-detail {
  margin-top: 4rpx;
  overflow: hidden;
  color: #aaaaaa;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 32rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.address-arrow {
  margin-left: 14rpx;
  flex-shrink: 0;
  color: #999999;
  font-size: 32rpx;
}

.order-info-card {
  margin-top: 24rpx;
  padding: 24rpx;
}

.order-heading {
  padding-bottom: 18rpx;
  border-bottom: 2rpx solid #eeeeee;
}

.product-row {
  display: flex;
  min-height: 136rpx;
  padding: 16rpx 0;
  align-items: center;
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
  font-size: 24rpx;
  font-weight: 600;
  line-height: 34rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-description {
  color: #777777;
  font-size: 21rpx;
  font-weight: 400;
  line-height: 30rpx;
}

.product-tag {
  display: flex;
  width: fit-content;
  height: 36rpx;
  margin-top: 8rpx;
  padding: 0 18rpx;
  align-items: center;
  color: #e52e24;
  font-size: 20rpx;
  line-height: 36rpx;
  background: #fff0ef;
  border-radius: 19rpx;
}

.product-amount {
  margin-left: 10rpx;
  flex-shrink: 0;
  text-align: right;
}

.product-quantity {
  color: #aaaaaa;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 32rpx;
}

.product-price {
  margin-top: 10rpx;
  color: #222222;
  font-size: 27rpx;
  font-weight: 500;
  line-height: 38rpx;
}

.order-summary {
  padding: 18rpx 0 16rpx;
  border-bottom: 2rpx solid #eeeeee;
}

.summary-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #777777;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 36rpx;
}

.total-price {
  padding-top: 18rpx;
  color: #e42b22;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 40rpx;
  text-align: right;
}

.bottom-bar {
  display: flex;
  min-height: 104rpx;
  padding: 18rpx 40rpx calc(18rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  align-items: center;
  background: #ffffff;
  border-top: 2rpx solid #eeeae6;
  gap: 24rpx;
}

.primary-footer-button,
.secondary-footer-button {
  height: 70rpx;
  margin: 0;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 70rpx;
  border-radius: 15rpx;
}

.primary-footer-button {
  min-width: 0;
  flex: 1;
  color: #ffffff;
  background: #e42b22;
}

.secondary-footer-button {
  width: 244rpx;
  flex-shrink: 0;
  color: #777777;
  background: #ffffff;
  border: 2rpx solid #eeeeee;
}

button::after {
  border: 0;
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CouponItem } from '@/types/coupons'

const activeTab = ref<'available' | 'expired'>('available')

const coupons: CouponItem[] = [
  { id: 1, amount: 86, threshold: 1000, expiry: '2026-06-30', status: 'available' },
  { id: 2, amount: 200, threshold: 2000, expiry: '2026-06-30', status: 'available' },
  { id: 3, amount: 200, threshold: 2000, expiry: '2026-06-30', status: 'expired' },
]

// 默认态按原型展示完整的三张券，失效页只展示失效记录。
const visibleCoupons = computed(() =>
  activeTab.value === 'available' ? coupons : coupons.filter((item) => item.status === 'expired'),
)

const useCoupon = (item: CouponItem) => {
  if (item.status === 'expired') return
  uni.switchTab({ url: '/pages/product/product' })
}
</script>

<template>
  <view class="coupons-page">
    <scroll-view class="coupons-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="overview-card">
          <view class="overview-left">
            <view class="overview-title">可用优惠券</view>
            <view class="overview-count">3</view>
            <view class="overview-description">下单时可选择符合条件的优惠<br />券抵扣订单金额</view>
          </view>
          <view class="overview-right">
            <view class="expiring-badge">即将过期1张</view>
            <view class="expiring-description">过期或失效后将不再展示为<br />可用券</view>
          </view>
        </view>

        <view class="coupon-tabs">
          <view
            :class="['coupon-tab', { active: activeTab === 'available' }]"
            @click="activeTab = 'available'"
          >
            可用
          </view>
          <view
            :class="['coupon-tab', { active: activeTab === 'expired' }]"
            @click="activeTab = 'expired'"
          >
            已失效
          </view>
        </view>

        <view class="coupon-list">
          <view
            v-for="item in visibleCoupons"
            :key="item.id"
            :class="['coupon-card', { expired: item.status === 'expired' }]"
          >
            <view class="coupon-value">
              <view class="amount-line">
                <text class="currency">¥</text>
                <text class="amount">{{ item.amount }}</text>
              </view>
              <view class="threshold">满¥{{ item.threshold }}可用</view>
            </view>
            <view class="coupon-divider" />
            <view class="coupon-detail">
              <view class="detail-copy">
                <view>适用于平台可用订单</view>
                <view>有效期至 {{ item.expiry }}</view>
                <view>最终可用范围以确认订单页为准</view>
              </view>
              <button
                v-if="item.status === 'available'"
                class="coupon-action"
                @click="useCoupon(item)"
              >
                去使用
              </button>
              <view v-else class="expired-badge">已失效</view>
            </view>
          </view>
        </view>

        <view class="list-tip">继续下滑查看更多优惠券</view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.coupons-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}
.coupons-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.page-content {
  padding: 24rpx 24rpx calc(50rpx + env(safe-area-inset-bottom));
}
.overview-card {
  display: flex;
  min-height: 194rpx;
  padding: 30rpx 24rpx 24rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(55, 42, 32, 0.05);
}
.overview-left {
  width: 50%;
  flex-shrink: 0;
}
.overview-title {
  color: #737373;
  font-size: 27rpx;
  line-height: 38rpx;
}
.overview-count {
  margin: 2rpx 0 5rpx 48rpx;
  color: #222;
  font-size: 44rpx;
  font-weight: 500;
  line-height: 54rpx;
}
.overview-description {
  color: #6f6f6f;
  font-size: 22rpx;
  line-height: 34rpx;
}
.overview-right {
  width: 50%;
  padding: 10rpx 0 0 18rpx;
}
.expiring-badge {
  display: flex;
  width: 184rpx;
  height: 42rpx;
  align-items: center;
  justify-content: center;
  color: $jfx-brandColor;
  font-size: 23rpx;
  line-height: 42rpx;
  background: #fff0ef;
  border-radius: 22rpx;
}
.expiring-description {
  margin-top: 10rpx;
  color: #aaa;
  font-size: 23rpx;
  line-height: 34rpx;
}
.coupon-tabs {
  display: flex;
  height: 74rpx;
  margin-top: 24rpx;
  padding: 16rpx;
  align-items: center;
  gap: 16rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(55, 42, 32, 0.045);
}
.coupon-tab {
  display: flex;
  height: 42rpx;
  flex: 1;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 25rpx;
  line-height: 42rpx;
  border-radius: 22rpx;
}
.coupon-tab.active {
  color: $jfx-brandColor;
  background: #fff0ef;
}
.coupon-list {
  margin-top: 24rpx;
}
.coupon-card {
  display: flex;
  min-height: 186rpx;
  padding: 24rpx;
  align-items: center;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(55, 42, 32, 0.045);
}
.coupon-card + .coupon-card {
  margin-top: 24rpx;
}
.coupon-value {
  display: flex;
  width: 190rpx;
  height: 138rpx;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $jfx-brandColor;
  background: #fff4f2;
  border-radius: 16rpx;
}
.amount-line {
  display: flex;
  align-items: baseline;
  line-height: 54rpx;
}
.currency {
  margin-right: 6rpx;
  font-size: 24rpx;
  font-weight: 400;
}
.amount {
  font-size: 46rpx;
  font-weight: 500;
}
.threshold {
  margin-top: 6rpx;
  color: #666;
  font-size: 24rpx;
  line-height: 34rpx;
  white-space: nowrap;
}
.coupon-divider {
  height: 132rpx;
  margin: 0 22rpx 0 18rpx;
  border-left: 2rpx dashed #eee;
}
.coupon-detail {
  position: relative;
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: flex-start;
}
.detail-copy {
  min-width: 0;
  color: #777;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 34rpx;
  white-space: nowrap;
}
.coupon-action {
  position: absolute;
  top: -4rpx;
  right: 0;
  width: 92rpx;
  height: 40rpx;
  margin: 0;
  padding: 0;
  color: #fff;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 40rpx;
  background: $jfx-brandColor;
  border-radius: 22rpx;
}
.coupon-action::after {
  border: 0;
}
.coupon-card.expired .coupon-value {
  color: #777;
  background: #f5f2ee;
}
.coupon-card.expired .detail-copy {
  color: #999;
}
.expired-badge {
  position: absolute;
  top: -4rpx;
  right: 0;
  display: flex;
  width: 92rpx;
  height: 40rpx;
  align-items: center;
  justify-content: center;
  color: #777;
  font-size: 21rpx;
  font-weight: 400;
  background: #f5f2ee;
  border-radius: 22rpx;
}
.list-tip {
  padding: 78rpx 0 24rpx;
  color: #aaa;
  font-size: 22rpx;
  font-weight: 400;
  text-align: center;
}
</style>

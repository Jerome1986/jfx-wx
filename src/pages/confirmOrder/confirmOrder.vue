<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAddressStore } from '@/stores/modules/address'
import type { OrderItem } from '@/types/confirm-order'

const addressStore = useAddressStore()
const { selectedAddress } = storeToRefs(addressStore)
const selectedPhone = computed(() => {
  const phone = selectedAddress.value?.phone || ''
  return /^1\d{10}$/.test(phone) ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone
})

// 订单优惠、积分与备注状态
const usePoints = ref(true)
const couponVisible = ref(false)
const remarkVisible = ref(false)
const selectedCouponId = ref(1)
const pendingCouponId = ref(1)
const orderRemark = ref('')
const remarkDraft = ref('')
const appointmentDate = ref('')
const appointmentTime = ref('')

// 可用优惠券数据
const coupons = [
  {
    id: 1,
    amount: 86,
    title: '满1000减86',
    description: '适用于加翻新商品订单',
    expiry: '有效期至2026.07.31',
  },
  {
    id: 2,
    amount: 30,
    title: '满500减30',
    description: '适用于厨房改造',
    expiry: '有效期至2026.07.31',
  },
]

const selectedCoupon = computed(
  () => coupons.find((item) => item.id === selectedCouponId.value) || coupons[0],
)
const couponDiscount = computed(() => selectedCoupon.value.amount)
const pointsDiscount = computed(() => (usePoints.value ? 8 : 0))
const payableAmount = computed(() => 1894 - couponDiscount.value - pointsDiscount.value)
const submitAmount = computed(() => 1894 - couponDiscount.value)
const remarkLabel = computed(() => orderRemark.value || '选填，给商家留言')

// 待确认商品数据
const products: OrderItem[] = [
  {
    id: 1,
    name: '九牧单把单孔高管面盆龙头-X32025-548/1B-Z',
    description: '高管龙头、新水校起泡器',
    price: 623,
    quantity: 1,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
  },
  {
    id: 2,
    name: '九牧单把单孔高管面盆龙头-X32025-548/1B-Z',
    description: '高管龙头、新水校起泡器',
    price: 199,
    quantity: 1,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-gooseneck-faucet.png',
  },
  {
    id: 3,
    name: '九牧单把单孔高管面盆龙头-X32025-548/1B-Z',
    description: '高管龙头、新水校起泡器',
    price: 588,
    quantity: 1,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
  },
]

// 页面通用轻提示
const showMessage = (title: string) => uni.showToast({ title, icon: 'none' })

// 跳转收货地址页面
const openAddress = () => {
  uni.navigateTo({ url: '/pages-sub/my/address/address' })
}

// 跳转预约安装并接收选择结果
const openAppointment = () => {
  uni.navigateTo({
    url: '/pages-sub/my/appointment/appointment',
    events: {
      appointmentSelected: (data: { date: string; time: string }) => {
        appointmentDate.value = data.date
        appointmentTime.value = data.time
      },
    },
  })
}

// 优惠券选择逻辑
const openCoupons = () => {
  pendingCouponId.value = selectedCouponId.value
  couponVisible.value = true
}
const confirmCoupon = () => {
  selectedCouponId.value = pendingCouponId.value
  couponVisible.value = false
}
// 订单备注编辑逻辑
const openRemark = () => {
  remarkDraft.value = orderRemark.value
  remarkVisible.value = true
}
const confirmRemark = () => {
  orderRemark.value = remarkDraft.value.trim()
  remarkVisible.value = false
}
// 积分开关与订单提交逻辑
const togglePoints = (event: any) => {
  usePoints.value = event.detail.value
}
const submitOrder = () => uni.showToast({ title: '订单提交成功', icon: 'success' })
</script>

<template>
  <view class="order-page">
    <scroll-view class="order-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <!-- 收货地址 -->
        <view class="info-card address-card" @click="openAddress">
          <image
            class="info-icon"
            src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/定位%201.png"
            mode="aspectFit"
          />
          <view class="info-content">
            <view class="contact-line"
              >{{ selectedAddress?.name || '请选择服务地址' }} {{ selectedPhone }}</view
            >
            <view class="address-line">{{ selectedAddress?.address || '暂无服务地址' }}</view>
            <view class="detail-address"
              >详细地址：{{ selectedAddress?.doorplate || '请补充门牌楼层' }}</view
            >
          </view>
          <text class="iconfont icon-youjiantou right-arrow" />
        </view>

        <!-- 预约安装 -->
        <view class="info-card appointment-card" @click="openAppointment">
          <image
            class="info-icon"
            src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/日历%201.png"
            mode="aspectFit"
          />
          <view class="info-content">
            <view class="appointment-title">预约安装</view>
            <view class="appointment-tip">{{
              appointmentDate ? `${appointmentDate} ${appointmentTime}` : '请选择安装时间'
            }}</view>
            <view class="appointment-note">安装服务包含在商品价格内</view>
          </view>
          <text class="iconfont icon-youjiantou right-arrow" />
        </view>

        <!-- 商品确认与订单选项 -->
        <view class="product-card">
          <view class="card-heading">
            <text class="card-title">商品确认</text>
            <text class="item-count">共4件</text>
          </view>
          <view class="product-list">
            <view v-for="item in products" :key="item.id" class="product-item">
              <image class="product-image" :src="item.image" mode="aspectFit" />
              <view class="product-info">
                <view class="product-name">{{ item.name }}</view>
                <view class="product-description">{{ item.description }}</view>
                <view class="product-bottom">
                  <view class="product-price"><text>¥</text>{{ item.price }}</view>
                  <text class="quantity">X{{ item.quantity }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="option-row" @click="openCoupons">
            <text class="option-title">优惠券</text>
            <view class="option-value red">已优惠 ¥{{ couponDiscount }}</view>
            <text class="iconfont icon-youjiantou right-arrow" />
          </view>
          <view class="option-row">
            <text class="option-title">积分抵扣</text>
            <view class="option-value red">可用811积分，抵扣¥8</view>
            <switch
              :checked="usePoints"
              class="points-switch"
              color="#D92D20"
              @change="togglePoints"
            />
          </view>
          <view class="option-row" @click="openRemark">
            <text class="option-title">订单备注</text>
            <view class="option-value muted remark-value">{{ remarkLabel }}</view>
            <text class="iconfont icon-youjiantou right-arrow" />
          </view>
        </view>

        <!-- 订单金额明细 -->
        <view class="amount-card">
          <view class="card-title">金额明细</view>
          <view class="amount-row"
            ><text>商品金额（含安装）</text><text class="amount-value">¥ 1894</text></view
          >
          <view class="amount-row"
            ><text>优惠抵扣</text><text class="amount-value discount">-¥{{ couponDiscount }}</text>
          </view>
          <view class="amount-row"
            ><text>积分抵扣</text><text class="amount-value discount">-¥{{ pointsDiscount }}</text>
          </view>
          <view class="amount-divider" />
          <view class="amount-row payable-row"
            ><text>实付款</text
            ><text class="amount-value discount">¥ {{ payableAmount }}</text></view
          >
        </view>
      </view>
    </scroll-view>

    <!-- 固定提交订单栏 -->
    <view class="submit-bar">
      <view class="submit-total">
        <view
          ><text class="submit-label">实付款</text
          ><text class="submit-price">¥ {{ submitAmount }}</text></view
        >
        <view class="submit-note">已含基础安装服务</view>
      </view>
      <button class="submit-button" @click="submitOrder">提交订单</button>
    </view>

    <!-- 优惠券选择弹层 -->
    <wd-popup
      v-model="couponVisible"
      position="bottom"
      round
      safe-area-inset-bottom
      custom-style="height: 880rpx;"
    >
      <view class="coupon-popup">
        <view class="coupon-popup-title">选择优惠券</view>
        <view class="coupon-section-title">可用优惠券</view>
        <view class="coupon-description">优惠券金额将在订单金额中自动抵扣</view>
        <view class="coupon-list">
          <view
            v-for="coupon in coupons"
            :key="coupon.id"
            class="coupon-card"
            :class="{ selected: pendingCouponId === coupon.id }"
            @click="pendingCouponId = coupon.id"
          >
            <view class="coupon-amount">¥{{ coupon.amount }}</view>
            <view class="coupon-content">
              <view class="coupon-title">{{ coupon.title }}</view>
              <view class="coupon-subtitle">{{ coupon.description }}</view>
              <view class="coupon-expiry">{{ coupon.expiry }}</view>
            </view>
            <wd-checkbox :model-value="pendingCouponId === coupon.id" checked-color="#D92D20" />
          </view>
        </view>
        <button class="coupon-confirm" @click="confirmCoupon">确认使用</button>
      </view>
    </wd-popup>

    <!-- 订单备注弹层 -->
    <wd-popup
      v-model="remarkVisible"
      position="bottom"
      round
      safe-area-inset-bottom
      custom-style="height: 790rpx;"
    >
      <view class="remark-popup">
        <view class="remark-popup-title">订单备注</view>
        <view class="remark-section-title">给客服或师傅留言</view>
        <view class="remark-description">备注仅用于本次订单，师傅或客服会在服务前查看</view>
        <view class="remark-input-wrap">
          <textarea
            v-model="remarkDraft"
            class="remark-input"
            :maxlength="100"
            placeholder="选填，例如门禁、停车、希望师傅提前联系"
            placeholder-class="remark-placeholder"
          />
          <view class="remark-count">{{ remarkDraft.length }}/100</view>
        </view>
        <button class="remark-confirm" @click="confirmRemark">确认</button>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss">
/* 页面基础布局 */
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
  padding: 24rpx 24rpx 30rpx;
}

/* 地址与预约信息卡片 */
.info-card,
.product-card,
.amount-card {
  background: #fff;
  border-radius: 18rpx;
}

.info-card {
  display: flex;
  min-height: 126rpx;
  padding: 22rpx 24rpx;
  align-items: center;
  gap: 18rpx;
}

.info-icon {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
}

.right-arrow {
  flex-shrink: 0;
  color: $jfx-font-dec2;
  font-size: 28rpx;
  line-height: 32rpx;
}

.info-content {
  min-width: 0;
  flex: 1;
}

.contact-line,
.appointment-title {
  color: $jfx-font-title;
  font-size: 25rpx;
  font-weight: 500;
  line-height: 35rpx;
}

.address-line {
  margin-top: 5rpx;
  color: $jfx-font-title;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 33rpx;
}

.detail-address,
.appointment-tip,
.appointment-note {
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 32rpx;
}

.detail-address {
  margin-top: 4rpx;
}

.appointment-card {
  margin-top: 24rpx;
}

.appointment-title {
  font-size: 26rpx;
}

.appointment-tip {
  margin-top: 3rpx;
  color: $jfx-font-dec;
}

/* 商品确认与订单选项 */
.product-card {
  margin-top: 24rpx;
  padding: 22rpx 24rpx 0;
}

.card-heading {
  display: flex;
  padding-bottom: 17rpx;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2rpx solid $jfx-border;
}

.card-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.item-count {
  color: $jfx-font-dec2;
  font-size: 24rpx;
}

.product-item {
  display: flex;
  min-height: 164rpx;
  margin-left: 118rpx;
  padding: 24rpx 0;
  border-bottom: 2rpx solid $jfx-border;
}

.product-item:last-child {
  border-bottom: 0;
}

.product-image {
  width: 100rpx;
  height: 100rpx;
  margin-left: -118rpx;
  flex-shrink: 0;
  align-self: center;
  background: #faf9f7;
  border-radius: 14rpx;
}

.product-info {
  display: flex;
  min-width: 0;
  margin-left: 18rpx;
  flex: 1;
  flex-direction: column;
}

.product-name {
  @include ellipsis(2);

  color: $jfx-font-dec;
  font-size: 25rpx;
  font-weight: 500;
  line-height: 34rpx;
}

.product-description {
  @include ellipsis;

  margin-top: 8rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 30rpx;
}

.product-bottom {
  display: flex;
  margin-top: auto;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  color: $jfx-brandColor;
  font-size: 25rpx;
}

.product-price text {
  margin-right: 4rpx;
  font-size: 21rpx;
}

.quantity {
  color: $jfx-font-dec;
  font-size: 22rpx;
}

.option-row {
  display: flex;
  min-height: 76rpx;
  align-items: center;
  border-top: 2rpx solid $jfx-border;
}

.option-title {
  flex-shrink: 0;
  color: $jfx-font-title;
  font-size: 26rpx;
  font-weight: 500;
}

.option-value {
  margin-left: auto;
  font-size: 22rpx;
}

.option-value.red {
  color: $jfx-brandColor;
}

.option-value.muted {
  color: $jfx-font-dec2;
}

.remark-value {
  @include ellipsis;

  max-width: 360rpx;
}

.points-switch {
  margin-left: 18rpx;
  transform: scale(0.72);
  transform-origin: right center;
}

/* 金额明细 */
.amount-card {
  margin-top: 24rpx;
  padding: 24rpx;
}

.amount-row {
  display: flex;
  margin-top: 20rpx;
  align-items: center;
  justify-content: space-between;
  color: $jfx-font-dec;
  font-size: 23rpx;
}

.amount-value {
  color: $jfx-font-title;
}

.amount-value.discount {
  color: $jfx-brandColor;
}

.amount-divider {
  height: 2rpx;
  margin-top: 20rpx;
  background: $jfx-border;
}

.payable-row {
  color: $jfx-font-title;
  font-size: 26rpx;
  font-weight: 600;
}

/* 底部订单提交栏 */
.submit-bar {
  display: flex;
  box-sizing: border-box;
  height: calc(140rpx + constant(safe-area-inset-bottom));
  height: calc(140rpx + env(safe-area-inset-bottom));
  padding: 12rpx 24rpx calc(12rpx + constant(safe-area-inset-bottom));
  padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  align-items: center;
  background: #fff;
  border-top: 2rpx solid $jfx-border2;
}

.submit-total {
  min-width: 0;
  flex: 1;
}

.submit-label {
  color: $jfx-font-dec;
  font-size: 24rpx;
}

.submit-price {
  margin-left: 20rpx;
  color: $jfx-brandColor;
  font-size: 30rpx;
}

.submit-note {
  margin-top: 3rpx;
  color: $jfx-font-dec2;
  font-size: 20rpx;
}

.submit-button {
  width: 244rpx;
  height: 62rpx;
  margin: 0;
  color: #fff;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 62rpx;
  background: $jfx-brandColor;
  border-radius: 16rpx;
}

/* 优惠券选择弹层 */
.coupon-popup {
  box-sizing: border-box;
  height: 100%;
  padding: 34rpx 56rpx 30rpx;
  background: #fff;
}

.coupon-popup-title {
  color: $jfx-font-title;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 48rpx;
  text-align: center;
}

.coupon-section-title {
  margin-top: 44rpx;
  color: $jfx-font-title;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.coupon-description {
  margin-top: 6rpx;
  color: $jfx-font-dec;
  font-size: 24rpx;
  line-height: 34rpx;
}

.coupon-list {
  margin-top: 24rpx;
}

.coupon-card {
  display: flex;
  min-height: 150rpx;
  margin-bottom: 16rpx;
  padding: 24rpx;
  align-items: center;
  gap: 28rpx;
  background: #fff;
  border: 2rpx solid $jfx-border2;
  border-radius: 16rpx;
}

.coupon-card.selected {
  border-color: $jfx-brandColor;
}

.coupon-amount {
  display: flex;
  width: 112rpx;
  height: 112rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: $jfx-brandColor;
  font-size: 31rpx;
  background: #fff1ef;
  border-radius: 16rpx;
}

.coupon-content {
  min-width: 0;
  flex: 1;
}

.coupon-title {
  color: $jfx-font-title;
  font-size: 29rpx;
  line-height: 42rpx;
}

.coupon-subtitle {
  margin-top: 6rpx;
  color: $jfx-font-dec;
  font-size: 23rpx;
  line-height: 32rpx;
}

.coupon-expiry {
  margin-top: 4rpx;
  color: $jfx-font-dec2;
  font-size: 21rpx;
  line-height: 30rpx;
}

.coupon-confirm {
  height: 64rpx;
  margin: 42rpx 0 0;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 64rpx;
  background: $jfx-brandColor;
  border-radius: 16rpx;
}

/* 订单备注弹层 */
.remark-popup {
  box-sizing: border-box;
  height: 100%;
  padding: 34rpx 56rpx 30rpx;
  background: #fff;
}

.remark-popup-title {
  color: $jfx-font-title;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 48rpx;
  text-align: center;
}

.remark-section-title {
  margin-top: 44rpx;
  color: $jfx-font-title;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.remark-description {
  margin-top: 6rpx;
  color: $jfx-font-dec;
  font-size: 23rpx;
  line-height: 34rpx;
}

.remark-input-wrap {
  position: relative;
  box-sizing: border-box;
  height: 250rpx;
  margin-top: 26rpx;
  padding: 24rpx 24rpx 52rpx;
  background: #faf9f7;
  border: 2rpx solid $jfx-border2;
  border-radius: 16rpx;
}

.remark-input {
  width: 100%;
  height: 100%;
  color: $jfx-font-title;
  font-size: 25rpx;
  line-height: 36rpx;
  background: transparent;
}

.remark-placeholder {
  color: $jfx-font-dec2;
}

.remark-count {
  position: absolute;
  right: 24rpx;
  bottom: 18rpx;
  color: $jfx-font-dec2;
  font-size: 23rpx;
  line-height: 32rpx;
}

.remark-confirm {
  height: 64rpx;
  margin: 80rpx 0 0;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 64rpx;
  background: $jfx-brandColor;
  border-radius: 16rpx;
}

button::after {
  border: 0;
}
</style>

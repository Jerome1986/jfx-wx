<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { CartItem } from '@/types/cart'

// 状态栏高度
const statusBarHeight = ref(0)
// 导航栏高度
const navigationHeight = ref(44)

onMounted(() => {
  // 系统信息
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
  // 菜单按钮
  const menuButton = uni.getMenuButtonBoundingClientRect()
  if (menuButton?.height && menuButton?.top) {
    navigationHeight.value = (menuButton.top - statusBarHeight.value) * 2 + menuButton.height
  }
})

// 购物车项目列表
const cartItems = ref<CartItem[]>([
  {
    id: 1,
    name: '九牧单把单孔高管面盆龙头-X32025-548/1B-Z',
    description: '高管龙头、新水校起泡器、冷热双控',
    price: 623,
    quantity: 1,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
    selected: true,
  },
  {
    id: 2,
    name: '九牧单把单孔高管面盆龙头-X32025-548/1B-Z',
    description: '高管龙头、新水校起泡器、冷热双控',
    price: 199,
    quantity: 2,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-gooseneck-faucet.png',
    selected: true,
  },
  {
    id: 3,
    name: '九牧单把单孔高管面盆龙头-X32025-548/1B-Z',
    description: '高管龙头、新水校起泡器、冷热双控',
    price: 588,
    quantity: 1,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
    selected: true,
  },
])

// 合计数量
const totalCount = computed(() => cartItems.value.reduce((total, item) => total + item.quantity, 0))
// 已选数量
const selectedCount = computed(() =>
  cartItems.value.filter((item) => item.selected).reduce((total, item) => total + item.quantity, 0),
)
// 已选合计
const selectedTotal = computed(() =>
  cartItems.value
    .filter((item) => item.selected)
    .reduce((total, item) => total + item.price * item.quantity, 0),
)
// 购物车商品是否已全选
const allSelected = computed({
  get: () => cartItems.value.length > 0 && cartItems.value.every((item) => item.selected),
  set: (value: boolean) =>
    cartItems.value.forEach((item) => {
      item.selected = value
    }),
})

// 减少商品数量
const decrease = (item: CartItem) => {
  if (item.quantity > 1) item.quantity -= 1
}

// 增加商品数量
const increase = (item: CartItem) => {
  item.quantity += 1
}

// 提交购物车结算
const checkout = () => {
  if (!selectedCount.value) {
    uni.showToast({ title: '请先选择商品', icon: 'none' })
    return
  }
  uni.navigateTo({ url: '/pages/confirmOrder/confirmOrder' })
}
</script>

<template>
  <view class="cart-page">
    <view
      class="custom-navigation"
      :style="{ paddingTop: `${statusBarHeight}px`, height: `${navigationHeight}px` }"
    >
      <view class="brand"><text>家</text><text class="brand-red">翻新</text></view>
      <view class="navigation-title">购物车</view>
      <view class="navigation-placeholder" />
    </view>

    <scroll-view class="cart-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="product-card">
          <view class="card-heading">
            <text class="card-title">商品清单</text>
            <text class="item-count">共{{ totalCount }}件</text>
          </view>

          <view class="product-list">
            <view v-for="item in cartItems" :key="item.id" class="product-item">
              <wd-checkbox
                v-model="item.selected"
                checked-color="#D92D20"
                custom-class="item-checkbox"
              />
              <image class="product-image" :src="item.image" mode="aspectFit" />
              <view class="product-info">
                <view class="product-name">{{ item.name }}</view>
                <view class="product-description">{{ item.description }}</view>
                <view class="product-bottom">
                  <view class="product-price"
                    ><text class="price-symbol">¥</text>{{ item.price }}</view
                  >
                  <view class="quantity-control">
                    <view class="quantity-button" @click="decrease(item)">
                      <wd-icon name="minus" custom-style="font-size: 25rpx; color: #999999;" />
                    </view>
                    <text class="quantity-value">{{ item.quantity }}</text>
                    <view class="quantity-button" @click="increase(item)">
                      <wd-icon name="plus" custom-style="font-size: 25rpx; color: #D92D20;" />
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="service-card">
          <view class="section-title">服务保障</view>
          <view class="service-list">
            <view class="service-item pink">
              <image
                class="service-icon"
                src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/质保服务%201.png"
                mode="aspectFit"
              />
              <text>质保服务</text>
            </view>
            <view class="service-item orange">
              <image
                class="service-icon"
                src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/报价透明%201.png"
                mode="aspectFit"
              />
              <text>报价透明</text>
            </view>
            <view class="service-item gold">
              <image
                class="service-icon"
                src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/专业上门%201.png"
                mode="aspectFit"
              />
              <text>专业上门</text>
            </view>
          </view>
        </view>

        <view class="instructions-card">
          <view class="section-title">购物说明</view>
          <view class="instructions-text"
            >商品价格以结算页为准，包上门安装，<br />一站式解决客户的后顾之忧</view
          >
        </view>
      </view>
    </scroll-view>

    <view class="checkout-bar">
      <view class="select-all">
        <wd-checkbox v-model="allSelected" checked-color="#D92D20" />
        <text>全选</text>
      </view>
      <view class="total-label">合计</view>
      <view class="total-price"><text>¥</text>{{ selectedTotal }}</view>
      <button class="checkout-button" @click="checkout">去结算</button>
    </view>
  </view>
</template>

<style lang="scss">
.cart-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.custom-navigation {
  position: relative;
  display: flex;
  box-sizing: content-box;
  padding-right: 28rpx;
  padding-left: 28rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
}

.brand {
  width: 150rpx;
  font-size: 32rpx;
  line-height: 44rpx;
}

.brand-red {
  color: $jfx-brandColor;
}

.navigation-title {
  position: absolute;
  right: 0;
  left: 0;
  color: $jfx-font-title;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 44rpx;
  text-align: center;
  pointer-events: none;
}

.navigation-placeholder {
  width: 150rpx;
}

.cart-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.page-content {
  padding: 28rpx 24rpx 32rpx;
}

.product-card,
.service-card,
.instructions-card {
  background: #fff;
  border-radius: 18rpx;
}

.product-card {
  padding: 22rpx 24rpx 0;
}

.card-heading {
  display: flex;
  padding-bottom: 18rpx;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2rpx solid $jfx-border;
}

.card-title,
.section-title {
  color: $jfx-font-title;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.item-count {
  color: $jfx-font-dec2;
  font-size: 25rpx;
}

.product-item {
  display: flex;
  min-height: 185rpx;
  padding: 24rpx 0;
  align-items: center;
  border-bottom: 2rpx solid $jfx-border;
}

.product-item:last-child {
  border-bottom: 0;
}

.item-checkbox {
  flex-shrink: 0;
}

.product-image {
  width: 168rpx;
  height: 168rpx;
  margin-left: 16rpx;
  flex-shrink: 0;
  background: #faf9f7;
  border-radius: 16rpx;
}

.product-info {
  min-width: 0;
  margin-left: 22rpx;
  flex: 1;
  align-self: stretch;
}

.product-name {
  overflow: hidden;
  color: $jfx-font-dec;
  font-size: 27rpx;
  font-weight: 500;
  line-height: 38rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-description {
  overflow: hidden;
  margin-top: 9rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 32rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.product-bottom {
  display: flex;
  margin-top: 14rpx;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  color: $jfx-brandColor;
  font-size: 29rpx;
  line-height: 40rpx;
}

.price-symbol {
  margin-right: 4rpx;
  font-size: 23rpx;
}

.quantity-control {
  display: flex;
  height: 44rpx;
  padding: 0 7rpx;
  align-items: center;
  background: #fff;
  border: 2rpx solid #ece7e2;
  border-radius: 24rpx;
}

.quantity-button {
  display: flex;
  width: 34rpx;
  height: 40rpx;
  align-items: center;
  justify-content: center;
}

.quantity-value {
  width: 38rpx;
  color: $jfx-font-title;
  font-size: 23rpx;
  text-align: center;
}

.service-card {
  margin-top: 24rpx;
  padding: 24rpx;
}

.service-list {
  display: flex;
  margin-top: 18rpx;
  gap: 46rpx;
}

.service-item {
  display: flex;
  min-width: 0;
  padding: 10rpx 16rpx;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 22rpx;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 16rpx;
}

.service-item.pink {
  background: #fff4f3;
}

.service-item.orange {
  background: #fff7f0;
}

.service-item.gold {
  background: #fff9ee;
}

.service-icon {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
}

.instructions-card {
  margin-top: 24rpx;
  padding: 26rpx 24rpx 30rpx;
}

.instructions-text {
  margin-top: 8rpx;
  color: $jfx-font-dec2;
  font-size: 24rpx;
  line-height: 36rpx;
}

.checkout-bar {
  display: flex;
  box-sizing: border-box;
  height: 120rpx;
  padding: 8rpx 24rpx;
  flex-shrink: 0;
  align-items: center;
  background: #fff;
  border-top: 2rpx solid $jfx-border2;
  border-bottom: 2rpx solid $jfx-border2;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 27rpx;
  white-space: nowrap;
}

.total-label {
  margin-left: 40rpx;
  color: $jfx-font-dec;
  font-size: 25rpx;
}

.total-price {
  margin-left: 10rpx;
  color: $jfx-brandColor;
  font-size: 30rpx;
}

.total-price text {
  margin-right: 3rpx;
  font-size: 24rpx;
}

.checkout-button {
  width: 204rpx;
  height: 56rpx;
  margin: 0 0 0 auto;
  color: #fff;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 56rpx;
  background: $jfx-brandColor;
  border-radius: 16rpx;
}

button::after {
  border: 0;
}
</style>

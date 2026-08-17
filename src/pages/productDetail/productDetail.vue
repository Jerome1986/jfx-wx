<script setup lang="ts">
import { computed, ref } from 'vue'

// 规格列表
const specifications = ['L3092D拉丝', 'L3092镀洛', 'L3092H枪灰']
// 已选
const selectedSpec = ref(specifications[0])

// 商品
const product = {
  name: '九牧单把单孔高管面盆龙头-X32025-548/1B-Z',
  description: '高管龙头、新水校起泡器，冷热双控防溅出水',
  price: 623,
  image:
    'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
}

// 已选标签
const selectedLabel = computed(() => `已选: ${selectedSpec.value}`)

// 显示页面提示消息
const showMessage = (title: string) => uni.showToast({ title, icon: 'none' })
// 将商品加入购物车
const addToCart = () => uni.showToast({ title: '已加入购物车', icon: 'success' })
// 立即购买当前商品
const buyNow = () => showMessage(`已选择 ${selectedSpec.value}`)
// 打开购物车
const openCart = () => uni.switchTab({ url: '/pages/cart/cart' })
// 分享当前商品
const shareProduct = () => showMessage('分享功能已准备')
</script>

<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="hero-card">
          <image class="hero-image" :src="product.image" mode="aspectFit" />
        </view>

        <view class="summary-card">
          <view class="price-share-row">
            <view class="price-group">
              <text class="price-symbol">¥</text
              ><text class="price-number">{{ product.price }}</text>
              <text class="install-tag">已含基础安装</text>
            </view>
            <view class="share-button" @click="shareProduct">
              <text class="iconfont icon-fenxiang share-icon" />
              <text>分享</text>
            </view>
          </view>

          <view class="product-name">{{ product.name }}</view>
          <view class="product-description">{{ product.description }}</view>

          <view class="divider" />
          <view class="section-title-row">
            <text class="section-title">服务保障</text>
            <text class="section-note">商品价格包含基础安装服务</text>
          </view>
          <view class="guarantee-list">
            <view class="guarantee-item orange">
              <wd-icon name="orders" custom-style="font-size: 36rpx; color: #ff7a45;" />
              <view
                ><view class="guarantee-title">报价透明</view
                ><view class="guarantee-desc">明细清晰可查</view></view
              >
            </view>
            <view class="guarantee-item pink">
              <wd-icon name="shield-check" custom-style="font-size: 36rpx; color: #f04438;" />
              <view
                ><view class="guarantee-title">质保服务</view
                ><view class="guarantee-desc">30天售后无忧</view></view
              >
            </view>
            <view class="guarantee-item gold">
              <wd-icon name="user-circle" custom-style="font-size: 36rpx; color: #b97725;" />
              <view
                ><view class="guarantee-title">专业上门</view
                ><view class="guarantee-desc">师傅认证服务</view></view
              >
            </view>
          </view>

          <view class="divider specification-divider" />
          <view class="section-title-row">
            <text class="section-title">规格选择</text>
            <text class="selected-label">{{ selectedLabel }}</text>
          </view>
          <view class="specification-row">
            <text class="specification-label">型号</text>
            <view class="specification-options">
              <button
                v-for="spec in specifications"
                :key="spec"
                class="specification-button"
                :class="{ active: selectedSpec === spec }"
                @click="selectedSpec = spec"
              >
                {{ spec }}
              </button>
            </view>
          </view>
        </view>

        <view class="product-detail-card">
          <view class="detail-heading">商品详情</view>
          <view class="parameter-card">
            <view class="parameter-title">产品参数</view>
            <view class="parameter-row"><text>品牌</text><text>九牧JOMOO</text></view>
            <view class="parameter-row"><text>型号</text><text>X32025-548/1B-Z</text></view>
            <view class="parameter-row"
              ><text>规格</text><text>{{ specifications.join('/') }}</text></view
            >
          </view>
          <view class="image-heading">商品图片</view>
          <image class="detail-image" :src="product.image" mode="widthFix" />
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <view class="cart-entry" @click="openCart">
        <image
          class="cart-icon"
          src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/cart.png"
          mode="aspectFit"
        />
        <text>购物车</text>
      </view>
      <view class="bottom-price">
        <view
          ><text class="price-symbol">¥</text
          ><text class="price-number">{{ product.price }}</text></view
        >
        <text class="bottom-install">已含基础安装</text>
      </view>
      <view class="bottom-actions">
        <button class="action-button add-cart" @click="addToCart">加入购物车</button>
        <button class="action-button buy-now" @click="buyNow">立即购买</button>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.detail-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  background: $jfx-pageBackGroundColor;
}
.detail-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.page-content {
  padding: 20rpx 24rpx 32rpx;
}

.hero-card,
.summary-card,
.product-detail-card {
  background: #fff;
  border-radius: 18rpx;
}

.hero-card {
  display: flex;
  height: 365rpx;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.hero-image {
  width: 330rpx;
  height: 330rpx;
}
.summary-card {
  margin-top: 24rpx;
  padding: 26rpx 24rpx 24rpx;
}
.price-share-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.price-group {
  display: flex;
  align-items: center;
}
.price-symbol,
.price-number {
  color: $jfx-brandColor;
  font-weight: 400;
}
.price-symbol {
  margin-right: 2rpx;
  font-size: 28rpx;
}
.price-number {
  font-size: 36rpx;
  line-height: 46rpx;
}
.install-tag {
  margin-left: 18rpx;
  padding: 8rpx 16rpx;
  color: $jfx-brandColor;
  font-size: 23rpx;
  background: #fff0ef;
  border-radius: 20rpx;
}
.share-button {
  display: flex;
  margin-top: -4rpx;
  align-items: center;
  flex-direction: column;
  color: $jfx-font-title;
  font-size: 22rpx;
  line-height: 30rpx;
}
.share-icon {
  font-size: 34rpx;
  line-height: 40rpx;
}
.product-name {
  margin-top: 20rpx;
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 40rpx;
}
.product-description {
  margin-top: 10rpx;
  color: $jfx-font-dec;
  font-size: 24rpx;
  line-height: 34rpx;
}
.divider {
  height: 2rpx;
  margin: 18rpx 0;
  background: $jfx-border;
}
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}
.section-note {
  color: $jfx-font-dec;
  font-size: 22rpx;
}
.guarantee-list {
  display: flex;
  margin-top: 16rpx;
  gap: 10rpx;
}
.guarantee-item {
  display: flex;
  min-width: 0;
  padding: 13rpx 10rpx;
  flex: 1;
  align-items: center;
  gap: 9rpx;
  border-radius: 14rpx;
}
.guarantee-item.orange {
  background: #fff7f0;
}
.guarantee-item.pink {
  background: #fff4f3;
}
.guarantee-item.gold {
  background: #fff9ee;
}
.guarantee-title {
  color: $jfx-font-title;
  font-size: 21rpx;
  font-weight: 600;
  white-space: nowrap;
}
.guarantee-desc {
  margin-top: 3rpx;
  color: $jfx-font-dec;
  font-size: 18rpx;
  white-space: nowrap;
}
.specification-divider {
  margin-top: 30rpx;
}
.selected-label {
  color: $jfx-brandColor;
  font-size: 22rpx;
}
.specification-row {
  display: flex;
  margin-top: 18rpx;
  align-items: center;
}
.specification-label {
  width: 76rpx;
  flex-shrink: 0;
  color: $jfx-font-title;
  font-size: 27rpx;
  font-weight: 600;
}
.specification-options {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 12rpx;
}
.specification-button {
  height: 48rpx;
  margin: 0;
  padding: 0 14rpx;
  color: $jfx-font-dec;
  font-size: 22rpx;
  line-height: 44rpx;
  background: #fff;
  border: 2rpx solid $jfx-border2;
  border-radius: 18rpx;
}
.specification-button.active {
  color: $jfx-brandColor;
  background: #fff6f5;
  border-color: $jfx-brandColor;
}

.product-detail-card {
  margin-top: 24rpx;
  padding: 26rpx 24rpx 0;
  overflow: hidden;
}
.detail-heading,
.image-heading {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}
.parameter-card {
  margin-top: 16rpx;
  padding: 22rpx 24rpx;
  background: #faf9f7;
  border-radius: 8rpx;
}
.parameter-title {
  margin-bottom: 12rpx;
  color: $jfx-font-title;
  font-size: 24rpx;
  font-weight: 600;
}
.parameter-row {
  display: flex;
  margin-top: 8rpx;
  justify-content: space-between;
  color: $jfx-font-dec;
  font-size: 23rpx;
  line-height: 32rpx;
}
.parameter-row text:last-child {
  max-width: 76%;
  color: $jfx-font-title;
  text-align: right;
}
.image-heading {
  margin-top: 24rpx;
}
.detail-image {
  display: block;
  width: 100%;
  margin-top: 14rpx;
}

.bottom-bar {
  display: flex;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  align-items: center;
  background: #fff;
  border-top: 2rpx solid $jfx-border2;
}
.cart-entry {
  display: flex;
  width: 86rpx;
  flex-shrink: 0;
  align-items: center;
  flex-direction: column;
  color: $jfx-font-title;
  font-size: 20rpx;
  line-height: 28rpx;
}
.cart-icon {
  width: 40rpx;
  height: 40rpx;
}
.bottom-price {
  width: 170rpx;
  padding-left: 16rpx;
  flex-shrink: 0;
}
.bottom-price .price-number {
  font-size: 30rpx;
}
.bottom-price .price-symbol {
  font-size: 24rpx;
}
.bottom-install {
  color: $jfx-font-dec;
  font-size: 21rpx;
  line-height: 30rpx;
  white-space: nowrap;
}
.bottom-actions {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 12rpx;
}
.action-button {
  height: 62rpx;
  margin: 0;
  padding: 0;
  flex: 1;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 62rpx;
  border-radius: 10rpx;
}
.add-cart {
  color: $jfx-brandColor;
  background: #fff0ef;
}
.buy-now {
  color: #fff;
  background: $jfx-brandColor;
}
button::after {
  border: 0;
}
</style>

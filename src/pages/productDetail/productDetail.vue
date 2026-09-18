<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { getProductDetail } from '@/api/product'
import type { ProductDetail } from '@/types/product'
import { useCartStore, type CartProduct } from '@/stores/modules/cart'
import { requireCartLogin } from '@/utils/cart-access'
const cartStore = useCartStore()

// 规格列表
const specifications = computed(() => product.value?.specifications ?? [])
// 已选
const selectedSpec = ref('')

// 商品
const product = ref<ProductDetail | null>(null)
const productId = ref<number | null>(null)
const loading = ref(false)
const errorMessage = ref('')
let disposed = false
const detailImages = computed(() => {
  const item = product.value
  return item?.detailImages?.length ? item.detailImages : item?.mainImage ? [item.mainImage] : []
})

const loadProduct = async () => {
  if (!productId.value || loading.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await getProductDetail(productId.value)
    if (disposed) return
    if (result.code !== 200) throw new Error(result.message || '商品加载失败')
    product.value = result.data
    selectedSpec.value = result.data?.specifications?.[0] ?? ''
  } catch (error) {
    if (disposed) return
    errorMessage.value = '商品加载失败，请重试'
    console.error('商品详情加载失败：', error)
  } finally {
    if (!disposed) loading.value = false
  }
}

onLoad((query) => {
  const id = Number(query?.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    errorMessage.value = '商品链接无效'
    return
  }
  productId.value = id
  void loadProduct()
})
onUnload(() => {
  disposed = true
})

// 已选标签
const selectedLabel = computed(() => `已选: ${selectedSpec.value}`)

// 显示页面提示消息
const showMessage = (title: string) => uni.showToast({ title, icon: 'none' })
const currentCartProduct = (): CartProduct | null => {
  const item = product.value
  if (!item) return null
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? '',
    price: Number(item.price),
    image: item.mainImage,
    specification: selectedSpec.value,
    installationIncluded: item.installationIncluded,
  }
}
const checkLogin = () =>
  requireCartLogin('/pages/productDetail/productDetail?id=' + productId.value)
const addToCart = () => {
  if (!checkLogin()) return
  const item = currentCartProduct()
  if (item && cartStore.addItem(item)) uni.showToast({ title: '已加入购物车', icon: 'success' })
}
const buyNow = () => {
  if (!checkLogin()) return
  const item = currentCartProduct()
  if (item && cartStore.prepareCheckout(item))
    uni.navigateTo({ url: '/pages/confirmOrder/confirmOrder' })
}
const openCart = () => {
  if (checkLogin()) uni.switchTab({ url: '/pages/cart/cart' })
}
// 分享当前商品
const shareProduct = () => showMessage('分享功能已准备')
</script>

<template>
  <view class="detail-page">
    <view v-if="loading" class="status-message">商品加载中...</view>
    <view v-else-if="errorMessage" class="status-message">
      <view>{{ errorMessage }}</view>
      <button v-if="productId" @click="loadProduct">重新加载</button>
    </view>
    <view v-else-if="!product" class="status-message">商品不存在</view>
    <scroll-view v-else class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="hero-card">
          <image class="hero-image" :src="product.mainImage" mode="aspectFit" />
        </view>

        <view class="summary-card">
          <view class="price-share-row">
            <view class="price-group">
              <text class="price-symbol">¥</text
              ><text class="price-number">{{ product.price }}</text>
              <text v-if="product.installationIncluded" class="install-tag">已含基础安装</text>
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
            <text v-if="product.installationIncluded" class="section-note"
              >商品价格包含基础安装服务</text
            >
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

          <view v-if="specifications.length" class="divider specification-divider" />
          <view v-if="specifications.length" class="section-title-row">
            <text class="section-title">规格选择</text>
            <text class="selected-label">{{ selectedLabel }}</text>
          </view>
          <view v-if="specifications.length" class="specification-row">
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
            <view class="parameter-row"
              ><text>品牌</text><text>{{ product.brand || '暂无' }}</text></view
            >
            <view class="parameter-row"
              ><text>型号</text><text>{{ product.model || '暂无' }}</text></view
            >
            <view class="parameter-row"
              ><text>规格</text><text>{{ specifications.join('/') || '暂无' }}</text></view
            >
          </view>
          <view v-if="detailImages.length" class="image-heading">商品图片</view>
          <image
            v-for="(src, index) in detailImages"
            :key="index"
            class="detail-image"
            :src="src"
            mode="widthFix"
          />
        </view>
      </view>
    </scroll-view>

    <view v-if="product && !loading && !errorMessage" class="bottom-bar">
      <view class="cart-entry" @click="openCart">
        <wd-badge :value="cartStore.totalCount" :max="99" :show-zero="false">
          <image
            class="cart-icon"
            src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/cart.png"
            mode="aspectFit"
          />
        </wd-badge>
        <text>购物车</text>
      </view>
      <view class="bottom-price">
        <view
          ><text class="price-symbol">¥</text
          ><text class="price-number">{{ product.price }}</text></view
        >
        <text v-if="product.installationIncluded" class="bottom-install">已含基础安装</text>
      </view>
      <view class="bottom-actions">
        <button class="action-button add-cart" @click="addToCart">加入购物车</button>
        <button class="action-button buy-now" @click="buyNow">立即购买</button>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.status-message {
  padding: 80rpx 24rpx;
  text-align: center;
  color: $jfx-font-dec;
}
.status-message button {
  margin-top: 24rpx;
}
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
  flex-wrap: wrap;
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

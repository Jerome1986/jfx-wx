<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { QuoteProductItem as ProductItem, QuoteProductPage } from '@/types/quote-product-list'

// 商品列表
const products: ProductItem[] = [
  {
    id: 1,
    name: '九牧单把单孔高管面盆龙头-X32025-548/1B-Z',
    description: '高管龙头、新水校起泡器、冷热双控',
    price: 623,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
  },
  {
    id: 2,
    name: '潜水艇L3092洗衣池不锈钢单冷龙头',
    description: '洗衣池不锈钢单冷龙头',
    price: 199,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-gooseneck-faucet.png',
  },
  {
    id: 3,
    name: '九牧抗菌枪灰多水花抽拉厨房龙头X33034-586/H',
    description: '四重水花 顺畅抽拉 节能防撞',
    price: 588,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-gooseneck-faucet.png',
  },
  {
    id: 4,
    name: '九牧多水花抽拉厨房龙头X33034-586/1B-Z',
    description: '四重水花 顺畅抽拉 节能防撞',
    price: 490,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-gooseneck-faucet.png',
  },
  {
    id: 5,
    name: '九牧单把单孔高管面盆龙头-X32025-548/1B-Z',
    description: '冷热双控/防溅出水',
    price: 623,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
  },
  {
    id: 6,
    name: '九牧精铜冷热厨房水龙头',
    description: '精铜主体 旋转出水 耐腐蚀阀芯',
    price: 459,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-gooseneck-faucet.png',
  },
]

// 搜索关键词
const keyword = ref('')
// 已提交搜索关键词
const submittedKeyword = ref('')
// 页面间事件通道
let eventChannel: UniApp.EventChannel | undefined

onLoad(() => {
  // 当前页面栈
  const pages = getCurrentPages()
  // 当前页面实例
  const currentPage = pages[pages.length - 1] as unknown as QuoteProductPage
  eventChannel = currentPage?.getOpenerEventChannel?.()
})

// 筛选后商品列表
const filteredProducts = computed(() => {
  // 当前处理值
  const value = submittedKeyword.value.trim().toLowerCase()
  if (!value) return products
  return products.filter((item) => `${item.name}${item.description}`.toLowerCase().includes(value))
})

// 执行关键词搜索
const search = () => {
  submittedKeyword.value = keyword.value
}
// 选择商品
const selectProduct = (item: ProductItem) => {
  eventChannel?.emit('selectProduct', {
    title: item.name,
    description: item.description,
    price: item.price,
    image: item.image,
  })
  uni.showToast({ title: '替换成功', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 350)
}
</script>

<template>
  <view class="product-page">
    <view class="search-row">
      <view class="search-box">
        <wd-icon name="search" size="22px" color="#1D1D1F" />
        <input
          v-model="keyword"
          class="search-input"
          confirm-type="search"
          placeholder="搜索水龙头、水槽、卫浴商品"
          placeholder-class="search-placeholder"
          @confirm="search"
        />
      </view>
      <text class="search-action" @click="search">搜索</text>
    </view>

    <view class="section-heading">
      <text class="section-title">可替换商品</text>
      <text class="section-recommend">请选择同类商品</text>
    </view>
    <view class="section-tip">选择后将替换报价明细中的当前单项</view>

    <scroll-view class="product-list" scroll-y :show-scrollbar="false">
      <view v-if="filteredProducts.length" class="product-list-content">
        <view
          v-for="item in filteredProducts"
          :key="item.id"
          class="product-card"
          @click="selectProduct(item)"
        >
          <view class="image-frame">
            <image class="product-image" :src="item.image" mode="aspectFit" />
          </view>
          <view class="product-info">
            <view class="product-name">{{ item.name }}</view>
            <view class="product-description">{{ item.description }}</view>
            <view class="product-price"><text class="price-symbol">¥</text>{{ item.price }}</view>
          </view>
          <view class="select-button" @click.stop="selectProduct(item)">选择</view>
        </view>
      </view>
      <view v-else class="empty-result">没有找到相关商品</view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.product-page {
  display: flex;
  box-sizing: border-box;
  height: 100vh;
  padding: 24rpx 24rpx 0;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}
.search-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
}
.search-box {
  display: flex;
  height: 64rpx;
  padding: 0 24rpx;
  flex: 1;
  align-items: center;
  gap: 18rpx;
  background: #fff;
  border: 1rpx solid $jfx-border2;
  border-radius: 999rpx;
}
.search-input {
  height: 64rpx;
  min-width: 0;
  flex: 1;
  color: $jfx-font-dec;
  font-size: 26rpx;
  font-weight: 400;
  line-height: 64rpx;
}
.search-placeholder {
  color: $jfx-font-dec2;
}
.search-action {
  flex-shrink: 0;
  color: $jfx-brandColor;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}
.section-heading {
  display: flex;
  margin-top: 30rpx;
  align-items: center;
  justify-content: space-between;
}
.section-title {
  color: $jfx-font-title;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 38rpx;
}
.section-recommend,
.section-tip {
  color: $jfx-font-dec;
  font-size: 25rpx;
  font-weight: 400;
  line-height: 36rpx;
}
.section-tip {
  margin-top: 8rpx;
}
.product-list {
  height: 0;
  min-height: 0;
  margin-top: 18rpx;
  flex: 1;
}
.product-list-content {
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}
.product-card {
  position: relative;
  display: flex;
  box-sizing: border-box;
  min-height: 212rpx;
  margin-bottom: 16rpx;
  padding: 24rpx;
  align-items: stretch;
  background: #fff;
  border-radius: 16rpx;
}
.image-frame {
  display: flex;
  width: 164rpx;
  height: 164rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff;
  border: 2rpx solid $jfx-border2;
  border-radius: 16rpx;
}
.product-image {
  width: 150rpx;
  height: 150rpx;
}
.product-info {
  min-width: 0;
  padding: 2rpx 92rpx 0 18rpx;
  flex: 1;
}
.product-name {
  overflow: hidden;
  color: $jfx-font-dec;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 40rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.product-description {
  overflow: hidden;
  margin-top: 7rpx;
  color: $jfx-font-dec2;
  font-size: 24rpx;
  font-weight: 400;
  line-height: 34rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.product-price {
  margin-top: 5rpx;
  color: $jfx-brandColor;
  font-size: 30rpx;
  font-weight: 400;
  line-height: 42rpx;
}
.price-symbol {
  margin-right: 6rpx;
  font-size: 24rpx;
}
.select-button {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
  padding: 8rpx 18rpx;
  color: #fff;
  font-size: 22rpx;
  line-height: 30rpx;
  background: $jfx-brandColor;
  border-radius: 22rpx;
}
.empty-result {
  padding-top: 180rpx;
  color: $jfx-font-dec2;
  font-size: 26rpx;
  text-align: center;
}
</style>

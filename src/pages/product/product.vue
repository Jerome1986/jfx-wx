<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { ProductItem } from '@/types/product'

const categoryGroups = [
  {
    title: '卫浴洁具',
    children: [
      '水龙头',
      '花洒/喷枪',
      '蹲便水箱',
      '马桶',
      '浴室柜',
      '挂件/毛巾架',
      '水槽',
      '吊顶浴霸',
    ],
  },
  { title: '灯具', children: ['吸顶灯', '吊灯', '筒灯/射灯', '灯带'] },
  { title: '家用电器', children: ['厨房电器', '生活电器', '清洁电器'] },
  { title: '全屋定制', children: ['橱柜', '衣柜', '玄关柜', '阳台柜'] },
  { title: '地板瓷砖', children: ['地板', '墙砖', '地砖', '岩板'] },
  { title: '花洒/喷枪', children: ['淋浴花洒', '恒温花洒', '喷枪', '花洒配件'] },
]

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
    name: '九牧单把单孔高管面盆龙头-X32025-548/1B-Z',
    description: '冷热双控/防溅出水',
    price: 623,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
  },
]

const activeGroup = ref('卫浴洁具')
const expandedGroup = ref<string | null>('卫浴洁具')
const activeCategory = ref('水龙头')
const keyword = ref('')
const contentScrollTop = ref(0)

const filteredProducts = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) return products
  return products.filter((item) => `${item.name}${item.description}`.toLowerCase().includes(value))
})

const selectGroup = (title: string) => {
  expandedGroup.value = expandedGroup.value === title ? null : title
  activeGroup.value = title
  const group = categoryGroups.find((item) => item.title === title)
  activeCategory.value = expandedGroup.value ? group?.children[0] || title : title
  contentScrollTop.value = 1
  nextTick(() => {
    contentScrollTop.value = 0
  })
}

const selectCategory = (title: string) => {
  activeCategory.value = title
  contentScrollTop.value = 1
  nextTick(() => {
    contentScrollTop.value = 0
  })
}

const addToCart = () => {
  uni.showToast({ title: '已加入购物车', icon: 'success' })
}

const openSearch = () => {
  uni.navigateTo({ url: '/pages/search/search' })
}

const openDetail = (item: ProductItem) => {
  uni.navigateTo({ url: `/pages/productDetail/productDetail?id=${item.id}` })
}
</script>

<template>
  <view class="product-page">
    <view class="search-wrap">
      <view class="search-box" @click="openSearch">
        <wd-icon name="search" size="22px" color="#1d1d1f" />
        <input
          v-model="keyword"
          class="search-input"
          disabled
          placeholder="搜索水龙头、花洒、浴室柜"
          placeholder-class="search-placeholder"
        />
      </view>
    </view>

    <view class="catalog-body">
      <scroll-view class="category-panel" scroll-y :show-scrollbar="false">
        <view v-for="group in categoryGroups" :key="group.title" class="category-group">
          <view
            :class="['group-title', { active: activeCategory === group.title }]"
            @click="selectGroup(group.title)"
          >
            <view v-if="activeCategory === group.title" class="active-bar" />
            <text>{{ group.title }}</text>
            <text
              v-if="group.children.length"
              :class="[
                'iconfont',
                'icon-youjiantou',
                'group-arrow',
                { expanded: expandedGroup === group.title },
              ]"
            />
          </view>
          <view
            v-if="group.children.length && expandedGroup === group.title"
            class="sub-category-list"
          >
            <view
              v-for="child in group.children"
              :key="child"
              :class="['sub-category', { active: activeCategory === child }]"
              @click="selectCategory(child)"
            >
              <view v-if="activeCategory === child" class="active-bar" />
              <text>{{ child }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <scroll-view
        class="product-list"
        scroll-y
        :scroll-top="contentScrollTop"
        :show-scrollbar="false"
      >
        <view v-if="filteredProducts.length">
          <view
            v-for="item in filteredProducts"
            :key="item.id"
            class="product-item"
            @click="openDetail(item)"
          >
            <image class="product-image" :src="item.image" mode="aspectFit" />
            <view class="product-info">
              <view class="product-name">{{ item.name }}</view>
              <view class="product-description">{{ item.description }}</view>
              <view class="product-footer">
                <view class="product-price"
                  ><text class="price-symbol">¥</text>{{ item.price }}</view
                >
                <view class="add-button" @click.stop="addToCart">
                  <image
                    class="add-icon"
                    src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/jiahao.png"
                    mode="aspectFit"
                  />
                </view>
              </view>
            </view>
          </view>
        </view>
        <view v-else class="empty-result">没有找到相关商品</view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss">
.product-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: #1d1d1f;
  background: #fff;
}
.search-wrap {
  padding: 24rpx;
  flex-shrink: 0;
  background: #fff;
}
.search-box {
  display: flex;
  height: 64rpx;
  padding: 0 24rpx;
  align-items: center;
  gap: 18rpx;
  background: #f7f7f7;
  border-radius: 999rpx;
}
.search-input {
  height: 64rpx;
  min-width: 0;
  flex: 1;
  color: #444;
  font-size: 26rpx;
  font-weight: 400;
  line-height: 64rpx;
}
.search-placeholder {
  color: #a8a8a8;
  font-weight: 400;
}
.catalog-body {
  display: flex;
  height: 0;
  min-height: 0;
  flex: 1;
  border-top: 1rpx solid #f4f4f4;
}
.category-panel {
  width: 200rpx;
  flex: 0 0 200rpx;
  background: #f8f7f5;
}
.category-group {
  width: 100%;
}
.group-title {
  position: relative;
  display: flex;
  min-height: 92rpx;
  padding: 0 24rpx;
  align-items: center;
  justify-content: space-between;
  color: #666;
  font-size: 27rpx;
  line-height: 38rpx;
}
.group-title.active {
  color: #666;
  background: #fff;
}
.active-bar {
  position: absolute;
  top: 50%;
  left: 24rpx;
  width: 5rpx;
  height: 28rpx;
  background: #e52d24;
  border-radius: 4rpx;
  transform: translateY(-50%);
}
.group-title.active text {
  padding-left: 22rpx;
}
.group-title.active .group-arrow {
  padding-left: 0;
}
.group-arrow {
  color: #666;
  font-size: 24rpx;
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}
.group-title.active .group-arrow {
  color: #666;
}
.group-arrow.expanded {
  transform: rotate(-90deg);
}
.sub-category-list {
  background: #f8f7f5;
}
.sub-category {
  position: relative;
  display: flex;
  min-height: 92rpx;
  padding: 0 18rpx;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 25rpx;
  line-height: 36rpx;
  text-align: center;
}
.sub-category.active {
  color: #666;
  background: #fff;
}
.product-list {
  width: 0;
  flex: 1;
  background: #fff;
}
.product-item {
  display: flex;
  min-height: 190rpx;
  padding: 20rpx 18rpx 18rpx 14rpx;
}
.product-image {
  width: 150rpx;
  height: 170rpx;
  flex-shrink: 0;
}
.product-info {
  display: flex;
  min-width: 0;
  padding-left: 12rpx;
  flex: 1;
  flex-direction: column;
}
.product-name {
  overflow: hidden;
  color: #686868;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.product-description {
  overflow: hidden;
  margin-top: 4rpx;
  color: #999;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 34rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.product-footer {
  display: flex;
  margin-top: auto;
  align-items: center;
  justify-content: space-between;
}
.product-price {
  color: #e52d24;
  font-size: 30rpx;
  font-weight: 400;
  line-height: 42rpx;
}
.price-symbol {
  margin-right: 6rpx;
  font-size: 23rpx;
}
.add-button {
  display: flex;
  width: 44rpx;
  height: 44rpx;
  align-items: center;
  justify-content: center;
  background: #e52d24;
  border-radius: 50%;
}
.add-icon {
  width: 44rpx;
  height: 44rpx;
}
.empty-result {
  padding-top: 180rpx;
  color: #999;
  font-size: 26rpx;
  font-weight: 400;
  text-align: center;
}
</style>

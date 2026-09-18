<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { onLoad, onUnload, onShow } from '@dcloudio/uni-app'
import type { ProductCategoryNode, ProductItem } from '@/types/product'
import { getCategoryProducts, productCategory } from '@/api/product'
import { syncCartBadge } from '@/utils/cart-access'
import { useCartStore } from '@/stores/modules/cart'

type CategoryGroup = ProductCategoryNode & { children: ProductCategoryNode[] }
const categoryGroups = ref<CategoryGroup[]>([])
const categoryLoading = ref(false)
const categoryFailed = ref(false)
const products = ref<ProductItem[]>([])
const activeGroup = ref<number | null>(null)
const expandedGroup = ref<number | null>(null)
const activeCategory = ref<number | null>(null)
const contentScrollTop = ref(0)
const productLoading = ref(false)
const productFailed = ref(false)
const pageNum = ref(0)
const totalPage = ref(0)
const hasMore = computed(() => pageNum.value < totalPage.value)
let requestVersion = 0
let disposed = false

// 只允许当前分类的最新请求更新列表、分页及加载状态。
const loadProducts = async () => {
  const categoryId = activeCategory.value
  if (!categoryId || productLoading.value || (pageNum.value > 0 && !hasMore.value)) return
  const version = ++requestVersion
  const nextPage = pageNum.value + 1
  productLoading.value = true
  productFailed.value = false
  try {
    const result = await getCategoryProducts(categoryId, { pageNum: nextPage, pageSize: 20 })
    if (version !== requestVersion || disposed) return
    if (result.code !== 200) throw new Error(result.message || '商品加载失败')
    const items = result.data.list.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      price: Number(item.price),
      image: item.mainImage,
    }))
    products.value = [
      ...new Map([...products.value, ...items].map((item) => [item.id, item])).values(),
    ]
    pageNum.value = nextPage
    totalPage.value = result.data.totalPage
  } catch (error) {
    if (version !== requestVersion || disposed) return
    productFailed.value = true
    console.error('分类商品加载失败：', error)
  } finally {
    if (version === requestVersion && !disposed) productLoading.value = false
  }
}

const selectCategory = (id: number) => {
  if (activeCategory.value === id) return
  ++requestVersion
  activeCategory.value = id
  products.value = []
  pageNum.value = 0
  totalPage.value = 0
  productLoading.value = false
  productFailed.value = false
  contentScrollTop.value = 1
  nextTick(() => {
    contentScrollTop.value = 0
  })
  return loadProducts()
}

const selectGroup = (group: CategoryGroup) => {
  console.log('cate', 111)

  if (activeGroup.value === group.id) {
    expandedGroup.value = expandedGroup.value === group.id ? null : group.id
    return
  }
  activeGroup.value = group.id
  expandedGroup.value = group.id
  return selectCategory(group.children[0]?.id ?? group.id)
}

const loadCategories = async () => {
  if (categoryLoading.value) return
  categoryLoading.value = true
  categoryFailed.value = false
  try {
    const result = await productCategory()
    if (disposed) return
    if (result.code !== 200) throw new Error(result.message || '分类加载失败')
    categoryGroups.value = result.data
      .filter((group) => group.isEnabled)
      .map((group) => ({
        ...group,
        children: (group.children ?? []).filter((child) => child.isEnabled),
      }))
    if (categoryGroups.value.length) void selectGroup(categoryGroups.value[0])
  } catch (error) {
    if (disposed) return
    categoryFailed.value = true
    console.error('商品分类加载失败：', error)
  } finally {
    if (!disposed) categoryLoading.value = false
  }
}

// 自动触底不反复重试失败请求，由用户点击重试。
const loadMore = () => {
  if (!productFailed.value) return loadProducts()
}

onShow(() => syncCartBadge(useCartStore().totalCount))
const openSearch = () => uni.navigateTo({ url: '/pages/search/search' })
const openDetail = (item: ProductItem) =>
  uni.navigateTo({ url: `/pages/productDetail/productDetail?id=${item.id}` })

onLoad(() => {
  void loadCategories()
})
onUnload(() => {
  disposed = true
  ++requestVersion
})
</script>

<template>
  <view class="product-page">
    <view class="search-wrap">
      <view class="search-box" @click="openSearch">
        <wd-icon name="search" size="22px" color="#1d1d1f" />
        <input
          class="search-input"
          disabled
          placeholder="搜索水龙头、花洒、浴室柜"
          placeholder-class="search-placeholder"
        />
      </view>
    </view>

    <view v-if="categoryLoading" class="empty-result">正在加载分类...</view>
    <view v-else-if="categoryFailed" class="empty-result">
      <view>分类加载失败</view>
      <button class="retry-button" @click="loadCategories">重新加载</button>
    </view>
    <view v-else-if="!categoryGroups.length" class="empty-result">暂无商品分类</view>
    <view v-else class="catalog-body">
      <scroll-view class="category-panel" scroll-y :show-scrollbar="false">
        <view v-for="group in categoryGroups" :key="group.id" class="category-group">
          <view
            :class="['group-title', { active: activeCategory === group.id }]"
            @click="selectGroup(group)"
          >
            <view v-if="activeCategory === group.id" class="active-bar" />
            <text>{{ group.name }}</text>
            <text
              v-if="group.children.length"
              :class="[
                'iconfont',
                'icon-youjiantou',
                'group-arrow',
                { expanded: expandedGroup === group.id },
              ]"
            />
          </view>
          <view
            v-if="group.children.length && expandedGroup === group.id"
            class="sub-category-list"
          >
            <view
              v-for="child in group.children"
              :key="child.id"
              :class="['sub-category', { active: activeCategory === child.id }]"
              @click="selectCategory(child.id)"
            >
              <view v-if="activeCategory === child.id" class="active-bar" />
              <text>{{ child.name }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <scroll-view
        class="product-list"
        scroll-y
        :scroll-top="contentScrollTop"
        :show-scrollbar="false"
        @scrolltolower="loadMore"
      >
        <view v-if="products.length">
          <view
            v-for="item in products"
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
                <view class="add-button" @click.stop="openDetail(item)">
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
        <view v-if="productLoading" class="list-state">正在加载商品...</view>
        <view v-else-if="productFailed" class="list-state">
          <view>{{ products.length ? '加载更多失败' : '商品加载失败' }}</view>
          <button class="retry-button" @click="loadProducts">重新加载</button>
        </view>
        <view v-else-if="!products.length" class="empty-result">该分类暂无商品</view>
        <view v-else-if="!hasMore" class="list-state">没有更多商品了</view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss">
.list-state {
  padding: 32rpx 20rpx;
  color: #999;
  font-size: 26rpx;
  text-align: center;
}

.retry-button {
  width: 200rpx;
  margin: 20rpx auto;
  font-size: 26rpx;
}

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
  @include ellipsis(2);
  color: #686868;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
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

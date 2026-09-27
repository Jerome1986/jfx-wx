<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onReachBottom, onUnload } from '@dcloudio/uni-app'
import { searchProducts } from '@/api/product'
import type { ProductResponseItem } from '@/types/product'

// 搜索历史的本地存储键名
const historyKey = 'jfx-search-history'
// 搜索框当前输入的关键词
const keyword = ref('')
// 已提交搜索的关键词
const submittedKeyword = ref('')
// 最近使用的搜索关键词
const history = ref<string[]>([])
// 推荐搜索的关键词
const suggestions = ['水龙头', '花洒', '浴室柜', '智能马桶', '厨房水槽', '地漏']

// 页面加载时读取搜索历史，去重后保留最近十条
onLoad(() => {
  try {
    // 本地缓存的搜索历史数据
    const stored: unknown = uni.getStorageSync(historyKey)
    if (Array.isArray(stored)) {
      history.value = [
        ...new Set(
          stored.filter((item): item is string => typeof item === 'string' && !!item.trim()),
        ),
      ].slice(0, 10)
    }
  } catch {
    history.value = []
  }
})

// 将搜索历史保存到本地缓存
const saveHistory = () => {
  try {
    uni.setStorageSync(historyKey, history.value)
  } catch {
    // 存储不可用时仍保留本次页面访问的搜索记录。
  }
}

// 已加载的搜索结果商品
const products = ref<ProductResponseItem[]>([])
// 是否正在加载商品
const loading = ref(false)
// 最近一次商品请求是否失败
const failed = ref(false)
// 当前已加载的页码
const pageNum = ref(0)
// 搜索结果的商品总数
const total = ref(0)
// 搜索结果的总页数
const totalPage = ref(0)
// 是否还有下一页商品
const hasMore = computed(() => pageNum.value < totalPage.value)
// 请求版本号，用于忽略过期请求的结果
let requestVersion = 0

// 清空搜索结果和分页状态，并使旧请求失效
const resetResults = () => {
  ++requestVersion
  submittedKeyword.value = ''
  products.value = []
  pageNum.value = 0
  total.value = 0
  totalPage.value = 0
  loading.value = false
  failed.value = false
}

// 加载下一页搜索结果，并按商品 ID 去重合并
const loadProducts = async () => {
  if (!submittedKeyword.value || loading.value || (pageNum.value > 0 && !hasMore.value)) return
  // 本次请求的版本号
  const version = ++requestVersion
  // 本次请求的目标页码
  const nextPage = pageNum.value + 1
  loading.value = true
  failed.value = false
  try {
    // 商品搜索接口的响应数据
    const result = await searchProducts({
      productName: submittedKeyword.value,
      pageNum: String(nextPage),
      pageSize: '20',
    })
    console.log(result)

    if (version !== requestVersion) return
    if (result.code !== 200) throw new Error(result.message || '搜索失败')
    products.value = [
      ...new Map([...products.value, ...result.data.list].map((item) => [item.id, item])).values(),
    ]
    pageNum.value = nextPage
    total.value = Number(result.data.total)
    totalPage.value = Number(result.data.totalPage)
  } catch {
    if (version === requestVersion) failed.value = true
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

// 非失败状态下加载更多商品
const loadMore = () => {
  if (!failed.value) void loadProducts()
}
// 页面触底时尝试加载下一页
onReachBottom(loadMore)
// 页面卸载时使未完成的请求失效
onUnload(() => {
  ++requestVersion
})

// 根据商品 ID 跳转到详情页
const openDetail = (id: number) =>
  uni.navigateTo({ url: `/pages/productDetail/productDetail?id=${id}` })
// 将价格格式化为两位小数，无效值显示占位符
const formatPrice = (price: string | number) => {
  // 转换为数值后的价格
  const value = Number(price)
  return Number.isFinite(value) ? value.toFixed(2) : '--'
}
// 校验关键词、更新搜索历史并发起搜索
const search = (value = keyword.value) => {
  // 去除首尾空白后的搜索关键词
  const text = value.trim()
  if (!text) {
    uni.showToast({ title: '请输入搜索关键词', icon: 'none' })
    return
  }
  resetResults()
  keyword.value = text
  submittedKeyword.value = text
  history.value = [text, ...history.value.filter((item) => item !== text)].slice(0, 10)
  saveHistory()
  uni.hideKeyboard()
  uni.pageScrollTo({ scrollTop: 0, duration: 0 })
  void loadProducts()
}

// 切换到商品分类页
const browseProducts = () => uni.switchTab({ url: '/pages/product/product' })

// 清空搜索框并重置搜索结果
const clearInput = () => {
  keyword.value = ''
  resetResults()
}

// 确认后清空搜索历史并同步本地缓存
const clearHistory = () => {
  uni.showModal({
    title: '清空搜索历史',
    content: '确定清空全部搜索记录吗？',
    confirmColor: '#D92D20',
    // 用户确认后执行清空操作
    success: ({ confirm }) => {
      if (!confirm) return
      history.value = []
      saveHistory()
    },
  })
}
</script>

<template>
  <view class="search-page">
    <view class="search-header">
      <view class="search-field">
        <wd-icon name="search" size="20px" color="#999999" />
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索水龙头、花洒、浴室柜"
          placeholder-class="search-placeholder"
          confirm-type="search"
          :maxlength="50"
          @input="resetResults"
          @confirm="search()"
        />
        <button v-if="keyword" class="clear-input" aria-label="清空关键词" @click="clearInput">
          <wd-icon name="close" size="14px" color="#999999" />
        </button>
      </view>
      <button class="search-button" @click="search()">搜索</button>
    </view>

    <view class="search-content">
      <view v-if="submittedKeyword" class="search-results">
        <view v-if="pageNum > 0" class="results-heading">
          <text class="results-keyword">“{{ submittedKeyword }}”的搜索结果</text>
          <text class="results-count">共 {{ total }} 件商品</text>
        </view>
        <view v-if="products.length" class="product-grid">
          <view
            v-for="item in products"
            :key="item.id"
            class="product-card"
            @click="openDetail(item.id)"
          >
            <image
              v-if="item.mainImage"
              class="product-image"
              :src="item.mainImage"
              mode="aspectFit"
            />
            <view v-else class="product-image image-placeholder">暂无图片</view>
            <view class="product-info">
              <view class="product-name">{{ item.name }}</view>
              <view class="product-description">{{
                item.description || '品质好物，安心焕新'
              }}</view>
              <view class="product-price"
                ><text class="price-symbol">¥</text>{{ formatPrice(item.price) }}</view
              >
            </view>
          </view>
        </view>
        <view v-if="loading" class="list-state">正在搜索商品…</view>
        <view v-else-if="failed" class="result-card">
          <view class="result-title">{{
            products.length ? '加载更多失败' : '搜索失败，请稍后重试'
          }}</view>
          <button class="browse-button" @click="loadProducts">重新加载</button>
        </view>
        <view v-else-if="!products.length" class="result-card">
          <view class="result-icon"><wd-icon name="search" size="36px" color="#D92D20" /></view>
          <view class="result-title">暂未找到相关商品</view>
          <view class="result-description">试试更简短的关键词，或去商品分类逛逛</view>
          <button class="browse-button" @click="browseProducts">浏览商品</button>
        </view>
        <button v-else-if="hasMore" class="load-more" @click="loadMore">加载更多</button>
        <view v-else class="list-state">没有更多商品了</view>
      </view>
      <view v-if="!submittedKeyword" class="search-section">
        <view class="section-heading">
          <text class="section-title">搜索历史</text>
          <button v-if="history.length" class="clear-history" @click="clearHistory">清空</button>
        </view>
        <view v-if="history.length" class="keyword-list">
          <button v-for="item in history" :key="item" class="keyword-tag" @click="search(item)">
            {{ item }}
          </button>
        </view>
        <view v-else class="history-empty">暂无搜索记录，试试搜索你需要的好物</view>
      </view>

      <view v-if="!submittedKeyword" class="search-section suggestion-section">
        <view class="section-heading">
          <view class="section-title">猜你想搜</view>
          <text class="section-note">焕新好物，从这里找</text>
        </view>
        <view class="keyword-list">
          <button
            v-for="(item, index) in suggestions"
            :key="item"
            class="keyword-tag"
            :class="{ recommended: index < 2 }"
            @click="search(item)"
          >
            {{ item }}
          </button>
        </view>
      </view>
      <view v-if="!submittedKeyword" class="search-footer">
        <view class="footer-line" />发现好物，让家更美好
        <view class="footer-line" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.search-page {
  min-height: 100vh;
  background: $jfx-pageBackGroundColor;
  color: $jfx-font-title;
}

button {
  margin: 0;
  padding: 0;
  border-radius: 0;
  background: transparent;
  font-weight: 400;

  &::after {
    border: none;
  }
}

.search-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 28rpx 28rpx;
}

.search-field {
  display: flex;
  flex: 1;
  min-width: 0;
  height: 80rpx;
  padding: 0 24rpx;
  gap: 14rpx;
  background: #ffffff;
  border: 2rpx solid #eeeae6;
  border-radius: 42rpx;
}

.search-field {
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 76rpx;
  font-size: 26rpx;
}

:deep(.search-placeholder) {
  color: #999999;
  font-size: 25rpx;
}

.clear-input {
  display: flex;
  width: 44rpx;
  height: 64rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}

.search-button {
  flex-shrink: 0;
  color: $jfx-brandColor;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 80rpx;
}

.search-content {
  padding: 4rpx 28rpx calc(40rpx + env(safe-area-inset-bottom));
}

.search-section {
  margin-bottom: 24rpx;
  padding: 28rpx;
  background: #ffffff;
  border-radius: 20rpx;
}

.section-heading {
  display: flex;
  min-height: 44rpx;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.section-title {
  flex-shrink: 0;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 44rpx;
}

.clear-history {
  padding: 0 4rpx 0 20rpx;
  color: #999999;
  font-size: 24rpx;
  line-height: 44rpx;
}

.keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx 16rpx;
}

.keyword-tag {
  max-width: 100%;
  padding: 14rpx 26rpx;
  overflow: hidden;
  color: #666666;
  background: #f8f7f5;
  border-radius: 32rpx;
  font-size: 25rpx;
  line-height: 34rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.keyword-tag.recommended {
  color: $jfx-brandColor;
  background: #fff1ed;
}

.history-empty {
  padding: 8rpx 0 16rpx;
  color: #999999;
  font-size: 25rpx;
  line-height: 38rpx;
}

.section-note {
  color: #999999;
  font-size: 22rpx;
  text-align: right;
}

.result-card {
  margin-bottom: 24rpx;
  padding: 48rpx 28rpx;
  background: #ffffff;
  border-radius: 20rpx;
  text-align: center;
}

.result-icon {
  display: flex;
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto 24rpx;
  align-items: center;
  justify-content: center;
  background: #fff1ed;
  border-radius: 50%;
}

.result-title {
  font-size: 30rpx;
  font-weight: 600;
}

.result-description {
  margin-top: 16rpx;
  color: #999999;
  font-size: 25rpx;
  line-height: 40rpx;
  overflow-wrap: anywhere;
}

.browse-button {
  display: inline-block;
  margin-top: 28rpx;
  padding: 0 40rpx;
  color: #ffffff;
  background: $jfx-brandColor;
  border-radius: 36rpx;
  font-size: 26rpx;
  line-height: 72rpx;
}

.search-footer {
  display: flex;
  margin-top: 52rpx;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  color: #b6b0aa;
  font-size: 22rpx;
}

.footer-line {
  width: 40rpx;
  height: 1rpx;
  background: #e3dfda;
}

.results-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20rpx;
  padding: 12rpx 0 28rpx;
  font-size: 25rpx;
}

.results-keyword {
  min-width: 0;
  overflow-wrap: anywhere;
}

.results-count {
  flex-shrink: 0;
  color: #999999;
  font-size: 23rpx;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.product-card {
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border-radius: 20rpx;
}

.product-image {
  display: block;
  width: 100%;
  height: 280rpx;
  background: #ffffff;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eeeeee;
  color: #999999;
  font-size: 24rpx;
}

.product-info {
  padding: 20rpx;
}

.product-name {
  @include ellipsis(2);
  height: 76rpx;
  font-size: 27rpx;
  font-weight: 500;
  line-height: 38rpx;
}

.product-description {
  margin-top: 12rpx;
  overflow: hidden;
  color: #999999;
  font-size: 23rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  margin-top: 20rpx;
  color: $jfx-brandColor;
  font-size: 34rpx;
  font-weight: 600;
}

.price-symbol {
  margin-right: 4rpx;
  font-size: 24rpx;
}

.list-state,
.load-more {
  padding: 36rpx 0;
  color: #999999;
  font-size: 25rpx;
  line-height: 40rpx;
  text-align: center;
}

.load-more {
  width: 100%;
  color: $jfx-brandColor;
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  getConstructionServiceListApi,
  getRenewalReplacementProductsApi,
} from '@/api/renewal-replacement'
import type {
  RenewalReplacementCandidate,
  RenewalReplacementType,
} from '@/types/renewal-replacement'

// 类型
const type = ref<RenewalReplacementType>('PRODUCT')
// 分类
const category = ref('')
// 当前单位
const currentUnit = ref('')
// 当前数量
const currentQuantity = ref('1')
// 搜索关键词
const keyword = ref('')
// 已成功加载的候选列表页码
const pageNum = ref(0)
// 候选列表分页大小
const pageSize = 10
// 候选项总数
const total = ref(0)
// 候选列表总页数
const totalPage = ref(0)
// 当前搜索实际使用的关键词
const appliedKeyword = ref('')
// 请求版本号，用于忽略过期搜索响应
let requestVersion = 0
// 可供替换的候选项列表
const candidates = ref<RenewalReplacementCandidate[]>([])
// 加载状态
const loading = ref(false)
// 失败状态
const loadFailed = ref(false)
// 候选项选择状态
const selecting = ref(false)
// 页面间事件通道
let eventChannel: UniApp.EventChannel | undefined

// 替换类型判断：路由 type=PRODUCT 为商品，type=SERVICE 为服务
const isProduct = computed(() => type.value === 'PRODUCT')
// 页面标题
const pageTitle = computed(() => (isProduct.value ? '选择替换商品' : '选择替换服务'))
// 标题
const sectionTitle = computed(() => (isProduct.value ? '可替换商品' : '可替换服务'))
// 占位提示
const placeholder = computed(() => (isProduct.value ? '搜索商品名称或描述' : '搜索服务名称或描述'))
// 候选列表是否还有下一页
const hasMore = computed(() => pageNum.value < totalPage.value)

// 加载可替换的候选项
const loadCandidates = async (append = false) => {
  if (append && (loading.value || !hasMore.value)) return
  if (!append) {
    requestVersion += 1
    appliedKeyword.value = keyword.value.trim()
    pageNum.value = 0
    total.value = 0
    totalPage.value = 0
    candidates.value = []
  }
  const version = requestVersion
  const nextPage = append ? pageNum.value + 1 : 1
  loading.value = true
  loadFailed.value = false
  try {
    if (isProduct.value) {
      const { data } = await getRenewalReplacementProductsApi({
        isPublished: true,
        inStock: true,
        pageNum: nextPage,
        pageSize,
        ...(appliedKeyword.value ? { keyword: appliedKeyword.value } : {}),
      })
      if (version !== requestVersion) return
      const items = data.list.map((product) => ({
        id: product.id,
        productId: product.id,
        category: category.value,
        name: product.name,
        description: product.description,
        unit: currentUnit.value,
        unitPrice: product.price,
        quantity: currentQuantity.value,
        image: product.mainImage,
      }))
      const existingIds = new Set(candidates.value.map((item) => item.id))
      candidates.value = append
        ? [...candidates.value, ...items.filter((item) => !existingIds.has(item.id))]
        : items
      pageNum.value = data.pageNum
      total.value = data.total
      totalPage.value = data.totalPage
    } else {
      const { data } = await getConstructionServiceListApi({
        isEnabled: true,
        pageNum: nextPage,
        pageSize,
        ...(appliedKeyword.value ? { keyword: appliedKeyword.value } : {}),
      })
      if (version !== requestVersion) return
      const items = data.list.map((service) => ({
        id: service.id,
        productId: null,
        category: category.value,
        name: service.name,
        description: service.description,
        unit: service.unit,
        unitPrice: service.unitPrice,
        quantity: currentQuantity.value,
        image: service.image,
      }))
      const existingIds = new Set(candidates.value.map((item) => item.id))
      candidates.value = append
        ? [...candidates.value, ...items.filter((item) => !existingIds.has(item.id))]
        : items
      pageNum.value = data.pageNum
      total.value = data.total
      totalPage.value = data.totalPage
    }
  } catch (error) {
    if (version !== requestVersion) return
    console.error('获取焕新替换候选失败：', error)
    loadFailed.value = true
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

onLoad((options) => {
  // 路由参数决定替换类型：只有明确传入 SERVICE 才进入服务分支，其余均按商品处理
  type.value = options?.type === 'SERVICE' ? 'SERVICE' : 'PRODUCT'
  category.value = options?.category ? decodeURIComponent(options.category) : ''
  currentUnit.value = options?.unit ? decodeURIComponent(options.unit) : ''
  currentQuantity.value = options?.quantity || '1'
  uni.setNavigationBarTitle({ title: pageTitle.value })

  // 当前页面栈
  const pages = getCurrentPages()
  // 当前页面实例
  const currentPage = pages[pages.length - 1] as unknown as {
    getOpenerEventChannel?: () => UniApp.EventChannel
  }
  eventChannel = currentPage?.getOpenerEventChannel?.()
  eventChannel?.on('replacementResult', (result: { accepted: boolean; message?: string }) => {
    selecting.value = false
    if (!result.accepted) {
      uni.showToast({ title: result.message || '该项目已在方案中', icon: 'none' })
      return
    }
    uni.showToast({ title: '替换成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 350)
  })
  loadCandidates()
})

// 选择候选项
const selectCandidate = (candidate: RenewalReplacementCandidate) => {
  if (selecting.value) return
  if (!eventChannel) {
    uni.showToast({ title: '页面状态已失效，请返回重试', icon: 'none' })
    return
  }
  selecting.value = true
  eventChannel.emit('selectReplacement', candidate)
}
</script>

<template>
  <view class="replacement-page">
    <view class="search-row">
      <view class="search-box">
        <wd-icon name="search" size="22px" color="#1D1D1F" />
        <input
          v-model="keyword"
          class="search-input"
          confirm-type="search"
          :placeholder="placeholder"
          placeholder-class="search-placeholder"
          @confirm="loadCandidates()"
        />
      </view>
      <text class="search-action" @click="loadCandidates()">搜索</text>
    </view>

    <view class="section-heading">
      <text class="section-title">{{ sectionTitle }}</text>
      <text class="section-category">{{ category || '全部分类' }}</text>
    </view>
    <view class="section-tip">选择后将替换当前方案明细，预约前不会保存</view>

    <scroll-view
      class="candidate-scroll"
      scroll-y
      :show-scrollbar="false"
      @scrolltolower="loadCandidates(true)"
    >
      <view v-if="loading && !candidates.length" class="page-state"
        >正在加载{{ isProduct ? '商品' : '服务' }}...</view
      >
      <view v-else-if="loadFailed && !candidates.length" class="page-state">
        <view>候选项加载失败</view>
        <button class="retry-button" @click="loadCandidates()">重新加载</button>
      </view>
      <view v-else-if="candidates.length" class="candidate-list">
        <view
          v-for="candidate in candidates"
          :key="candidate.id"
          class="candidate-card"
          @click="selectCandidate(candidate)"
        >
          <view class="image-frame">
            <image
              v-if="candidate.image"
              class="candidate-image"
              :src="candidate.image"
              :mode="isProduct ? 'aspectFit' : 'aspectFill'"
            />
            <view v-else class="candidate-image image-placeholder" />
          </view>
          <view class="candidate-info">
            <view class="candidate-name">{{ candidate.name }}</view>
            <view class="candidate-description">{{ candidate.description }}</view>
            <view class="candidate-meta">
              <text class="candidate-price">¥{{ candidate.unitPrice }}</text>
              <text>/{{ candidate.unit }} × {{ candidate.quantity }}</text>
            </view>
          </view>
          <button class="select-button" @click.stop="selectCandidate(candidate)">选择</button>
        </view>
      </view>
      <view v-else class="page-state">没有找到可替换的{{ isProduct ? '商品' : '服务' }}</view>
      <view v-if="candidates.length" class="pagination-state">
        <text v-if="loading">正在加载更多...</text>
        <button
          v-else-if="loadFailed"
          class="retry-button pagination-retry"
          @click="loadCandidates(true)"
        >
          加载失败，重试
        </button>
        <text v-else-if="!hasMore">没有更多{{ isProduct ? '商品' : '服务' }}了</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.replacement-page {
  display: flex;
  box-sizing: border-box;
  height: 100vh;
  padding: 24rpx 24rpx 0;
  flex-direction: column;
  overflow: hidden;
  background: $jfx-pageBackGroundColor;
}

.search-row,
.section-heading,
.candidate-card,
.candidate-meta {
  display: flex;
  align-items: center;
}

.search-row {
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
  border: 2rpx solid $jfx-border2;
  border-radius: 999rpx;
}

.search-input {
  height: 64rpx;
  min-width: 0;
  flex: 1;
  color: $jfx-font-title;
  font-size: 26rpx;
}

.search-placeholder,
.section-category,
.section-tip,
.candidate-description,
.candidate-meta,
.page-state {
  color: $jfx-font-dec2;
}

.search-action {
  color: $jfx-brandColor;
  font-size: 28rpx;
  font-weight: 600;
}

.section-heading {
  margin-top: 30rpx;
  justify-content: space-between;
}

.section-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 600;
}

.section-category,
.section-tip {
  font-size: 24rpx;
}

.section-tip {
  margin-top: 8rpx;
}

.candidate-scroll {
  height: 0;
  min-height: 0;
  margin-top: 18rpx;
  flex: 1;
}

.candidate-list {
  padding-bottom: 4rpx;
}

.candidate-card {
  position: relative;
  min-height: 180rpx;
  margin-bottom: 16rpx;
  padding: 20rpx;
  background: #fff;
  border-radius: 16rpx;
}

.image-frame {
  display: flex;
  width: 150rpx;
  height: 150rpx;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: #f7f7f7;
  border-radius: 12rpx;
}

.candidate-image {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  background: #f0efed;
}

.candidate-info {
  min-width: 0;
  padding: 0 96rpx 0 18rpx;
  flex: 1;
}

.candidate-name {
  @include ellipsis(2);
  color: $jfx-font-title;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 38rpx;
}

.candidate-description {
  overflow: hidden;
  margin-top: 6rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.candidate-meta {
  margin-top: 10rpx;
  font-size: 21rpx;
}

.candidate-price {
  margin-right: 8rpx;
  color: $jfx-brandColor;
  font-size: 28rpx;
}

.select-button {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  height: 48rpx;
  margin: 0;
  padding: 0 20rpx;
  color: #fff;
  font-size: 22rpx;
  line-height: 48rpx;
  background: $jfx-brandColor;
  border-radius: 24rpx;
}

.page-state {
  padding: 160rpx 0;
  font-size: 25rpx;
  text-align: center;
}

.pagination-state {
  padding: 12rpx 0 calc(28rpx + env(safe-area-inset-bottom));
  color: $jfx-font-dec2;
  font-size: 23rpx;
  line-height: 34rpx;
  text-align: center;
}

.retry-button {
  width: 180rpx;
  height: 56rpx;
  margin: 24rpx auto 0;
  color: #fff;
  font-size: 23rpx;
  line-height: 56rpx;
  background: $jfx-brandColor;
  border-radius: 28rpx;
}

.pagination-retry {
  margin-top: 0;
}

button::after {
  border: 0;
}
</style>

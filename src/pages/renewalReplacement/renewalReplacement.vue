<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getRenewalPlanListApi } from '@/api/renewal-plan'
import { getRenewalReplacementProductsApi } from '@/api/renewal-replacement'
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

// 当前内容是否为商品
const isProduct = computed(() => type.value === 'PRODUCT')
// 页面标题
const pageTitle = computed(() => (isProduct.value ? '选择替换商品' : '选择替换服务'))
// 标题
const sectionTitle = computed(() => (isProduct.value ? '可替换商品' : '可替换服务'))
// 占位提示
const placeholder = computed(() => (isProduct.value ? '搜索商品名称或描述' : '搜索服务名称或描述'))

// 加载可替换的候选项
const loadCandidates = async () => {
  loading.value = true
  loadFailed.value = false
  try {
    // 当前处理值
    const value = keyword.value.trim().toLowerCase()
    if (isProduct.value) {
      const { data } = await getRenewalReplacementProductsApi()
      candidates.value = data
        .filter((product) => product.isPublished && product.stock > 0)
        .filter((product) =>
          value
            ? `${product.name}${product.description}${product.brand}`.toLowerCase().includes(value)
            : true,
        )
        .map((product) => ({
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
    } else {
      const { data } = await getRenewalPlanListApi()
      candidates.value = data
        .filter((plan) => plan.status === 'PUBLISHED')
        .flatMap((plan) => plan.items)
        .filter((item) => item.productId === null)
        .filter((item) => {
          if (item.category === category.value) return true
          // 判断文本是否属于人工辅材
          const isLaborMaterial = (text: string) => text.includes('人工') || text.includes('辅材')
          return isLaborMaterial(category.value) && isLaborMaterial(item.category)
        })
        .filter((item) =>
          value ? `${item.name}${item.description}`.toLowerCase().includes(value) : true,
        )
        .map((item) => ({
          id: item.id,
          productId: null,
          category: item.category,
          name: item.name,
          description: item.description,
          unit: item.unit,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          image: item.image,
        }))
    }
  } catch (error) {
    console.error('获取焕新替换候选失败：', error)
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
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
          @confirm="loadCandidates"
        />
      </view>
      <text class="search-action" @click="loadCandidates">搜索</text>
    </view>

    <view class="section-heading">
      <text class="section-title">{{ sectionTitle }}</text>
      <text class="section-category">{{ category || '全部分类' }}</text>
    </view>
    <view class="section-tip">选择后将替换当前方案明细，预约前不会保存</view>

    <scroll-view class="candidate-scroll" scroll-y :show-scrollbar="false">
      <view v-if="loading" class="page-state">正在加载{{ isProduct ? '商品' : '服务' }}...</view>
      <view v-else-if="loadFailed" class="page-state">
        <view>候选项加载失败</view>
        <button class="retry-button" @click="loadCandidates">重新加载</button>
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
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
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

button::after {
  border: 0;
}
</style>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, nextTick, ref } from 'vue'
import { getRenewalPlanDetailApi } from '@/api/renewal-plan'
import { createPlanAppointmentApi } from '@/api/appointment'
import { useMemberStore } from '@/stores'
import type { FeeTab, ServiceItem } from '@/types/space-renewal-detail'
import type { RenewalPlan } from '@/types/space-renewal'
import type { RenewalReplacementCandidate } from '@/types/renewal-replacement'

// 当前标签页
const activeTab = ref<FeeTab>('全部')
// 费用标签页
const feeTabs: FeeTab[] = ['全部', '主材', '人工+辅材']
// 方案详情
const planDetail = ref<RenewalPlan | null>(null)
// 项目列表
const items = ref<ServiceItem[]>([])
// 加载状态
const loading = ref(true)
// 不可用状态
const unavailable = ref(false)
// 提交状态
const submitting = ref(false)
// 当前登录会员状态
const memberStore = useMemberStore()
// 服务列表最小高度
const serviceListMinHeight = ref(0)

// 获取服务列表高度
const captureServiceListHeight = async () => {
  await nextTick()
  uni
    .createSelectorQuery()
    .select('.service-list')
    .boundingClientRect((rect) => {
      if (rect && !Array.isArray(rect) && typeof rect.height === 'number') {
        serviceListMinHeight.value = rect.height
      }
    })
    .exec()
}

// 加载方案详情
const loadPlanDetail = async (id: number) => {
  loading.value = true
  unavailable.value = false
  try {
    const { data } = await getRenewalPlanDetailApi(id)
    console.log('焕新详情', data)
    if (!data || data.status !== 'PUBLISHED') {
      unavailable.value = true
      return
    }
    planDetail.value = data
    uni.setNavigationBarTitle({ title: data.name })
    items.value = data.items.map((item) => ({
      id: item.id,
      sourceItemId: item.id,
      candidateId: null,
      productId: item.productId,
      title: item.name,
      description: item.description,
      price: Number(item.unitPrice) || 0,
      quantity: Number(item.quantity) || 0,
      category: item.category,
      unit: item.unit,
      image: item.image || item.product?.mainImage || '',
      selected: true,
    }))
    captureServiceListHeight()
  } catch (error) {
    console.error('获取焕新方案详情失败：', error)
    unavailable.value = true
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  // 当前数据编号
  const id = Number(options?.id)
  if (!Number.isInteger(id) || id <= 0) {
    loading.value = false
    unavailable.value = true
    return
  }
  loadPlanDetail(id)
})

// 获取分类的排序权重
const categoryRank = (category: string) => {
  if (category.includes('主材')) return 0
  if (category.includes('人工') || category.includes('辅材')) return 1
  return 2
}

// 项目列表
const groupedItems = computed(() =>
  items.value
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) => categoryRank(a.item.category) - categoryRank(b.item.category) || a.index - b.index,
    )
    .map(({ item }) => item),
)

// 可见项目列表
const visibleItems = computed(() => {
  if (activeTab.value === '全部') return groupedItems.value
  if (activeTab.value === '主材') {
    return items.value.filter((item) => item.category.includes('主材'))
  }
  return items.value.filter(
    (item) => item.category.includes('人工') || item.category.includes('辅材'),
  )
})

// 已选金额
const selectedAmount = computed(() =>
  items.value
    .filter((item) => item.selected)
    .reduce((total, item) => total + item.price * item.quantity, 0),
)

// 可见金额
const visibleAmount = computed(() =>
  visibleItems.value
    .filter((item) => item.selected)
    .reduce((total, item) => total + item.price * item.quantity, 0),
)

// 当前标签页标题
const activeTabTitle = computed(() => (activeTab.value === '全部' ? '全部方案' : activeTab.value))

// 判断是否存在重复候选项
const hasDuplicateCandidate = (currentItem: ServiceItem, candidate: RenewalReplacementCandidate) =>
  items.value.some((item) => {
    if (item === currentItem) return false
    if (candidate.productId !== null) return item.productId === candidate.productId
    // 服务候选项编号
    const serviceCandidateId = item.candidateId ?? item.sourceItemId
    return item.productId === null && serviceCandidateId === candidate.id
  })

// 替换当前处理项
const replaceItem = (item: ServiceItem) => {
  // 类型
  const type = item.productId === null ? 'SERVICE' : 'PRODUCT'
  // 页面跳转查询参数
  const query = [
    `type=${type}`,
    `category=${encodeURIComponent(item.category)}`,
    `itemId=${item.sourceItemId}`,
    `unit=${encodeURIComponent(item.unit)}`,
    `quantity=${item.quantity}`,
  ].join('&')

  uni.navigateTo({
    url: `/pages/renewalReplacement/renewalReplacement?${query}`,
    success: (result) => {
      result.eventChannel.on('selectReplacement', (candidate: RenewalReplacementCandidate) => {
        if (hasDuplicateCandidate(item, candidate)) {
          result.eventChannel.emit('replacementResult', {
            accepted: false,
            message: '该项目已在方案中，请选择其他项目',
          })
          return
        }
        Object.assign(item, {
          candidateId: candidate.id,
          productId: candidate.productId,
          title: candidate.name,
          description: candidate.description,
          price: Number(candidate.unitPrice) || 0,
          quantity: Number(candidate.quantity) || 0,
          category: candidate.category,
          unit: candidate.unit,
          image: candidate.image,
          selected: true,
        })
        result.eventChannel.emit('replacementResult', { accepted: true })
      })
    },
  })
}

// 提交预约
const reserve = async () => {
  if (!planDetail.value || submitting.value) return
  // 当前登录用户 ID
  const userId = Number(memberStore.profile?.id)
  if (!Number.isInteger(userId) || userId <= 0) {
    uni.showToast({ title: '请先登录后再预约', icon: 'none' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/login/login' })
    }, 500)
    return
  }
  // 已选项目列表
  const selectedItems = items.value.filter((item) => item.selected)
  if (!selectedItems.length) {
    uni.showToast({ title: '请至少选择一项方案明细', icon: 'none' })
    return
  }

  // 提交用户当前选择的方案快照，供员工后续联系和复核
  const appointmentPayload = {
    userId,
    planId: planDetail.value.id,
    snapshot: {
      title: planDetail.value.name,
      cover: planDetail.value.cover,
      referencePrice: selectedItems
        .reduce((total, item) => total + item.price * item.quantity, 0)
        .toFixed(2),
      items: selectedItems.map((item) => ({
        sourceItemId: item.sourceItemId,
        candidateId: item.candidateId,
        productId: item.productId,
        category: item.category,
        name: item.title,
        description: item.description,
        unit: item.unit,
        unitPrice: item.price.toFixed(2),
        quantity: String(item.quantity),
        image: item.image,
      })),
    },
  }
  console.log('提交焕新预约数据：', appointmentPayload)

  submitting.value = true
  try {
    await createPlanAppointmentApi(appointmentPayload)
    uni.showToast({ title: '预约申请已提交', icon: 'success' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages-sub/my/decorationOrder/decorationOrder?group=plan' })
    }, 500)
  } catch (error) {
    console.error('提交焕新预约失败：', error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view v-if="loading" class="page-status">正在加载方案详情...</view>
      <view v-else-if="unavailable || !planDetail" class="page-status"
        >该焕新方案不存在或已下线</view
      >
      <view v-else class="page-content">
        <view class="scheme-card">
          <image
            v-if="planDetail.cover"
            class="scheme-cover"
            :src="planDetail.cover"
            mode="widthFix"
          />
          <view v-else class="scheme-cover image-placeholder" />
          <view class="scheme-info">
            <view class="scheme-title">{{ planDetail.name }}</view>
            <view class="scheme-summary-row">
              <text class="scheme-description">{{ planDetail.summary }}</text>
              <button class="reserve-small" :disabled="submitting" @click="reserve">
                免费预约
              </button>
            </view>
          </view>
        </view>

        <view class="fee-card">
          <view class="section-title-row">
            <text class="section-title">方案费用</text>
            <text class="current-detail">当前显示明细</text>
          </view>
          <view class="fee-tabs">
            <view
              v-for="tab in feeTabs"
              :key="tab"
              class="fee-tab"
              :class="{ active: activeTab === tab }"
              @click.stop="activeTab = tab"
            >
              {{ tab }}
            </view>
          </view>
          <view class="fee-summary">
            <view class="fee-summary-title">{{ activeTabTitle }}清单</view>
            <view class="fee-summary-price"
              ><text class="money">¥{{ visibleAmount.toFixed(2) }}</text
              ><text>可按实际需求调整明细</text></view
            >
          </view>
        </view>

        <view class="guarantee-card">
          <view class="section-title-row">
            <text class="section-title">服务保障</text>
            <text class="guarantee-note">商品价格包含基础安装服务</text>
          </view>
          <view class="guarantee-list">
            <view class="guarantee-item">
              <wd-icon name="orders" custom-style="font-size: 34rpx; color: #ff7a45;" />
              <view>
                <view class="guarantee-title">报价透明</view>
                <view class="guarantee-desc">明细清晰可查</view>
              </view>
            </view>
            <view class="guarantee-item pink">
              <wd-icon name="shield-check" custom-style="font-size: 34rpx; color: #f04438;" />
              <view>
                <view class="guarantee-title">质保服务</view>
                <view class="guarantee-desc">30天售后无忧</view>
              </view>
            </view>
            <view class="guarantee-item gold">
              <wd-icon name="user-circle" custom-style="font-size: 34rpx; color: #b97725;" />
              <view>
                <view class="guarantee-title">专业上门</view>
                <view class="guarantee-desc">师傅认证服务</view>
              </view>
            </view>
          </view>
        </view>

        <view class="detail-heading">{{ activeTabTitle }}明细</view>
        <view
          class="service-list"
          :style="serviceListMinHeight ? { minHeight: `${serviceListMinHeight}px` } : undefined"
        >
          <view v-for="item in visibleItems" :key="item.id" class="service-card">
            <image
              v-if="item.image"
              class="service-image"
              :class="{ 'material-image': item.category.includes('主材') }"
              :src="item.image"
              :mode="item.category.includes('主材') ? 'aspectFit' : 'aspectFill'"
            />
            <view v-else class="service-image image-placeholder" />
            <view class="service-content">
              <view class="service-title">{{ item.title }}</view>
              <view class="service-description">{{ item.description }}</view>
              <view class="service-price"
                ><text class="price-number">¥ {{ item.price.toFixed(2) }}</text
                ><text>/{{ item.unit }} × {{ item.quantity }}</text></view
              >
            </view>
            <wd-checkbox
              v-model="item.selected"
              type="square"
              checked-color="#e83228"
              unchecked-color="#d9d9d9"
              custom-style="position: absolute; top: 20rpx; right: 20rpx;"
            />
            <button class="replace-button" @click="replaceItem(item)">替换</button>
          </view>
          <view v-if="visibleItems.length === 0" class="empty-items">该分类暂无明细</view>
        </view>
      </view>
    </scroll-view>

    <view v-if="planDetail && !loading && !unavailable" class="bottom-bar">
      <view class="total-wrap">
        <view class="total-label">总金额</view>
        <view class="total-price">¥ {{ selectedAmount.toFixed(2) }}</view>
      </view>
      <button class="reserve-button" :disabled="submitting" :loading="submitting" @click="reserve">
        {{ submitting ? '提交中' : '免费预约' }}
      </button>
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

.page-status,
.empty-items {
  padding: 120rpx 24rpx;
  color: $jfx-font-dec2;
  font-size: 24rpx;
  text-align: center;
}

.empty-items {
  padding: 80rpx 24rpx;
}

.page-content {
  padding: 20rpx 24rpx 32rpx;
}

.scheme-card,
.fee-card,
.guarantee-card {
  @include jfx-shadow;
  background: #fff;
  border-radius: 18rpx;
}

.scheme-card {
  overflow: hidden;
}

.scheme-cover {
  display: block;
  width: 100%;
  height: auto;
}

.scheme-cover.image-placeholder {
  height: 230rpx;
}

.image-placeholder {
  background: #f0efed;
}

.scheme-info {
  padding: 14rpx 20rpx 20rpx;
}

.scheme-title {
  color: $jfx-font-title;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.scheme-summary-row {
  display: flex;
  margin-top: 4rpx;
  gap: 20rpx;
  align-items: flex-end;
}

.scheme-description {
  min-width: 0;
  flex: 1;
  color: $jfx-font-dec;
  font-size: 24rpx;
  line-height: 34rpx;
}

.reserve-small {
  height: 50rpx;
  margin: 0;
  padding: 0 20rpx;
  flex-shrink: 0;
  color: #fff;
  font-size: 22rpx;
  line-height: 50rpx;
  background: $jfx-brandColor;
  border-radius: 26rpx;
}

.fee-card {
  margin-top: 22rpx;
  padding: 22rpx 20rpx;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 600;
}

.current-detail {
  color: #f04438;
  font-size: 22rpx;
}

.fee-tabs {
  display: flex;
  margin-top: 16rpx;
  gap: 12rpx;
}

.fee-tab {
  display: flex;
  box-sizing: border-box;
  height: 48rpx;
  margin: 0;
  padding: 0 16rpx;
  justify-content: center;
  align-items: center;
  color: $jfx-font-title;
  font-size: 22rpx;
  line-height: 44rpx;
  background: #fff;
  border: 2rpx solid $jfx-border2;
  border-radius: 24rpx;
}

.fee-tab.active {
  color: #f04438;
  background: #fff4f2;
  border-color: #f04438;
}

.fee-summary {
  margin-top: 16rpx;
  padding: 14rpx 16rpx;
  background: #faf9f7;
  border-radius: 8rpx;
}

.fee-summary-title {
  color: $jfx-font-dec;
  font-size: 23rpx;
  font-weight: 600;
}

.fee-summary-price {
  margin-top: 6rpx;
  color: $jfx-font-dec;
  font-size: 21rpx;
  line-height: 30rpx;
}

.money {
  margin-right: 6rpx;
  color: #f04438;
  font-size: 25rpx;
}

.guarantee-card {
  margin-top: 22rpx;
  padding: 20rpx;
}

.guarantee-note {
  color: $jfx-font-dec;
  font-size: 21rpx;
}

.guarantee-list {
  display: flex;
  margin-top: 16rpx;
  gap: 10rpx;
}

.guarantee-item {
  display: flex;
  min-width: 0;
  padding: 12rpx 10rpx;
  flex: 1;
  gap: 10rpx;
  align-items: center;
  background: #fff7f0;
  border-radius: 14rpx;
}

.guarantee-item.pink {
  background: #fff4f3;
}

.guarantee-item.gold {
  background: #fff9ee;
}

.guarantee-title {
  color: $jfx-font-title;
  font-size: 22rpx;
  font-weight: 600;
  white-space: nowrap;
}

.guarantee-desc {
  margin-top: 2rpx;
  color: $jfx-font-dec;
  font-size: 18rpx;
  white-space: nowrap;
}

.detail-heading {
  margin: 26rpx 0 16rpx;
  color: $jfx-font-title;
  font-size: 29rpx;
  font-weight: 600;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  overflow-anchor: none;
}

.service-card {
  @include jfx-shadow;
  position: relative;
  display: flex;
  min-height: 150rpx;
  padding: 20rpx;
  background: #fff;
  border-radius: 16rpx;
}

.service-image {
  width: 170rpx;
  height: 138rpx;
  flex-shrink: 0;
  border-radius: 8rpx;
}

.service-image.material-image {
  background-color: #f7f7f7;
}

.service-content {
  min-width: 0;
  margin-left: 16rpx;
  padding-right: 42rpx;
  flex: 1;
}

.service-title {
  color: $jfx-font-title;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 38rpx;
}

.service-description {
  @include ellipsis(2);
  margin-top: 5rpx;
  color: $jfx-font-dec;
  font-size: 21rpx;
  line-height: 30rpx;
}

.service-price {
  margin-top: 10rpx;
  color: $jfx-font-dec;
  font-size: 21rpx;
}

.price-number {
  margin-right: 10rpx;
  color: #f04438;
  font-size: 27rpx;
}

.replace-button {
  position: absolute;
  right: 20rpx;
  bottom: 18rpx;
  height: 44rpx;
  margin: 0;
  padding: 0 16rpx;
  color: #f04438;
  font-size: 21rpx;
  line-height: 40rpx;
  background: #fff;
  border: 2rpx solid #f04438;
  border-radius: 22rpx;
}

.bottom-bar {
  display: flex;
  padding: 20rpx 40rpx calc(20rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-top: 2rpx solid #eeeae6;
}

.total-label {
  color: $jfx-font-dec2;
  font-size: 21rpx;
}

.total-price {
  margin-top: 5rpx;
  color: #e83228;
  font-size: 27rpx;
}

.reserve-button {
  width: 240rpx;
  height: 64rpx;
  margin: 0;
  color: #fff;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 64rpx;
  background: #e83228;
  border-radius: 16rpx;
}

button::after {
  border: 0;
}
</style>

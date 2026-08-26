<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { getCaseDetailApi } from '@/api/case'
import { toggleFavoriteApi } from '@/api/favorite'
import { useMemberStore, useRenovationBusinessStore } from '@/stores'
import type { CaseDetail } from '@/types/case-detail'

// 会员状态仓库
const memberStore = useMemberStore()
// 装修业务状态
const renovationBusinessStore = useRenovationBusinessStore()

// 案例编号
const caseId = ref(1)
// 是否为员工视图
const isEmployeeMode = ref(false)
// 归属员工编号
const attributionEmployeeId = ref<string>()
// 详情
const detail = ref<CaseDetail | null>(null)
// 员工编号
const employeeId = computed(() => memberStore.profile?.employeeId)
const favoriteIcon =
  'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/shoucang-shixin.png'
const unfavoriteIcon =
  'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/shoucang-kongxin.png'

const formatPrice = (price: string | number | null) => {
  const amount = Number(price)
  if (!Number.isFinite(amount)) return ''
  return `${Number((amount / 10000).toFixed(4))}万`
}

const normalizeHighlights = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item): item is { title: string; description: string } =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).title === 'string' &&
        typeof (item as Record<string, unknown>).description === 'string',
    )
    .map((item) => ({ title: item.title, description: item.description }))
}

const normalizeCosts = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item): item is { name: string; amount: number } =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).name === 'string' &&
        typeof (item as Record<string, unknown>).amount === 'number',
    )
    .map((item) => ({ name: item.name, value: formatPrice(item.amount) }))
}

const loadCaseDetail = async () => {
  const userId = Number(memberStore.profile?.id)
  if (!Number.isInteger(userId) || userId <= 0) {
    detail.value = null
    uni.showToast({ title: '请先登录后查看案例详情', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 500)
    return
  }

  try {
    const { data } = await getCaseDetailApi(caseId.value, userId)
    console.log('案例详情接口返回数据：', data)
    if (!data) {
      detail.value = null
      return
    }
    detail.value = {
      isFavorite: data.isFavorite === true,
      title: data.title,
      label: data.style || '',
      beforeCover: data.beforeImage || '',
      afterCover: data.afterImage || '',
      location: data.city || '',
      roomType: data.roomType || '',
      area: data.area ? `${data.area}㎡` : '',
      style: data.style || '',
      price: formatPrice(data.totalPrice),
      description: data.description || '',
      highlights: normalizeHighlights(data.highlights),
      costs: normalizeCosts(data.costs),
    }
  } catch (error) {
    console.error('获取案例详情失败：', error)
    detail.value = null
  }
}

// 切换当前案例收藏状态
const toggleCaseFavorite = async () => {
  if (!detail.value) return
  const userId = Number(memberStore.profile?.id)
  if (!Number.isInteger(userId) || userId <= 0) {
    uni.showToast({ title: '请先登录后再收藏', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 500)
    return
  }

  const nextFavorite = !detail.value.isFavorite
  try {
    const { data } = await toggleFavoriteApi({ userId, caseId: caseId.value })
    if (!detail.value) return
    detail.value.isFavorite = typeof data.isFavorite === 'boolean' ? data.isFavorite : nextFavorite
    uni.showToast({ title: detail.value.isFavorite ? '收藏成功' : '已取消收藏', icon: 'none' })
  } catch (error) {
    console.error(nextFavorite ? '收藏案例失败：' : '取消收藏失败：', error)
    uni.showToast({ title: nextFavorite ? '收藏失败' : '取消收藏失败', icon: 'none' })
  }
}

onLoad((options) => {
  // 当前数据编号
  const id = Number(options?.id)
  if (Number.isFinite(id)) caseId.value = id
  isEmployeeMode.value = options?.source === 'employee'
  attributionEmployeeId.value =
    typeof options?.employeeId === 'string' ? decodeURIComponent(options.employeeId) : undefined
  loadCaseDetail()
})

// 获取当前案例的装修报价
const requestQuote = () => {
  if (!detail.value) return
  renovationBusinessStore.createAppointment({
    type: 'CASE',
    source: '案例详情',
    caseId: caseId.value,
    city: detail.value.location,
    area: detail.value.area.replace('㎡', ''),
    roomLayout: detail.value.roomType,
    demand: '获取同款案例报价',
    employeeId: Number(attributionEmployeeId.value) || undefined,
    snapshot: {
      title: detail.value.title,
      cover: detail.value.afterCover,
      referencePrice: detail.value.price,
    },
  })
  uni.showToast({ title: '案例报价预约已提交', icon: 'success' })
  setTimeout(
    () => uni.navigateTo({ url: '/pages-sub/my/decorationOrder/decorationOrder?group=consult' }),
    400,
  )
}

// 准备案例分享
const prepareCaseShare = () => {
  if (!employeeId.value) {
    uni.showToast({ title: '员工信息不完整，暂无法分享', icon: 'none' })
  }
}

onShareAppMessage(() => {
  if (!detail.value) {
    return {
      title: '家翻新精选案例',
      path: '/pages/caseList/caseList',
    }
  }
  // 所属人编号
  const ownerId = employeeId.value
  if (!ownerId) {
    return {
      title: '家翻新精选案例',
      path: '/pages/caseList/caseList',
    }
  }
  return {
    title: detail.value.title,
    path: `/pages/caseDetail/caseDetail?id=${caseId.value}&employeeId=${encodeURIComponent(
      ownerId,
    )}`,
    imageUrl: detail.value.afterCover,
  }
})
</script>

<template>
  <view v-if="detail" class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="compare-card">
        <view class="compare-images">
          <view class="compare-image-wrap">
            <image class="compare-image" :src="detail.beforeCover" mode="aspectFill" />
            <text class="image-label">改造前</text>
          </view>
          <view class="compare-image-wrap">
            <image class="compare-image" :src="detail.afterCover" mode="aspectFill" />
            <text class="image-label">改造后</text>
          </view>
          <image
            class="compare-arrow"
            src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/jiantou.png"
            mode="aspectFit"
          />
        </view>
        <view class="case-heading">
          <text class="case-label">{{ detail.label }}</text>
          <view class="case-title">{{ detail.title }}</view>
          <view class="case-meta">
            <text>{{ detail.location }}</text>
            <text>{{ detail.roomType }}</text>
            <text>{{ detail.area }}</text>
            <text>{{ detail.style }}</text>
          </view>
          <view class="case-result">
            <view>
              <text class="result-label">总花费</text>
              <text class="result-price">¥{{ detail.price }}</text>
            </view>
            <image
              class="favorite-icon"
              :src="detail.isFavorite ? favoriteIcon : unfavoriteIcon"
              mode="aspectFit"
              @click.stop="toggleCaseFavorite"
            />
          </view>
        </view>
      </view>

      <view class="detail-card">
        <view class="section-title">案例背景</view>
        <view class="case-description">{{ detail.description }}</view>
      </view>

      <view class="detail-card">
        <view class="section-title">改造亮点</view>
        <view class="highlight-list">
          <view v-for="(item, index) in detail.highlights" :key="item.title" class="highlight-item">
            <view class="highlight-index">0{{ index + 1 }}</view>
            <view class="highlight-content">
              <view class="highlight-title">{{ item.title }}</view>
              <view class="highlight-description">{{ item.description }}</view>
            </view>
          </view>
        </view>
      </view>

      <view class="detail-card">
        <view class="section-heading">
          <view class="section-title">费用明细</view>
          <text class="section-tip">参考费用</text>
        </view>
        <view class="cost-list">
          <view v-for="item in detail.costs" :key="item.name" class="cost-item">
            <text>{{ item.name }}</text>
            <text class="cost-value">¥{{ item.value }}</text>
          </view>
          <view class="cost-total">
            <text>合计</text>
            <text>¥{{ detail.price }}</text>
          </view>
        </view>
      </view>

      <view class="detail-note">案例价格因房屋情况和材料选择不同仅供参考</view>
    </scroll-view>

    <view class="bottom-action">
      <view class="action-price">
        <text class="action-label">同款参考价</text>
        <text class="action-value">¥{{ detail.price }}</text>
      </view>
      <button
        v-if="isEmployeeMode"
        class="quote-button"
        :open-type="employeeId ? 'share' : undefined"
        @click="prepareCaseShare"
      >
        分享给客户
      </button>
      <button v-else class="quote-button" @click="requestQuote">获取同款报价</button>
    </view>
  </view>
  <view v-else class="detail-empty">案例不存在或已下线</view>
</template>

<style lang="scss">
.detail-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  background-color: $jfx-pageBackGroundColor;
}

.detail-empty {
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  color: #999999;
  font-size: 28rpx;
}

.detail-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.compare-card,
.detail-card {
  @include jfx-shadow;
  overflow: hidden;
  margin: 0 24rpx 20rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.compare-images {
  position: relative;
  display: flex;
  height: 320rpx;
}
.compare-image-wrap {
  position: relative;
  width: 50%;
  height: 100%;
  overflow: hidden;
}
.compare-image-wrap:first-child {
  border-right: 2rpx solid #ffffff;
}
.compare-image {
  width: 100%;
  height: 100%;
}

.image-label {
  position: absolute;
  bottom: 12rpx;
  left: 12rpx;
  padding: 3rpx 8rpx;
  color: #ffffff;
  font-size: 18rpx;
  line-height: 28rpx;
  background-color: rgba(29, 29, 31, 0.5);
  border-radius: 6rpx;
}

.compare-arrow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 48rpx;
  height: 48rpx;
  transform: translate(-50%, -50%);
}
.case-heading {
  padding: 24rpx;
}

.case-label {
  display: inline-block;
  padding: 4rpx 12rpx;
  color: $jfx-brandColor;
  font-size: 20rpx;
  line-height: 30rpx;
  background-color: #fff0ee;
  border-radius: 6rpx;
}

.case-title {
  margin-top: 12rpx;
  color: $jfx-font-title;
  font-size: 32rpx;
  line-height: 46rpx;
}
.case-meta {
  display: flex;
  gap: 16rpx;
  margin-top: 6rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 34rpx;
}

.case-result {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 2rpx solid $jfx-border;
}

.result-label {
  margin-right: 12rpx;
  color: $jfx-font-dec;
  font-size: 22rpx;
}
.result-price {
  color: $jfx-brandColor;
  font-size: 34rpx;
}

.favorite-icon {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
}

.detail-card {
  padding: 24rpx;
}
.section-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  line-height: 40rpx;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-tip {
  color: $jfx-font-dec2;
  font-size: 20rpx;
}
.case-description {
  margin-top: 14rpx;
  color: $jfx-font-dec;
  font-size: 23rpx;
  line-height: 40rpx;
}
.highlight-list {
  margin-top: 8rpx;
}
.highlight-item {
  display: flex;
  padding: 18rpx 0;
  border-bottom: 2rpx solid $jfx-border;
}
.highlight-item:last-child {
  border-bottom: 0;
}
.highlight-index {
  width: 54rpx;
  flex-shrink: 0;
  color: $jfx-brandColor;
  font-size: 24rpx;
  line-height: 36rpx;
}
.highlight-title {
  color: $jfx-font-title;
  font-size: 24rpx;
  line-height: 36rpx;
}
.highlight-description {
  margin-top: 4rpx;
  color: $jfx-font-dec2;
  font-size: 21rpx;
  line-height: 34rpx;
}

.cost-list {
  margin-top: 12rpx;
}
.cost-item,
.cost-total {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  color: $jfx-font-dec;
  font-size: 22rpx;
}
.cost-item {
  border-bottom: 2rpx solid $jfx-border;
}
.cost-value {
  color: $jfx-font-title;
}
.cost-total {
  color: $jfx-font-title;
  font-size: 25rpx;
}
.cost-total text:last-child {
  color: $jfx-brandColor;
}

.detail-note {
  padding: 12rpx 24rpx 32rpx;
  color: $jfx-font-dec2;
  font-size: 20rpx;
  text-align: center;
}

.bottom-action {
  display: flex;
  min-height: 112rpx;
  flex-shrink: 0;
  align-items: center;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.action-price {
  display: flex;
  min-width: 220rpx;
  flex-direction: column;
}
.action-label {
  color: $jfx-font-dec;
  font-size: 20rpx;
  line-height: 30rpx;
}
.action-value {
  color: $jfx-brandColor;
  font-size: 32rpx;
  line-height: 42rpx;
}
.quote-button {
  height: 72rpx;
  margin: 0 0 0 auto;
  padding: 0 44rpx;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 72rpx;
  background-color: $jfx-brandColor;
  border-radius: 36rpx;
}
</style>

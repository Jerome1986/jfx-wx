<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { useMemberStore, useRenovationBusinessStore } from '@/stores'
import { getCaseCategoryListApi, getCasePageApi, getCasePageByCategoryApi } from '@/api/case'
import type { CaseItem } from '@/types/case-list'
import type { CaseCategoryItem, RenovationCaseItem } from '@/types/case-api'

// 会员状态仓库
const memberStore = useMemberStore()
// 装修业务状态
const renovationBusinessStore = useRenovationBusinessStore()
// 是否为员工视图
const isEmployeeMode = ref(false)
// 已选分享案例
const selectedShareCase = ref<CaseItem>()
// 员工编号
const employeeId = computed(() => memberStore.profile?.employeeId)

// 案例列表
const caseList = ref<CaseItem[]>([])

// 案例分类，“全部案例”由前端固定添加
const caseCategories = ref<CaseCategoryItem[]>([{ id: 0, name: '全部案例', code: 'all', sort: -1 }])
// 当前分类 ID，0 表示全部案例
const activeCategoryId = ref(0)
const activeCategory = computed(
  () => caseCategories.value.find((item) => item.id === activeCategoryId.value)?.name || '全部案例',
)
const pageNum = ref(1)
const pageSize = 10
const totalPage = ref(0)
const caseTotal = ref(0)
const isLoading = ref(false)
let requestVersion = 0

const formatPrice = (price: string | null) => {
  const amount = Number(price)
  if (!Number.isFinite(amount)) return ''
  return `${Number((amount / 10000).toFixed(4))}万`
}

const mapCaseItem = (item: RenovationCaseItem): CaseItem => ({
  id: item.id,
  title: item.title,
  label: caseCategories.value.find((category) => category.id === item.categoryId)?.name || '',
  beforeCover: item.beforeImage || '',
  afterCover: item.afterImage || '',
  location: item.city || '',
  roomType: item.roomType || '',
  area: item.area ? `${item.area}㎡` : '',
  tags: Array.isArray(item.tags)
    ? item.tags.filter((tag): tag is string => typeof tag === 'string')
    : [],
  price: formatPrice(item.totalPrice),
  duration: item.durationDays == null ? '' : `${item.durationDays}天`,
  receivedCount: item.quoteCount,
})

const loadCaseList = async (reset = false) => {
  if (!reset && (isLoading.value || pageNum.value > totalPage.value)) return
  if (reset) {
    pageNum.value = 1
    totalPage.value = 0
    caseTotal.value = 0
    caseList.value = []
  }

  const version = reset ? ++requestVersion : requestVersion
  const categoryId = activeCategoryId.value
  isLoading.value = true
  try {
    const response =
      categoryId === 0
        ? await getCasePageApi({ pageNum: pageNum.value, pageSize })
        : await getCasePageByCategoryApi(categoryId, pageNum.value, pageSize)
    if (version !== requestVersion || categoryId !== activeCategoryId.value) return

    const items = response.data.list.map(mapCaseItem)
    caseList.value = reset ? items : [...caseList.value, ...items]
    caseTotal.value = response.data.total
    totalPage.value = response.data.totalPage
    pageNum.value = response.data.pageNum + 1
  } catch (error) {
    console.error('获取案例列表失败', error)
  } finally {
    if (version === requestVersion) isLoading.value = false
  }
}

const selectCategory = (category: CaseCategoryItem) => {
  if (category.id === activeCategoryId.value) return
  activeCategoryId.value = category.id
  loadCaseList(true)
}

const loadMoreCases = () => loadCaseList()

onLoad(async (options) => {
  isEmployeeMode.value = options?.source === 'employee'
  try {
    const { data } = await getCaseCategoryListApi()
    caseCategories.value = [
      { id: 0, name: '全部案例', code: 'all', sort: -1 },
      ...data.filter((category) => category.name !== '全部案例'),
    ]
  } catch (error) {
    console.error('获取案例分类失败', error)
  }
  await loadCaseList(true)
})

// 获取当前案例的装修报价
const requestQuote = (item: CaseItem) => {
  renovationBusinessStore.createAppointment({
    type: 'CASE',
    source: '精选案例',
    caseId: item.id,
    city: item.location,
    area: item.area.replace('㎡', ''),
    roomLayout: item.roomType,
    demand: '获取同款案例报价',
    snapshot: { title: item.title, cover: item.afterCover, referencePrice: item.price },
  })
  uni.showToast({ title: '案例报价预约已提交', icon: 'success' })
  setTimeout(
    () => uni.navigateTo({ url: '/pages-sub/my/decorationOrder/decorationOrder?group=consult' }),
    400,
  )
}

// 查看案例详情
const viewCaseDetail = (item: CaseItem) => {
  // 数据来源
  const source = isEmployeeMode.value ? '&source=employee' : ''
  uni.navigateTo({ url: `/pages/caseDetail/caseDetail?id=${item.id}${source}` })
}

// 准备案例分享
const prepareCaseShare = (item: CaseItem) => {
  if (!employeeId.value) {
    uni.showToast({ title: '员工信息不完整，暂无法分享', icon: 'none' })
    return
  }
  selectedShareCase.value = item
}

onShareAppMessage(() => {
  // 当前处理项
  const item = selectedShareCase.value
  // 所属人编号
  const ownerId = employeeId.value
  if (!item || !ownerId) {
    return {
      title: '家翻新精选案例',
      path: '/pages/caseList/caseList',
    }
  }
  return {
    title: item.title,
    path: `/pages/caseDetail/caseDetail?id=${item.id}&employeeId=${encodeURIComponent(ownerId)}`,
    imageUrl: item.afterCover,
  }
})
</script>

<template>
  <view class="case-page">
    <view class="case-intro">
      <view class="intro-title">真实改造案例</view>
      <view class="intro-description">从真实案例中寻找灵感，快速获取同款改造方案</view>
      <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
        <view class="category-list">
          <view
            v-for="category in caseCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: activeCategoryId === category.id }"
            @click="selectCategory(category)"
          >
            {{ category.name }}
          </view>
        </view>
      </scroll-view>
    </view>

    <scroll-view
      class="case-scroll"
      scroll-y
      :show-scrollbar="false"
      :lower-threshold="100"
      @scrolltolower="loadMoreCases"
    >
      <view class="case-list">
        <view class="list-heading">
          <text>{{ activeCategory }}</text>
          <text class="case-count">共{{ caseTotal }}个案例</text>
        </view>
        <view
          v-for="item in caseList"
          :key="item.id"
          class="case-card"
          @click="viewCaseDetail(item)"
        >
          <view class="case-cover">
            <image class="cover-image" :src="item.beforeCover" mode="aspectFill" />
            <image class="cover-image" :src="item.afterCover" mode="aspectFill" />
            <text class="cover-label">{{ item.label }}</text>
            <image
              class="compare-icon"
              src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/jiantou.png"
              mode="aspectFit"
            />
            <text class="before-text">改造前</text>
            <text class="after-text">改造后</text>
          </view>

          <view class="case-content">
            <view class="case-summary">
              <view class="case-title">{{ item.title }}</view>
              <view class="case-meta">
                <text>{{ item.location }}</text>
                <text>{{ item.roomType }}</text>
                <text>{{ item.area }}</text>
              </view>
              <view class="case-tags">
                <text v-for="tag in item.tags" :key="tag" class="case-tag">{{ tag }}</text>
              </view>
            </view>

            <view class="case-quote">
              <view class="quote-main">
                <view class="quote-cost">
                  <view class="quote-label">总花费</view>
                  <view class="quote-price"
                    ><text class="price-symbol">¥</text>{{ item.price }}</view
                  >
                </view>
                <button
                  v-if="isEmployeeMode"
                  class="quote-button"
                  :open-type="employeeId ? 'share' : undefined"
                  @click.stop="prepareCaseShare(item)"
                >
                  分享给客户
                </button>
                <button v-else class="quote-button" @click.stop="requestQuote(item)">
                  获取同款报价
                </button>
              </view>
              <view class="quote-progress">
                <text>工期 {{ item.duration }}</text>
                <view class="received-info">
                  <image
                    class="received-avatars"
                    src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/avatar/touxiang-group.png"
                    mode="aspectFit"
                  />
                  <text>{{ item.receivedCount }}人已获取</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="list-tip">
          {{
            isLoading
              ? '加载中...'
              : pageNum <= totalPage
              ? '继续下滑查看更多案例'
              : '没有更多案例了'
          }}
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.case-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  background-color: $jfx-pageBackGroundColor;
}

.case-intro {
  flex-shrink: 0;
  padding: 20rpx 24rpx 16rpx;
}

.intro-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  line-height: 40rpx;
}

.intro-description {
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 34rpx;
}

.category-scroll {
  width: 100%;
  height: 64rpx;
  margin-top: 18rpx;
  white-space: nowrap;
}

.category-list {
  display: inline-flex;
  gap: 12rpx;
}

.category-item {
  height: 56rpx;
  padding: 0 24rpx;
  color: $jfx-font-dec;
  font-size: 22rpx;
  line-height: 56rpx;
  background-color: #ffffff;
  border-radius: 28rpx;

  &.active {
    color: #ffffff;
    background-color: $jfx-brandColor;
  }
}

.case-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.case-list {
  padding: 0 24rpx calc(40rpx + env(safe-area-inset-bottom));
}

.list-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0 16rpx;
  color: $jfx-font-title;
  font-size: 26rpx;
}

.case-count {
  color: $jfx-font-dec2;
  font-size: 22rpx;
}

.case-card {
  @include jfx-shadow;
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 20rpx;

  & + .case-card {
    margin-top: 24rpx;
  }
}

.case-cover {
  position: relative;
  display: flex;
  height: 208rpx;
  overflow: hidden;
}

.cover-image {
  width: 50%;
  height: 100%;

  &:first-child {
    border-right: 2rpx solid rgba(255, 255, 255, 0.9);
  }
}

.cover-label {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  padding: 3rpx 8rpx;
  color: #ffffff;
  font-size: 16rpx;
  line-height: 24rpx;
  background-color: $jfx-brandColor;
  border-radius: 6rpx;
}

.compare-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44rpx;
  height: 44rpx;
  transform: translate(-50%, -50%);
}

.before-text,
.after-text {
  position: absolute;
  bottom: 10rpx;
  padding: 2rpx 6rpx;
  color: #ffffff;
  font-size: 16rpx;
  line-height: 24rpx;
  background-color: rgba(29, 29, 31, 0.46);
  border-radius: 4rpx;
}

.before-text {
  left: 10rpx;
}
.after-text {
  left: calc(50% + 10rpx);
}

.case-content {
  display: flex;
  min-height: 156rpx;
}

.case-summary {
  display: flex;
  width: 50%;
  min-width: 0;
  flex-shrink: 0;
  flex-direction: column;
  justify-content: center;
  padding: 14rpx 12rpx 16rpx 18rpx;
}

.case-title {
  overflow: hidden;
  color: $jfx-font-title;
  font-size: 26rpx;
  line-height: 38rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.case-meta {
  display: flex;
  gap: 10rpx;
  margin-top: 2rpx;
  color: $jfx-font-dec2;
  font-size: 20rpx;
  line-height: 30rpx;
}

.case-tags {
  display: flex;
  gap: 6rpx;
  margin-top: 10rpx;
  white-space: nowrap;
}

.case-tag {
  padding: 3rpx 8rpx;
  color: #8b5e3c;
  font-size: 18rpx;
  line-height: 28rpx;
  background-color: #fbf4ec;
  border-radius: 6rpx;
}

.case-quote {
  position: relative;
  display: flex;
  width: 50%;
  min-width: 0;
  flex-shrink: 0;
  flex-direction: column;
  justify-content: center;
  padding: 12rpx 14rpx;

  &::before {
    position: absolute;
    top: 24%;
    bottom: 24%;
    left: 0;
    width: 2rpx;
    background-color: $jfx-border;
    content: '';
  }
}

.quote-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8rpx;
}

.quote-cost {
  flex-shrink: 0;
}
.quote-label {
  color: $jfx-font-dec;
  font-size: 20rpx;
  line-height: 30rpx;
}
.quote-price {
  color: $jfx-brandColor;
  font-size: 28rpx;
  line-height: 40rpx;
}
.price-symbol {
  margin-right: 3rpx;
  font-size: 20rpx;
}

.quote-button {
  height: 56rpx;
  margin: 0;
  padding: 0 14rpx;
  color: #ffffff;
  font-size: 20rpx;
  line-height: 56rpx;
  white-space: nowrap;
  background-color: $jfx-brandColor;
  border-radius: 8rpx;
}

.quote-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6rpx;
  color: $jfx-font-dec2;
  font-size: 18rpx;
  white-space: nowrap;
}

.received-info {
  display: flex;
  align-items: center;
}
.received-avatars {
  width: 56rpx;
  height: 24rpx;
  margin-right: 4rpx;
  flex-shrink: 0;
}

.list-tip {
  padding: 64rpx 0 24rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  text-align: center;
}
</style>

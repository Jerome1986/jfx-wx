<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getUserProjectListApi } from '@/api/project'
import { projectStatusText } from '@/stores/modules/renovation-business'
import type { RenovationProject } from '@/types/renovation-business'
import type { UserProjectListStatus } from '@/types/project'

// 每页加载的项目数量。
const PAGE_SIZE = 10
// 装修项目状态筛选项。
const filters: Array<{ label: string; value: UserProjectListStatus }> = [
  { label: '全部', value: 'ALL' },
  { label: '待确认', value: 'PENDING_CONFIRM' },
  { label: '服务中', value: 'IN_SERVICE' },
  { label: '已完成', value: 'COMPLETED' },
]
// 当前选中的项目状态。
const active = ref<UserProjectListStatus>('ALL')
// 接口已加载的装修项目列表。
const list = ref<RenovationProject[]>([])
// 当前成功加载的页码。
const pageNum = ref(0)
// 接口返回的总页数。
const totalPage = ref(0)
// 当前状态下的项目总数。
const total = ref(0)
// 项目列表加载状态。
const loading = ref(false)
// 项目列表加载失败状态。
const loadFailed = ref(false)
// 是否已经完成首次页面加载。
const loaded = ref(false)
// 当前筛选是否还有下一页。
const hasMore = computed(() => pageNum.value < totalPage.value)

// 保留零报价，避免将空值或非法金额展示为 0 或 NaN。
const formatQuotedAmount = (value: unknown): string | null => {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !value.trim()) return null
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) return null
  const fixed = amount.toFixed(2)
  // 超大金额的 toFixed 会返回科学计数法，展开后再添加分组符。
  const normalized = fixed.includes('e+')
    ? (() => {
        const [coefficient, exponent] = fixed.split('e+')
        const digits = coefficient.replace('.', '')
        return digits.padEnd(Number(exponent) + 1, '0') + '.00'
      })()
    : fixed
  const [integer, decimal] = normalized.split('.')
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimal || '00'}`
}

const statusGuidance = {
  PENDING_CONFIRM: '请核对项目报价，确认后即可进入服务阶段',
  IN_SERVICE: '项目服务中，可进入详情查看项目跟进',
  COMPLETED: '项目已完成，可查看报价与服务记录',
  CANCELED: '项目已取消，可查看原项目信息',
}

// 仅展示接口实际提供的时间，不将报价确认时间标为开工时间。
const getProjectDate = (item: RenovationProject) => {
  const milestones = [
    ...(item.status === 'COMPLETED' ? [['完成时间', item.completedAt]] : []),
    ...(item.status === 'IN_SERVICE' ? [['报价确认', item.customerConfirmedAt]] : []),
    ...(item.status === 'PENDING_CONFIRM' ? [['报价提交', item.quoteSubmittedAt]] : []),
    ['创建时间', item.createdAt],
  ]
  const milestone = milestones.find(([, value]) => value && /^\d{4}-\d{2}-\d{2}/.test(value))
  return milestone
    ? { label: milestone[0], value: milestone[1]!.slice(0, 10).replace(/-/g, '.') }
    : null
}

const projectCards = computed(() =>
  list.value.map((item) => {
    const quoteNames = [
      ...new Set(item.quote?.items?.map((line) => line.name?.trim()).filter(Boolean) || []),
    ]
    return {
      ...item,
      displayAmount: formatQuotedAmount(item.quotedAmount),
      serviceContent: item.renovationScope?.trim(),
      quoteNames: quoteNames.slice(0, 3),
      extraQuoteCount: Math.max(0, quoteNames.length - 3),
      displayPlanName: item.planName?.trim(),
      displayEmployeeName: item.employeeName?.trim(),
      projectDate: getProjectDate(item),
      guidance: statusGuidance[item.status],
    }
  }),
)

// 打开用户装修项目详情。
const open = (id: number) =>
  uni.navigateTo({ url: `/pages-sub/my/renovationOrderDetail/renovationOrderDetail?id=${id}` })

// 分页加载当前状态的用户装修项目。
const loadProjects = async (reset = false) => {
  // 1. 阻止重复请求或无更多数据时继续翻页。
  if (loading.value || (!reset && !hasMore.value)) return
  // 2. 计算请求页码并重置请求状态。
  const nextPage = reset ? 1 : pageNum.value + 1
  loading.value = true
  loadFailed.value = false
  try {
    // 3. 按当前状态请求用户装修项目分页数据。
    const { data } = await getUserProjectListApi({
      status: active.value,
      pageNum: nextPage,
      pageSize: PAGE_SIZE,
    })
    console.log('装修订单', data)

    // 4. 首次加载替换列表，翻页时追加列表。
    list.value = reset ? data.list : [...list.value, ...data.list]
    pageNum.value = data.pageNum
    totalPage.value = data.totalPage
    total.value = data.total
  } catch (error) {
    // 5. 请求失败时保留已有列表并显示重试入口。
    console.error('获取用户装修项目列表失败：', error)
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

// 切换项目状态并重新请求第一页。
const selectStatus = (status: UserProjectListStatus) => {
  // 1. 忽略当前状态和加载过程中的重复操作。
  if (active.value === status || loading.value) return
  // 2. 更新状态并重新加载项目列表。
  active.value = status
  loadProjects(true)
}

onLoad((query) => {
  // 1. 读取页面参数指定的初始状态。
  const value = query?.status as UserProjectListStatus
  if (filters.some((item) => item.value === value)) active.value = value
  // 2. 首次进入页面时加载项目列表。
  loadProjects(true).finally(() => {
    loaded.value = true
  })
})

onShow(() => {
  // 从项目详情返回时刷新当前状态列表。
  if (loaded.value) loadProjects(true)
})
</script>
<template>
  <view class="page">
    <view class="tabs">
      <view
        v-for="item in filters"
        :key="item.value"
        class="tab-item"
        :class="{ active: active === item.value }"
        @click="selectStatus(item.value)"
      >
        {{ item.label }}
      </view>
    </view>

    <scroll-view
      class="scroll"
      scroll-y
      :show-scrollbar="false"
      lower-threshold="120"
      @scrolltolower="loadProjects()"
    >
      <view class="content">
        <view class="count">共 {{ total }} 个装修项目</view>

        <view class="project-list">
          <view v-for="item in projectCards" :key="item.id" class="card" @click="open(item.id)">
            <view class="head">
              <view class="project-copy">
                <text class="title">{{ item.name?.trim() || '装修项目' }}</text>
              </view>
              <text :class="['status', `status-${item.status}`]">
                {{ projectStatusText[item.status] }}
              </text>
            </view>

            <view class="project-info">
              <view class="address-row">
                <text class="address">{{ item.serviceAddress?.trim() || '服务地址待补充' }}</text>
              </view>
              <view v-if="item.serviceContent || item.quoteNames.length" class="renovation-info">
                <view class="section-heading"
                  ><text class="section-mark" /><text>本次装修</text></view
                >
                <text v-if="item.serviceContent" class="scope-copy">{{ item.serviceContent }}</text>
                <view v-if="item.quoteNames.length" class="service-tags">
                  <text v-for="name in item.quoteNames" :key="name" class="service-tag">{{
                    name
                  }}</text>
                  <text v-if="item.extraQuoteCount" class="service-more"
                    >另 {{ item.extraQuoteCount }} 项</text
                  >
                </view>
              </view>
              <view
                v-if="item.displayPlanName || item.displayEmployeeName || item.projectDate"
                class="project-facts"
              >
                <view v-if="item.displayPlanName" class="fact fact-wide">
                  <text class="fact-label">装修方案</text>
                  <text class="fact-value">{{ item.displayPlanName }}</text>
                </view>
                <view v-if="item.displayEmployeeName" class="fact">
                  <text class="fact-label">项目负责人</text>
                  <text class="fact-value">{{ item.displayEmployeeName }}</text>
                </view>
                <view v-if="item.projectDate" class="fact fact-date">
                  <text class="fact-label">{{ item.projectDate.label }}</text>
                  <text class="fact-value">{{ item.projectDate.value }}</text>
                </view>
              </view>
            </view>

            <view v-if="item.guidance" :class="['status-guide', `guide-${item.status}`]">
              <view class="guide-dot" />
              <text>{{ item.guidance }}</text>
            </view>

            <view class="card-footer">
              <view class="quote">
                <text class="quote-label">项目报价</text>
                <view v-if="item.displayAmount !== null" class="amount">
                  <text class="currency">¥</text>
                  <text class="amount-value">{{ item.displayAmount }}</text>
                </view>
                <text v-else class="quote-empty">暂无报价</text>
              </view>
              <view class="detail-link">
                <text>查看详情</text>
                <text class="arrow">›</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="list.length && loading" class="list-state">正在加载...</view>
        <view v-else-if="list.length && loadFailed" class="list-state retry" @click="loadProjects()"
          >加载失败，点击重试</view
        >
        <view v-else-if="list.length && !hasMore" class="list-state">没有更多了</view>
        <view v-else-if="loading" class="empty">正在加载装修项目...</view>
        <view v-else-if="loadFailed" class="empty retry" @click="loadProjects(true)"
          >加载失败，点击重试</view
        >
        <view v-else-if="!list.length" class="empty">暂无相关装修项目</view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.tabs {
  display: flex;
  height: 98rpx;
  margin: 24rpx 24rpx 0;
  padding: 0 24rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-radius: 18rpx;
  box-shadow: 0 6rpx 22rpx rgba(89, 65, 46, 0.035);
}

.tab-item {
  display: flex;
  height: 46rpx;
  padding: 0 30rpx;
  align-items: center;
  justify-content: center;
  color: #666666;
  font-size: 24rpx;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 25rpx;
}

.tab-item.active {
  color: #e52e24;
  background: #fff0ef;
}

.scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.content {
  padding: 24rpx 24rpx calc(52rpx + env(safe-area-inset-bottom));
}

.count {
  color: #aaaaaa;
  font-size: 23rpx;
  line-height: 34rpx;
}

.project-list {
  margin-top: 24rpx;
}

.card {
  padding: 28rpx;
  background: #ffffff;
  border: 1rpx solid rgba(114, 89, 69, 0.07);
  border-radius: 24rpx;
  box-shadow: 0 6rpx 20rpx rgba(72, 52, 38, 0.035);
}

.card + .card {
  margin-top: 24rpx;
}

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.project-copy {
  flex: 1;
  min-width: 0;
  padding-right: 20rpx;
}

.title,
.address {
  @include ellipsis(2);
  word-break: break-all;
}

.title {
  color: #222222;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 44rpx;
}

.status {
  display: inline-flex;
  width: 144rpx;
  height: 44rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 44rpx;
  white-space: nowrap;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.status-PENDING_CONFIRM {
  color: #b95725;
  background: #fff3e8;
}

.status-IN_SERVICE {
  color: #35794d;
  background: #edf7f0;
}

.status-COMPLETED,
.status-CANCELED {
  color: #727272;
  background: #f3f3f3;
}

.project-info {
  margin-top: 18rpx;
}

.address {
  color: #666666;
  font-size: 25rpx;
  line-height: 38rpx;
}

.address-row {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
}

.address {
  flex: 1;
  min-width: 0;
}

.renovation-info {
  margin-top: 24rpx;
  padding: 22rpx;
  background: #faf8f5;
  border: 1rpx solid #f3eee8;
  border-radius: 16rpx;
}

.section-heading {
  display: flex;
  align-items: center;
  color: #5d4e42;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 34rpx;
}

.section-mark {
  width: 5rpx;
  height: 22rpx;
  margin-right: 10rpx;
  background: #c58a61;
  border-radius: 4rpx;
}

.scope-copy {
  @include ellipsis(3);
  margin-top: 14rpx;
  color: #4d4945;
  font-size: 26rpx;
  line-height: 40rpx;
  word-break: break-all;
}

.service-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
}

.service-tag {
  @include ellipsis;
  max-width: 100%;
  padding: 6rpx 14rpx;
  color: #75614f;
  background: #ffffff;
  border: 1rpx solid #ece5dc;
  border-radius: 8rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  white-space: nowrap;
  box-sizing: border-box;
}

.service-more {
  color: #94816f;
  font-size: 22rpx;
  line-height: 32rpx;
}

.project-facts {
  display: flex;
  flex-wrap: wrap;
  margin-top: 6rpx;
}

.fact {
  width: 50%;
  min-width: 0;
  padding-top: 22rpx;
  padding-right: 20rpx;
  box-sizing: border-box;
}

.fact-wide {
  width: 100%;
}

.fact-date {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 20rpx;

  .fact-label {
    flex-shrink: 0;
  }

  .fact-value {
    @include ellipsis;
    min-width: 0;
    margin-top: 0;
    white-space: nowrap;
  }
}

.fact-label {
  display: block;
  color: #919191;
  font-size: 22rpx;
  line-height: 32rpx;
}

.fact-value {
  @include ellipsis(2);
  margin-top: 6rpx;
  color: #444444;
  font-size: 25rpx;
  line-height: 36rpx;
  word-break: break-all;
}

.status-guide {
  display: flex;
  align-items: flex-start;
  margin-top: 24rpx;
  padding: 16rpx 18rpx;
  color: #777777;
  background: #f6f6f6;
  border-radius: 12rpx;
  font-size: 22rpx;
  line-height: 34rpx;
}

.guide-dot {
  width: 8rpx;
  height: 8rpx;
  margin: 13rpx 12rpx 0 0;
  flex-shrink: 0;
  background: currentColor;
  border-radius: 50%;
}

.guide-PENDING_CONFIRM {
  color: #a36a35;
  background: #fff8ee;
}

.guide-IN_SERVICE {
  color: #4d7b5c;
  background: #f0f7f2;
}
.card-footer {
  display: flex;
  margin-top: 24rpx;
  padding-top: 22rpx;
  align-items: center;
  justify-content: space-between;
  border-top: 1rpx solid #f0efed;
}

.quote {
  flex: 1;
  min-width: 0;
  padding-right: 24rpx;
}

.quote-label {
  display: block;
  color: #888888;
  font-size: 22rpx;
  line-height: 32rpx;
}

.amount {
  display: flex;
  margin-top: 4rpx;
  align-items: baseline;
  color: #d92d20;
  font-weight: 600;
}

.currency {
  margin-right: 5rpx;
  flex-shrink: 0;
  font-size: 24rpx;
}

.amount-value {
  min-width: 0;
  font-size: 36rpx;
  line-height: 46rpx;
  word-break: break-all;
  font-variant-numeric: tabular-nums;
}

.quote-empty {
  display: block;
  margin-top: 4rpx;
  color: #888888;
  font-size: 26rpx;
  line-height: 46rpx;
}

.detail-link {
  display: flex;
  min-height: 72rpx;
  padding: 0 24rpx;
  background: #d92d20;
  border-radius: 36rpx;
  flex-shrink: 0;
  align-items: center;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 500;
  white-space: nowrap;
}

.arrow {
  margin-left: 10rpx;
  font-size: 34rpx;
  font-weight: 400;
  line-height: 34rpx;
}
.empty {
  padding: 180rpx 0;
  color: #aaaaaa;
  font-size: 24rpx;
  text-align: center;
}

.list-state {
  padding: 28rpx 0 8rpx;
  color: #aaaaaa;
  font-size: 23rpx;
  text-align: center;
}

.retry {
  color: #d92d20;
}
</style>

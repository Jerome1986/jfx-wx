<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getAppointmentListApi } from '@/api/appointment'
import { appointmentStatusText, appointmentTypeText } from '@/stores/modules/renovation-business'
import type { Appointment, AppointmentType } from '@/types/renovation-business'
import { getAppointmentSummary } from '@/utils/appointment'
import { formatDateTime, maskMobile } from '@/utils/format'

// 每页加载数量
const PAGE_SIZE = 10
type Group = 'all' | 'budget' | 'measure' | 'plan' | 'consult'
type AppointmentQueryType = AppointmentType | 'ALL'
// 预约类型分组配置
const groups: Array<{ label: string; value: Group; types: AppointmentQueryType[] }> = [
  { label: '全部', value: 'all', types: ['ALL'] },
  { label: '预算报价', value: 'budget', types: ['BUDGET', 'QUOTE'] },
  { label: '量房服务', value: 'measure', types: ['MEASURE'] },
  { label: '焕新服务', value: 'plan', types: ['PLAN'] },
  { label: '咨询服务', value: 'consult', types: ['CASE', 'OUTLET'] },
]
// 当前选中的预约分组
const activeGroup = ref<Group>('all')
// 已加载的预约列表
const appointments = ref<Appointment[]>([])
// 当前页码
const pageNum = ref(1)
// 总页数
const totalPage = ref(0)
// 当前分组的预约总数
const total = ref(0)
// 列表加载状态
const loading = ref(false)
// 列表加载失败状态
const loadFailed = ref(false)
// 是否还有下一页
const hasMore = computed(() => pageNum.value < totalPage.value)
// 当前分组对应的接口预约类型
const activeTypes = computed<AppointmentQueryType[]>(
  () => groups.find(({ value }) => value === activeGroup.value)?.types ?? ['ALL'],
)
// 获取预约状态对应的样式类名
const statusClass = (status: Appointment['status']) => status.toLowerCase().replace('_', '-')
// 获取预约摘要
const summary = (item: Appointment) => getAppointmentSummary(item, appointmentTypeText[item.type])
// 打开预约详情页
const openDetail = (item: Appointment) =>
  uni.navigateTo({
    url: `/pages-sub/my/decorationOrderDetail/decorationOrderDetail?id=${item.id}`,
  })

// 分页加载当前分组的预约数据
const loadAppointments = async (reset = false) => {
  if (loading.value || (!reset && !hasMore.value)) return

  const nextPage = reset ? 1 : pageNum.value + 1
  loading.value = true
  loadFailed.value = false

  try {
    const pages = await Promise.all(
      activeTypes.value.map(async (type) => {
        const { data } = await getAppointmentListApi({
          pageNum: nextPage,
          pageSize: PAGE_SIZE,
          type,
        })
        return data
      }),
    )

    const pageItems = pages.flatMap(({ list }) => list)
    appointments.value = reset ? pageItems : [...appointments.value, ...pageItems]
    pageNum.value = nextPage
    totalPage.value = Math.max(0, ...pages.map((page) => page.totalPage))
    total.value = pages.reduce((sum, page) => sum + page.total, 0)
  } catch (error) {
    console.error('获取焕新预约列表失败：', error)
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

// 切换预约分组并重新加载列表
const selectGroup = (group: Group) => {
  if (activeGroup.value === group || loading.value) return
  activeGroup.value = group
  // 保留现有内容，待新数据返回后整体替换，避免滚动容器高度骤变
  loadAppointments(true)
}

// 避免首次进入页面时 onLoad 与 onShow 重复请求
const loaded = ref(false)
onLoad((query) => {
  // 页面参数指定的初始分组
  const group = query?.group as Group | undefined
  if (groups.some((item) => item.value === group)) activeGroup.value = group!
  loadAppointments(true).finally(() => {
    loaded.value = true
  })
})

// 从详情页取消预约后，返回列表时同步最新状态
onShow(() => {
  if (loaded.value) loadAppointments(true)
})
</script>

<template>
  <view class="page">
    <view class="content">
      <view class="summary-card">
        <view class="summary-title">预约管理</view>
        <view class="summary-tip">统一查看预算、量房、焕新方案和咨询服务的预约进度</view>
        <view class="summary-count">当前分类共 {{ total }} 条预约</view>
      </view>
      <scroll-view class="tabs" scroll-x :show-scrollbar="false">
        <view class="tab-row">
          <view
            v-for="item in groups"
            :key="item.value"
            class="tab"
            :class="{ active: activeGroup === item.value }"
            @click.stop="selectGroup(item.value)"
          >
            {{ item.label }}
          </view>
        </view>
      </scroll-view>
      <view class="count">共 {{ total }} 条预约</view>
      <scroll-view
        class="list-scroll"
        scroll-y
        :show-scrollbar="false"
        lower-threshold="120"
        @scrolltolower="loadAppointments()"
      >
        <view class="list-shell">
          <view v-if="appointments.length" class="list">
            <view
              v-for="item in appointments"
              :key="item.id"
              class="card"
              :class="`card-${statusClass(item.status)}`"
              @click="openDetail(item)"
            >
              <view class="heading">
                <view>
                  <view class="title">{{ appointmentTypeText[item.type] }}</view>
                  <view class="source">来源：{{ item.source }}</view> </view
                ><text class="status" :class="statusClass(item.status)">{{
                  appointmentStatusText[item.status]
                }}</text>
              </view>
              <view class="divider" />
              <view class="line"
                ><text>预约内容：</text><text>{{ summary(item) }}</text></view
              >
              <view class="line"
                ><text>预约编号：</text><text>{{ item.appointmentNo }}</text></view
              >
              <view class="line"
                ><text>提交时间：</text
                ><text>{{ formatDateTime(item.createdAt, '待确认') }}</text></view
              >
              <view class="line"
                ><text>联系方式：</text><text>{{ maskMobile(item.mobile, '暂未填写') }}</text></view
              >
              <view v-if="item.status === 'PENDING_VISIT'" class="visit"
                ><text>上门安排：</text
                ><text>{{
                  [item.visitDate, item.timeSlot].filter(Boolean).join(' ') || '待确认'
                }}</text></view
              >
            </view>
            <view v-if="loading" class="list-state">正在加载...</view>
            <view v-else-if="loadFailed" class="list-state retry" @click="loadAppointments()"
              >加载失败，点击重试</view
            >
            <view v-else-if="!hasMore" class="list-state">没有更多了</view>
          </view>
          <view v-else-if="loading" class="empty">正在加载预约...</view>
          <view v-else-if="loadFailed" class="empty retry" @click="loadAppointments(true)"
            >加载失败，点击重试</view
          >
          <view v-else class="empty">暂无相关预约</view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss">
.page {
  height: 100vh;
  overflow: hidden;
  background: #f8f7f5;
}

.content {
  display: flex;
  box-sizing: border-box;
  height: 100%;
  padding: 24rpx 24rpx 0;
  flex-direction: column;
  overflow: hidden;
}

.list-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.list-shell {
  padding-bottom: calc(60rpx + env(safe-area-inset-bottom));
}

.summary-card,
.card {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(57, 45, 34, 0.045);
}

.summary-card {
  padding: 28rpx;
}

.summary-title {
  font-size: 34rpx;
  font-weight: 700;
}

.summary-tip {
  margin-top: 10rpx;
  color: #777;
  font-size: 24rpx;
}

.summary-count {
  margin-top: 20rpx;
  color: #a9704d;
  font-weight: 600;
}

.tabs {
  flex: none;
  height: 66rpx;
  margin-top: 24rpx;
  white-space: nowrap;
}

.tab-row {
  display: inline-flex;
  gap: 12rpx;
}

.tab {
  padding: 16rpx 26rpx;
  color: #666;
  background: #fff;
  border-radius: 30rpx;
  font-size: 24rpx;
}

.tab.active {
  color: #fff;
  background: #d92d20;
}

.count {
  margin: 24rpx 4rpx 16rpx;
  color: #999;
  font-size: 24rpx;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.card {
  position: relative;
  overflow: hidden;
  padding: 26rpx 24rpx 24rpx;
  border-left: 4rpx solid #d92d20;
}

.card-pending-visit {
  border-left-color: #bd7411;
}

.card-completed,
.card-canceled {
  border-left-color: #70706f;
}

.heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.title {
  color: #222;
  font-size: 31rpx;
  font-weight: 650;
  line-height: 44rpx;
}

.source {
  margin-top: 5rpx;
  color: #999;
  font-size: 23rpx;
  line-height: 34rpx;
}

.status {
  flex-shrink: 0;
  margin-left: 20rpx;
  padding: 9rpx 20rpx;
  color: #df2c21;
  background: #fff0ef;
  border-radius: 30rpx;
  font-size: 23rpx;
  font-weight: 600;
  line-height: 32rpx;
}

.status.pending-visit {
  color: #b96e0a;
  background: #fff3df;
}

.status.completed,
.status.canceled {
  color: #666;
  background: #f1f0ef;
}

.divider {
  height: 1rpx;
  margin: 20rpx 0 16rpx;
  background: #ededed;
}

.line,
.visit {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding-left: 28rpx;
  color: #6f6f6f;
  font-size: 24rpx;
  line-height: 38rpx;
}

.line + .line,
.visit {
  margin-top: 8rpx;
}

.line::before,
.visit::before {
  position: absolute;
  top: 14rpx;
  left: 0;
  width: 10rpx;
  height: 10rpx;
  background: #d9a77c;
  border-radius: 50%;
  content: '';
}

.line text:first-child,
.visit text:first-child {
  flex-shrink: 0;
}

.line text:last-child,
.visit text:last-child {
  min-width: 0;
  color: #333;
  word-break: break-all;
}

.visit {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #ededed;
}

.visit::before {
  top: 30rpx;
}

.empty {
  padding: 120rpx 0;
  color: #aaa;
  text-align: center;
}

.list-state {
  padding: 28rpx 0 8rpx;
  color: #aaa;
  font-size: 23rpx;
  text-align: center;
}

.retry {
  color: #d92d20;
}
</style>

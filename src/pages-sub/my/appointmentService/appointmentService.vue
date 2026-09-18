<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getAssignedAppointmentListApi } from '@/api/appointment'
import { useMemberStore } from '@/stores'
import { appointmentStatusText, appointmentTypeText } from '@/stores/modules/renovation-business'
import type { Appointment, AppointmentStatus, AppointmentType } from '@/types/renovation-business'
import { getAppointmentSummary } from '@/utils/appointment'
import { formatDateTime } from '@/utils/format'
type Filter = 'all' | AppointmentStatus
// 预约状态筛选项
const filters: Array<{ label: string; value: Filter }> = [
  { label: '全部', value: 'all' },
  { label: '待联系', value: 'PENDING_CONTACT' },
  { label: '待上门', value: 'PENDING_VISIT' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELED' },
]
// 当前预约状态筛选项
const active = ref<Filter>('all')
// 会员状态仓库
const memberStore = useMemberStore()
// 分配给当前员工的预约列表
const appointments = ref<Appointment[]>([])
// 当前预约类型筛选项
const activeType = ref<AppointmentType | 'ALL'>('ALL')
// 预约类型筛选选项
const types: Array<{ label: string; value: AppointmentType | 'ALL' }> = [
  { label: '全部类型', value: 'ALL' },
  { label: appointmentTypeText.BUDGET, value: 'BUDGET' },
  // { label: appointmentTypeText.MEASURE, value: 'MEASURE' }, // 免费量房
  { label: appointmentTypeText.QUOTE, value: 'QUOTE' },
  { label: appointmentTypeText.PLAN, value: 'PLAN' },
  { label: appointmentTypeText.CASE, value: 'CASE' },
  // { label: appointmentTypeText.OUTLET, value: 'OUTLET' }, // 网点咨询
]
// 当前预约页码
const pageNum = ref(0)
// 预约总数量
const total = ref(0)
// 预约总页数
const totalPage = ref(0)
// 预约加载状态
const loading = ref(false)
// 预约加载失败状态
const loadFailed = ref(false)
// 是否还有下一页预约
const hasMore = computed(() => pageNum.value < totalPage.value)
// 后端按类型和状态筛选后的分页列表。
const list = computed(() => appointments.value)
// 接口未提供状态统计，统计范围仅限已加载预约
const count = (status: AppointmentStatus) =>
  appointments.value.filter((item) => item.status === status).length

// 加载员工预约列表
const loadAppointments = async (reset = false) => {
  if (loading.value || (!reset && !hasMore.value)) return
  const userId = Number(memberStore.profile?.id)
  if (!Number.isInteger(userId) || userId <= 0) {
    appointments.value = []
    total.value = 0
    pageNum.value = 0
    totalPage.value = 0
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  const nextPage = reset ? 1 : pageNum.value + 1
  loading.value = true
  loadFailed.value = false
  if (reset) {
    appointments.value = []
    pageNum.value = 0
    total.value = 0
    totalPage.value = 0
  }
  try {
    const { data } = await getAssignedAppointmentListApi({
      userId,
      pageNum: nextPage,
      pageSize: 10,
      type: activeType.value,
      status: active.value === 'all' ? 'ALL' : active.value,
    })
    appointments.value = [
      ...new Map([...appointments.value, ...data.list].map((item) => [item.id, item])).values(),
    ]
    pageNum.value = nextPage
    total.value = data.total
    totalPage.value = data.totalPage
  } catch (error) {
    console.error('获取员工预约列表失败：', error)
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

// 切换预约状态时重新请求第一页。
const selectStatus = (status: Filter) => {
  if (loading.value || active.value === status) return
  active.value = status
  return loadAppointments(true)
}
// 切换预约类型筛选，保留当前状态条件。
const selectType = (type: AppointmentType | 'ALL') => {
  if (loading.value || activeType.value === type) return
  activeType.value = type
  loadAppointments(true)
}
// 获取预约摘要
const summary = (item: Appointment) => getAppointmentSummary(item, appointmentTypeText[item.type])
// 打开预约详情页
const openDetail = (id: number) =>
  uni.navigateTo({
    url: `/pages-sub/my/houseQuoteAppointmentDetail/houseQuoteAppointmentDetail?id=${id}`,
  })
onLoad((query) => {
  // 页面参数指定的初始筛选状态
  const status = query?.status as Filter | undefined
  if (filters.some((item) => item.value === status)) active.value = status!
  const type = query?.type
  if (types.some((item) => item.value === type)) activeType.value = type as AppointmentType | 'ALL'
})
onShow(() => loadAppointments(true))
</script>
<template>
  <view class="page"
    ><scroll-view class="scroll" scroll-y @scrolltolower="loadAppointments()" :lower-threshold="120"
      ><view class="content">
        <view class="overview"
          ><view class="title">预约线索跟进</view
          ><view class="tip">统一处理预算、量房、方案、案例和网点咨询</view
          ><view class="tip">以下状态数量仅统计当前筛选结果中已加载的预约</view
          ><view class="stats"
            ><view
              ><text class="stats-value">{{ count('PENDING_CONTACT') }}</text
              ><text>待联系</text></view
            ><view
              ><text class="stats-value">{{ count('PENDING_VISIT') }}</text
              ><text>待上门</text></view
            ><view
              ><text class="stats-value">{{ count('COMPLETED') }}</text
              ><text>已完成</text></view
            ></view
          ></view
        >
        <scroll-view class="tabs" scroll-x>
          <view class="tab-row">
            <view
              v-for="item in types"
              :key="item.value"
              class="tab"
              :class="{ active: activeType === item.value }"
              @click="selectType(item.value)"
            >
              {{ item.label }}
            </view>
          </view>
        </scroll-view>
        <scroll-view class="tabs" scroll-x
          ><view class="tab-row"
            ><view
              v-for="item in filters"
              :key="item.value"
              class="tab"
              :class="{ active: active === item.value }"
              @click="selectStatus(item.value)"
              >{{ item.label }}</view
            ></view
          ></scroll-view
        >
        <view class="count">当前筛选共 {{ total }} 条，已加载 {{ appointments.length }} 条</view>
        <view class="list"
          ><view v-for="item in list" :key="item.id" class="card" @click="openDetail(item.id)">
            <view class="heading"
              ><view
                ><view class="card-title">{{ appointmentTypeText[item.type] }}</view
                ><view class="source">{{ item.source }} · {{ item.appointmentNo }}</view></view
              ><view class="status" :class="`status--${item.status}`"
                ><text>{{ appointmentStatusText[item.status] }}</text></view
              ></view
            >
            <view class="line"
              ><text>客户</text><text>{{ item.customerName }} {{ item.mobile }}</text></view
            ><view class="line"
              ><text>需求</text><text>{{ summary(item) }}</text></view
            ><view class="line"
              ><text>更新时间</text><text>{{ formatDateTime(item.updatedAt) }}</text></view
            >
          </view></view
        >
        <view v-if="loading" class="load-state">加载中...</view>
        <view v-else-if="loadFailed" class="load-state" @click="loadAppointments(pageNum === 0)"
          >加载失败，点击重试</view
        >
        <template v-else>
          <view v-if="!list.length" class="load-state">暂无符合条件的预约</view>
          <view v-if="hasMore" class="load-state" @click="loadAppointments()">点击加载更多</view>
          <view v-else-if="list.length" class="load-state">已加载全部预约</view>
        </template>
      </view></scroll-view
    ></view
  >
</template>
<style lang="scss">
.page,
.scroll {
  height: 100vh;
  background: #f8f7f5;
}
.load-state {
  padding: 30rpx 0;
  color: #888;
  font-size: 24rpx;
  text-align: center;
}
.content {
  padding: 24rpx;
}
.overview,
.card {
  background: #fff;
  border-radius: 18rpx;
}
.overview {
  padding: 28rpx;
}
.title {
  font-size: 34rpx;
  font-weight: 700;
}
.tip {
  margin-top: 8rpx;
  color: #888;
  font-size: 24rpx;
}
.stats {
  display: flex;
  margin-top: 26rpx;
}
.stats view {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
}
.stats .stats-value {
  color: #d92d20;
  font-size: 36rpx;
  font-weight: 700;
}
.stats text {
  margin-top: 6rpx;
  color: #777;
  font-size: 22rpx;
}
.tabs {
  height: 50rpx;
  margin-top: 16rpx;
  flex: none;
  white-space: nowrap;
}
.tab-row {
  display: inline-flex;
  height: 50rpx;
  align-items: center;
  gap: 8rpx;
}
.tab {
  box-sizing: border-box;
  height: 46rpx;
  padding: 0 18rpx;
  line-height: 46rpx;
  background: #fff;
  border-radius: 23rpx;
  font-size: 22rpx;
}
.tab.active {
  color: #fff;
  background: #d92d20;
}
.count {
  margin: 22rpx 4rpx 14rpx;
  color: #888;
  font-size: 24rpx;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.card {
  padding: 24rpx;
}
.heading,
.line {
  display: flex;
  justify-content: space-between;
}
.card-title {
  font-size: 30rpx;
  font-weight: 650;
}
.source {
  margin-top: 6rpx;
  color: #999;
  font-size: 21rpx;
}
.status {
  flex-shrink: 0;
  align-self: flex-start;
  margin-left: 16rpx;
  padding: 6rpx 16rpx;
  color: #667085;
  background: #f2f4f7;
  border-radius: 8rpx;
  font-size: 23rpx;
  line-height: 1.5;
  white-space: nowrap;
  &--PENDING_CONTACT {
    color: #b54708;
    background: #fffaeb;
  }
  &--PENDING_VISIT {
    color: #175cd3;
    background: #eff8ff;
  }
  &--COMPLETED {
    color: #067647;
    background: #ecfdf3;
  }
  &--CANCELED {
    color: #667085;
    background: #f2f4f7;
  }
}
.line {
  margin-top: 18rpx;
  color: #777;
  font-size: 24rpx;
}
.line text:last-child {
  max-width: 72%;
  color: #333;
  text-align: right;
}
</style>

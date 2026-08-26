<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  appointmentStatusText,
  appointmentTypeText,
  useRenovationBusinessStore,
} from '@/stores/modules/renovation-business'
import type { Appointment, AppointmentStatus } from '@/types/renovation-business'
import { getAppointmentSummary } from '@/utils/appointment'
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
// 装修业务状态
const store = useRenovationBusinessStore()
// 当前筛选后的预约列表
const list = computed(() =>
  store.listAppointments(undefined, active.value === 'all' ? undefined : active.value),
)
// 统计指定状态的预约数量
const count = (status: AppointmentStatus) =>
  store.appointments.filter((item) => item.status === status).length
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
})
</script>
<template>
  <view class="page"
    ><scroll-view class="scroll" scroll-y
      ><view class="content">
        <view class="overview"
          ><view class="title">预约线索跟进</view
          ><view class="tip">统一处理预算、量房、方案、案例和网点咨询</view
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
        <scroll-view class="tabs" scroll-x
          ><view class="tab-row"
            ><view
              v-for="item in filters"
              :key="item.value"
              class="tab"
              :class="{ active: active === item.value }"
              @click="active = item.value"
              >{{ item.label }}</view
            ></view
          ></scroll-view
        >
        <view class="count">共 {{ list.length }} 条线索</view
        ><view class="list"
          ><view v-for="item in list" :key="item.id" class="card" @click="openDetail(item.id)">
            <view class="heading"
              ><view
                ><view class="card-title">{{ appointmentTypeText[item.type] }}</view
                ><view class="source">{{ item.source }} · {{ item.appointmentNo }}</view></view
              ><text class="status">{{ appointmentStatusText[item.status] }}</text></view
            >
            <view class="line"
              ><text>客户</text><text>{{ item.customerName }} {{ item.mobile }}</text></view
            ><view class="line"
              ><text>需求</text><text>{{ summary(item) }}</text></view
            ><view class="line"
              ><text>更新时间</text><text>{{ item.updatedAt }}</text></view
            >
          </view></view
        >
      </view></scroll-view
    ></view
  >
</template>
<style lang="scss">
.page,
.scroll {
  height: 100%;
  min-height: 100vh;
  background: #f8f7f5;
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
  margin-top: 22rpx;
  white-space: nowrap;
}
.tab-row {
  display: inline-flex;
  gap: 12rpx;
}
.tab {
  padding: 14rpx 24rpx;
  background: #fff;
  border-radius: 30rpx;
  font-size: 24rpx;
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
  color: #d92d20;
  font-size: 23rpx;
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

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

type OrderStatus = 'pending' | 'servicing' | 'completed'
type FilterStatus = 'all' | OrderStatus

interface EmployeeOrder {
  id: number
  status: OrderStatus
  title: string
  customer: string
  phone: string
  address: string
  progress: string
  updatedAt: string
  amount: number
}

const filters: Array<{ label: string; value: FilterStatus }> = [
  { label: '全部', value: 'all' },
  { label: '待确认', value: 'pending' },
  { label: '服务中', value: 'servicing' },
  { label: '已完成', value: 'completed' },
]

const statusText: Record<OrderStatus, string> = {
  pending: '待确认',
  servicing: '服务中',
  completed: '已完成',
}

const activeFilter = ref<FilterStatus>('all')
const orders: EmployeeOrder[] = [
  {
    id: 1,
    status: 'pending',
    title: '95m²老房厨房改造',
    customer: '张先生',
    phone: '138****5628',
    address: '武汉市洪山区珞瑜路88号',
    progress: '报价已发送，等待客户确认清单',
    updatedAt: '06月20日 16:20',
    amount: 14163,
  },
  {
    id: 2,
    status: 'pending',
    title: '82m²两居室局部焕新',
    customer: '李女士',
    phone: '156****2179',
    address: '武汉市武昌区中北路126号',
    progress: '方案已提交，等待客户确认报价',
    updatedAt: '06月19日 11:35',
    amount: 12860,
  },
  {
    id: 3,
    status: 'servicing',
    title: '95m²老房厨房改造',
    customer: '张先生',
    phone: '138****5628',
    address: '武汉市洪山区珞瑜路88号',
    progress: '施工安排推进中，待同步本周进展',
    updatedAt: '06月20日 16:20',
    amount: 14163,
  },
  {
    id: 4,
    status: 'completed',
    title: '95m²老房厨房改造',
    customer: '张先生',
    phone: '138****5628',
    address: '武汉市洪山区珞瑜路88号',
    progress: '当前项目已完成',
    updatedAt: '06月20日 16:20',
    amount: 14163,
  },
  {
    id: 5,
    status: 'servicing',
    title: '89m²两居室厨房改造',
    customer: '周女士',
    phone: '186****7342',
    address: '武汉市江岸区建设大道168号',
    progress: '施工安排推进中，待同步本周进展',
    updatedAt: '06月19日 14:30',
    amount: 16890,
  },
  {
    id: 6,
    status: 'completed',
    title: '72m²旧房厨卫翻新',
    customer: '刘先生',
    phone: '135****4816',
    address: '武汉市汉阳区芳草路56号',
    progress: '当前项目已完成',
    updatedAt: '06月18日 10:15',
    amount: 18520,
  },
]

const visibleOrders = computed(() =>
  activeFilter.value === 'all'
    ? orders
    : orders.filter((item) => item.status === activeFilter.value),
)

onLoad((query) => {
  const status = query?.status as FilterStatus | undefined
  if (filters.some((item) => item.value === status)) activeFilter.value = status!
})

const contactCustomer = () => uni.showToast({ title: '正在为您联系客户', icon: 'none' })
const primaryActionText = (status: OrderStatus) =>
  ({
    pending: '查看报价',
    servicing: '查看进度',
    completed: '查看详情',
  }[status])

const runPrimaryAction = (order: EmployeeOrder) => {
  openOrderDetail(order)
}

const openOrderDetail = (order: EmployeeOrder) =>
  uni.navigateTo({
    url: `/pages-sub/my/employeeRenovationOrderDetail/employeeRenovationOrderDetail?id=${order.id}&status=${order.status}`,
  })
</script>

<template>
  <view class="page">
    <scroll-view class="scroll" scroll-y :show-scrollbar="false">
      <view class="content">
        <view class="overview-card">
          <view class="overview-title">我的项目</view>
          <view class="overview-tip">跟进报价确认和服务进度，及时同步客户下一步</view>
          <view class="overview-grid">
            <view class="overview-item">
              <text class="overview-value pending-value">4</text>
              <text class="overview-label">待确认</text>
            </view>
            <view class="overview-divider" />
            <view class="overview-item">
              <text class="overview-value">6</text>
              <text class="overview-label">服务中</text>
            </view>
            <view class="overview-divider" />
            <view class="overview-item">
              <text class="overview-value">12</text>
              <text class="overview-label">已完成</text>
            </view>
          </view>
        </view>

        <view class="filter-row">
          <view
            v-for="item in filters"
            :key="item.value"
            class="filter-item"
            :class="{ active: activeFilter === item.value }"
            @click="activeFilter = item.value"
          >
            {{ item.label }}
          </view>
        </view>

        <view class="order-count">共{{ visibleOrders.length }}个项目</view>

        <view class="order-list">
          <view
            v-for="order in visibleOrders"
            :key="order.id"
            class="order-card"
            :class="`card-${order.status}`"
            @click="openOrderDetail(order)"
          >
            <view class="card-heading">
              <text class="order-title">{{ order.title }}</text>
              <text class="status-tag" :class="`tag-${order.status}`">{{
                statusText[order.status]
              }}</text>
            </view>
            <view class="divider" />
            <view class="customer-line"
              ><text class="meta-label">客户</text
              ><text>{{ order.customer }} {{ order.phone }}</text></view
            >
            <view class="customer-line"
              ><text class="meta-label">地址</text><text>{{ order.address }}</text></view
            >
            <view class="progress-box">
              <view class="progress-line"
                ><text class="progress-label">当前进度</text><text>{{ order.progress }}</text></view
              >
              <view class="progress-line"
                ><text class="progress-label">最近更新</text
                ><text>{{ order.updatedAt }}</text></view
              >
              <view class="amount-line"
                ><text>预估合计</text><text class="amount">¥{{ order.amount }}</text></view
              >
            </view>
            <view class="actions">
              <button class="contact-button" @click.stop="contactCustomer">联系客户</button>
              <button class="quote-button" @click.stop="runPrimaryAction(order)">
                {{ primaryActionText(order.status) }}
              </button>
            </view>
          </view>
          <view v-if="!visibleOrders.length" class="empty">暂无相关项目</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.page {
  height: 100vh;
  overflow: hidden;
  color: #242426;
  background: #f8f7f5;
}
.scroll {
  height: 100%;
}
.content {
  padding: 24rpx 24rpx calc(48rpx + env(safe-area-inset-bottom));
}
.overview-card {
  padding: 26rpx 24rpx 25rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 10rpx 28rpx rgba(57, 45, 34, 0.05);
}
.overview-title {
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}
.overview-tip {
  margin-top: 10rpx;
  color: #aaa;
  font-size: 24rpx;
  line-height: 34rpx;
}
.overview-grid {
  display: grid;
  margin-top: 22rpx;
  align-items: center;
  grid-template-columns: 1fr 2rpx 1fr 2rpx 1fr;
}
.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.overview-value {
  font-size: 27rpx;
  line-height: 38rpx;
}
.pending-value {
  color: #e72f25;
}
.overview-label {
  margin-top: 7rpx;
  color: #777;
  font-size: 25rpx;
  line-height: 35rpx;
}
.overview-divider {
  width: 2rpx;
  height: 26rpx;
  background: #eee;
}
.filter-row {
  display: flex;
  margin-top: 24rpx;
  gap: 24rpx;
}
.filter-item {
  display: flex;
  box-sizing: border-box;
  height: 52rpx;
  padding: 0 28rpx;
  align-items: center;
  justify-content: center;
  font-size: 25rpx;
  font-weight: 500;
  background: #fff;
  border: 2rpx solid transparent;
  border-radius: 9rpx;
}
.filter-item.active {
  color: #e52e24;
  border-color: #e52e24;
}
.order-count {
  margin-top: 26rpx;
  color: #777;
  font-size: 25rpx;
  line-height: 36rpx;
}
.order-list {
  margin-top: 24rpx;
}
.order-card {
  padding: 22rpx 24rpx 22rpx;
  background: #fff;
  border-left: 2rpx solid #e52e24;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(57, 45, 34, 0.05);
}
.order-card + .order-card {
  margin-top: 24rpx;
}
.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.order-title {
  font-size: 29rpx;
  font-weight: 500;
  line-height: 42rpx;
}
.status-tag {
  display: flex;
  height: 42rpx;
  padding: 0 20rpx;
  align-items: center;
  font-size: 23rpx;
  line-height: 42rpx;
  border-radius: 24rpx;
}
.tag-pending {
  color: #e52e24;
  background: #fff0ef;
}
.tag-servicing {
  color: #55a35d;
  background: #eef8ef;
}
.tag-completed {
  color: #777;
  background: #f3f2f0;
}
.divider {
  height: 2rpx;
  margin-top: 13rpx;
  background: #eee;
}
.customer-line {
  display: flex;
  margin-top: 14rpx;
  color: #777;
  font-size: 24rpx;
  line-height: 34rpx;
}
.customer-line + .customer-line {
  margin-top: 5rpx;
}
.meta-label {
  width: 74rpx;
  flex-shrink: 0;
  color: #aaa;
}
.progress-box {
  margin-top: 17rpx;
  padding: 15rpx 18rpx 17rpx;
  color: #777;
  font-size: 23rpx;
  background: #fbfaf8;
  border: 2rpx solid #eee;
  border-radius: 16rpx;
}
.progress-line {
  display: flex;
  line-height: 38rpx;
}
.progress-label {
  width: 118rpx;
  flex-shrink: 0;
  color: #aaa;
}
.amount-line {
  display: flex;
  margin-top: 7rpx;
  align-items: baseline;
  justify-content: flex-end;
  font-size: 25rpx;
}
.amount {
  margin-left: 17rpx;
  color: #e52e24;
  font-size: 30rpx;
}
.actions {
  display: flex;
  margin-top: 16rpx;
  justify-content: flex-end;
  gap: 24rpx;
}
.contact-button,
.quote-button {
  height: 46rpx;
  margin: 0;
  padding: 0 20rpx;
  font-size: 23rpx;
  line-height: 44rpx;
  border-radius: 24rpx;
}
.contact-button {
  color: #777;
  background: #fff;
  border: 2rpx solid #eee;
}
.quote-button {
  color: #fff;
  background: #e52e24;
  border: 2rpx solid #e52e24;
}
.contact-button::after,
.quote-button::after {
  border: 0;
}
.empty {
  padding: 160rpx 0;
  color: #aaa;
  font-size: 24rpx;
  text-align: center;
}
</style>

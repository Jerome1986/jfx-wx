<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAppointmentServiceStore } from '@/stores/modules/appointment-service'
import type { AppointmentServiceItem, AppointmentServiceStatus } from '@/types/appointment-service'

// 定义预约状态和预约数据结构
type Status = 'all' | AppointmentServiceStatus

// 配置页面可切换的预约状态
const tabs: { label: string; value: Status }[] = [
  { label: '全部', value: 'all' },
  { label: '待联系', value: 'contact' },
  { label: '待服务', value: 'service' },
  { label: '已完成', value: 'completed' },
]

// 管理当前筛选状态和预约服务数据
const activeStatus = ref<Status>('contact')
const appointmentStore = useAppointmentServiceStore()
appointmentStore.normalizeStatuses()
const { appointments } = storeToRefs(appointmentStore)

onLoad((options) => {
  const status = options?.status
  if (status === 'all' || status === 'contact' || status === 'service' || status === 'completed') {
    activeStatus.value = status
  }
})

// 根据选中状态筛选需要展示的预约列表
const visibleAppointments = computed(() =>
  activeStatus.value === 'all'
    ? appointments.value
    : appointments.value.filter((item) => item.status === activeStatus.value),
)

// 计算当前筛选项对应的待处理提示
const pendingText = computed(() => {
  return `共${visibleAppointments.value.length}条待处理`
})

const statusCount = (status: AppointmentServiceStatus) =>
  appointments.value.filter((item) => item.status === status).length

const summaryDescription = computed(() =>
  activeStatus.value === 'service'
    ? '已约好上门的预约，查看安排或意向时转装修订单'
    : '跟进报价确认和服务进度，及时同步客户下一步',
)

// 展示预约操作的临时反馈
const showAction = (message: string) => {
  uni.showToast({ title: message, icon: 'none' })
}

// 根据服务类型进入对应预约详情
const openDetail = (item: AppointmentServiceItem) => {
  const page =
    item.type === 'measure'
      ? `/pages-sub/my/freeMeasurementAppointmentDetail/freeMeasurementAppointmentDetail?id=${item.id}`
      : `/pages-sub/my/houseQuoteAppointmentDetail/houseQuoteAppointmentDetail?id=${item.id}`
  uni.navigateTo({ url: page })
}

const formatVisitDate = (date: string) => {
  const [, month, day] = date.split('-')
  return `${month}月${day}日`
}

const usesVisitInformation = (item: AppointmentServiceItem) =>
  item.status === 'service' || (item.type === 'measure' && item.status === 'completed')

const displayListTime = (item: AppointmentServiceItem) =>
  !usesVisitInformation(item)
    ? item.submitTime
    : `${formatVisitDate(item.visitDate)} ${item.visitTime}`

const showServiceStatus = (status: AppointmentServiceStatus) => {
  activeStatus.value = status
}

const statusLabel = (status: AppointmentServiceStatus) =>
  ({
    contact: '待联系',
    service: '待服务',
    completed: '已完成',
  }[status])

onMounted(() => uni.$on('appointment-status-changed', showServiceStatus))
onUnmounted(() => uni.$off('appointment-status-changed', showServiceStatus))
</script>

<template>
  <scroll-view class="appointment-page" scroll-y :show-scrollbar="false">
    <view class="page-content">
      <!-- 今日预约数据概览 -->
      <view class="summary-card">
        <view class="summary-title">今日预约跟进</view>
        <view class="summary-description">{{ summaryDescription }}</view>
        <view class="summary-grid">
          <view class="summary-item" @click="activeStatus = 'contact'">
            <text class="summary-value" :class="{ active: activeStatus === 'contact' }">{{
              statusCount('contact')
            }}</text>
            <text class="summary-label">待联系</text>
          </view>
          <view class="summary-item" @click="activeStatus = 'service'">
            <text class="summary-value" :class="{ active: activeStatus === 'service' }">{{
              statusCount('service')
            }}</text>
            <text class="summary-label">待上门</text>
          </view>
          <view class="summary-item" @click="activeStatus = 'completed'">
            <text class="summary-value" :class="{ active: activeStatus === 'completed' }">{{
              statusCount('completed')
            }}</text>
            <text class="summary-label">已完成</text>
          </view>
        </view>
      </view>

      <!-- 预约状态筛选栏 -->
      <view class="filter-tabs">
        <view
          v-for="tab in tabs"
          :key="tab.value"
          class="filter-tab"
          :class="{ active: activeStatus === tab.value }"
          @click="activeStatus = tab.value"
        >
          {{ tab.label }}
        </view>
      </view>

      <view class="pending-count">{{ pendingText }}</view>

      <!-- 当前状态下的预约服务列表 -->
      <view
        v-for="item in visibleAppointments"
        :key="item.id"
        class="appointment-card"
        @click="openDetail(item)"
      >
        <view class="card-top">
          <view>
            <view class="service-title">{{ item.title }}</view>
            <view class="service-source">预约来源:{{ item.source }}</view>
          </view>
          <view
            class="status-badge"
            :class="{ service: item.status === 'service', completed: item.status === 'completed' }"
          >
            {{ statusLabel(item.status) }}
          </view>
        </view>

        <view class="card-divider" />

        <view class="detail-row">
          <text class="detail-dot">•</text>
          <text class="detail-label">{{
            usesVisitInformation(item) ? '上门时间' : '提交时间'
          }}</text>
          <text class="detail-value">{{ displayListTime(item) }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-dot">•</text>
          <text class="detail-label">客户</text>
          <text class="detail-value">{{ item.customer }} {{ item.mobile }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-dot">•</text>
          <text class="detail-label">{{ usesVisitInformation(item) ? '上门地址' : '需求' }}</text>
          <text class="detail-value">{{
            usesVisitInformation(item) ? item.address : item.demand
          }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-dot">•</text>
          <text class="detail-label">{{
            usesVisitInformation(item) ? '服务内容' : '跟进重点'
          }}</text>
          <text class="detail-value">{{
            usesVisitInformation(item) ? item.serviceContent : item.focus
          }}</text>
        </view>

        <view class="card-actions">
          <button
            v-if="item.status !== 'completed'"
            class="action-button feedback"
            @click.stop="
              item.status === 'service' ? showAction('请选择新的上门时间') : openDetail(item)
            "
          >
            {{ item.status === 'service' ? '调整时间' : '跟进反馈' }}
          </button>
          <button
            class="action-button contact"
            @click.stop="
              item.status === 'contact' ? showAction('请通过客户资料联系客户') : openDetail(item)
            "
          >
            {{ item.status === 'contact' ? '立即联系' : '查看详情' }}
          </button>
        </view>
      </view>

      <!-- 无预约数据时的空状态 -->
      <view v-if="visibleAppointments.length === 0" class="empty-state">暂无相关预约</view>
      <view class="bottom-space" />
    </view>
  </scroll-view>
</template>

<style lang="scss">
// 页面基础布局与背景
.appointment-page {
  height: 100%;
  color: #242424;
  background: #f8f7f5;
}

.page-content {
  padding: 24rpx;
}

// 顶部预约数据概览卡片
.summary-card {
  box-sizing: border-box;
  height: 216rpx;
  padding: 26rpx 24rpx 20rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 26rpx rgba(70, 53, 39, 0.04);
}

.summary-title {
  font-size: 29rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.summary-description {
  margin-top: 10rpx;
  color: #999;
  font-size: 24rpx;
  line-height: 34rpx;
}

.summary-grid {
  display: grid;
  margin-top: 20rpx;
  grid-template-columns: repeat(3, 1fr);
}

.summary-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-item + .summary-item::before {
  position: absolute;
  top: 20rpx;
  left: 0;
  width: 2rpx;
  height: 26rpx;
  background: #eee;
  content: '';
}

.summary-value {
  font-size: 26rpx;
  line-height: 34rpx;
}

.summary-value.active {
  color: #e52d24;
}

.summary-label {
  margin-top: 6rpx;
  color: #666;
  font-size: 25rpx;
  font-weight: 500;
  line-height: 36rpx;
}

// 预约状态筛选标签
.filter-tabs {
  display: flex;
  margin-top: 18rpx;
  gap: 24rpx;
}

.filter-tab {
  box-sizing: border-box;
  display: flex;
  min-width: 106rpx;
  height: 52rpx;
  padding: 0 18rpx;
  justify-content: center;
  align-items: center;
  font-size: 25rpx;
  font-weight: 500;
  background: #fff;
  border: 2rpx solid transparent;
  border-radius: 9rpx;
}

.filter-tab.active {
  color: #e52d24;
  border-color: #e52d24;
}

.pending-count {
  margin: 24rpx 0 18rpx;
  color: #666;
  font-size: 26rpx;
  font-weight: 500;
  line-height: 38rpx;
}

// 预约服务信息卡片
.appointment-card {
  box-sizing: border-box;
  margin-bottom: 18rpx;
  padding: 24rpx 24rpx 22rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 26rpx rgba(70, 53, 39, 0.04);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.service-title {
  font-size: 29rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.service-source {
  margin-top: 10rpx;
  color: #777;
  font-size: 24rpx;
  line-height: 34rpx;
}

.status-badge {
  height: 44rpx;
  padding: 0 20rpx;
  color: #e52d24;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 44rpx;
  background: #fff0ef;
  border-radius: 24rpx;
}

.status-badge.service {
  color: #d38a3c;
  background: #fff4e8;
}

.status-badge.completed {
  color: #888;
  background: #f3f3f3;
}

.card-divider {
  height: 2rpx;
  margin: 17rpx 0 16rpx;
  background: #eee;
}

// 预约详情字段行
.detail-row {
  display: flex;
  min-height: 40rpx;
  align-items: flex-start;
  font-size: 24rpx;
  line-height: 36rpx;
}

.detail-dot {
  width: 18rpx;
  flex-shrink: 0;
  color: #dfb18d;
  font-size: 29rpx;
}

.detail-label {
  width: 112rpx;
  flex-shrink: 0;
  color: #777;
}

.detail-value {
  flex: 1;
  color: #252525;
}

// 卡片底部操作按钮
.card-actions {
  display: flex;
  margin-top: 16rpx;
  justify-content: flex-end;
  gap: 20rpx;
}

.action-button {
  box-sizing: border-box;
  height: 50rpx;
  margin: 0;
  padding: 0 18rpx;
  font-size: 23rpx;
  line-height: 46rpx;
  border-radius: 27rpx;
}

.action-button::after {
  border: 0;
}

.action-button.feedback {
  color: #777;
  background: #fff;
  border: 2rpx solid #eee;
}

.action-button.contact {
  color: #fff;
  background: #e52d24;
  border: 2rpx solid #e52d24;
}

// 列表空状态
.empty-state {
  padding: 120rpx 0;
  color: #999;
  font-size: 25rpx;
  text-align: center;
}

.bottom-space {
  height: calc(32rpx + env(safe-area-inset-bottom));
}
</style>

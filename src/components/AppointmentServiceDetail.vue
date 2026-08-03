<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAddressStore } from '@/stores/modules/address'
import { useAppointmentServiceStore } from '@/stores/modules/appointment-service'

const props = defineProps<{ appointmentId: number }>()

const appointmentStore = useAppointmentServiceStore()
appointmentStore.normalizeStatuses()
const appointment = computed(
  () => appointmentStore.getAppointment(props.appointmentId) ?? appointmentStore.appointments[0]!,
)
const isService = computed(() => appointment.value.status === 'service')
const isCompleted = computed(() => appointment.value.status === 'completed')
const isQuoteContact = computed(
  () => appointment.value.type === 'quote' && appointment.value.status === 'contact',
)
const hasSchedule = computed(
  () =>
    appointment.value.status === 'service' ||
    (appointment.value.type === 'measure' && isCompleted.value),
)

const addressStore = useAddressStore()
const { selectedAddress } = storeToRefs(addressStore)
const timeOptions = ['09:00-11:00', '14:00-16:00', '16:00-18:00']
const visitDate = ref('')
const dateValue = ref(Date.now())
const datePickerVisible = ref(false)
const timeIndex = ref(0)
const timeValue = ref<string[]>([])
const timePickerVisible = ref(false)
const visitAddress = ref('')
const communicationRecord = ref('')
const submitting = ref(false)
const choosingAddress = ref(false)

watch(
  () => props.appointmentId,
  () => {
    const item = appointment.value
    visitDate.value = item.visitDate
    dateValue.value = new Date(`${item.visitDate}T00:00:00`).getTime()
    timeIndex.value = Math.max(0, timeOptions.indexOf(item.visitTime))
    timeValue.value = [timeOptions[timeIndex.value]]
    visitAddress.value =
      item.address ||
      (selectedAddress.value
        ? `${selectedAddress.value.address}${selectedAddress.value.doorplate || ''}`
        : '')
    communicationRecord.value = item.communicationRecord
  },
  { immediate: true },
)

const displayDate = computed(() => {
  const [, month, day] = visitDate.value.split('-')
  return `${month}月${day}日`
})
const displayAddress = computed(() => visitAddress.value || '请选择上门地址')
const overviewSummary = computed(() =>
  hasSchedule.value
    ? isCompleted.value
      ? '本次上门服务已完成'
      : '客户已确认上门安排'
    : appointment.value.type === 'measure'
    ? '客户预约免费量房，联系后确认上门时间'
    : '客户提交房屋信息，联系后确认报价需求',
)
const overviewSource = computed(() =>
  isService.value && appointment.value.type === 'measure'
    ? '首页装修预算计算器'
    : appointment.value.source,
)
const statusDescription = computed(() =>
  isService.value
    ? appointment.value.type === 'measure'
      ? '点击量房完毕，结束当前服务'
      : '点击服务完成，结束当前服务'
    : isCompleted.value
    ? '当前服务已结束，可返回预约服务查看记录'
    : isQuoteContact.value
    ? '完成客户报价沟通后，点击报价完成结束当前服务'
    : '确定时间和地址后，可确认安排上门并进入待服务状态',
)
const actionText = computed(() =>
  isService.value
    ? appointment.value.type === 'measure'
      ? '量房完毕'
      : '服务完成'
    : isCompleted.value
    ? '服务已完成'
    : isQuoteContact.value
    ? '报价完成'
    : '确认并转待服务',
)

onShow(() => {
  if (!choosingAddress.value) return
  choosingAddress.value = false
  const address = selectedAddress.value
  if (address) visitAddress.value = `${address.address}${address.doorplate || ''}`
})

const changeDate = (event: any) => {
  const date = new Date(Number(event.value))
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  visitDate.value = `${date.getFullYear()}-${month}-${day}`
}
const openDatePicker = () => {
  dateValue.value = new Date(`${visitDate.value}T00:00:00`).getTime()
  datePickerVisible.value = true
}
const openTimePicker = () => {
  timeValue.value = [timeOptions[timeIndex.value]]
  timePickerVisible.value = true
}
const changeTime = (event: { value: string[] }) => {
  const nextIndex = timeOptions.indexOf(event.value[0])
  if (nextIndex >= 0) timeIndex.value = nextIndex
}
const chooseAddress = () => {
  choosingAddress.value = true
  uni.navigateTo({ url: '/pages-sub/my/address/address' })
}
const contactCustomer = () => {
  uni.showModal({
    title: '联系客户',
    content: `即将拨打 ${appointment.value.customer} 的电话`,
    confirmText: '拨打',
    confirmColor: '#D92D20',
    success: ({ confirm }) => {
      if (confirm) uni.makePhoneCall({ phoneNumber: appointment.value.phoneNumber })
    },
  })
}
const confirmAppointment = () => {
  if (submitting.value || isCompleted.value) return
  if (!isQuoteContact.value && !visitDate.value) {
    uni.showToast({ title: '请选择上门日期', icon: 'none' })
    return
  }
  if (!isQuoteContact.value && !timeOptions[timeIndex.value]) {
    uni.showToast({ title: '请选择上门时间', icon: 'none' })
    return
  }
  if (!isQuoteContact.value && !visitAddress.value) {
    uni.showToast({ title: '请先选择上门地址', icon: 'none' })
    return
  }

  const modalContent = isQuoteContact.value
    ? '确认已完成本次客户报价沟通？完成后预约将进入已完成状态。'
    : isService.value
    ? `确认本次${appointment.value.type === 'measure' ? '量房' : '上门'}服务已经完成？`
    : `上门时间：${displayDate.value} ${timeOptions[timeIndex.value]}\n上门地址：${
        visitAddress.value
      }`

  uni.showModal({
    title: isQuoteContact.value
      ? '确认报价完成'
      : isService.value
      ? appointment.value.type === 'measure'
        ? '确认量房完毕'
        : '确认服务完成'
      : '确认转为待服务',
    content: modalContent,
    confirmText: '确认',
    confirmColor: '#D92D20',
    success: ({ confirm }) => {
      if (!confirm || submitting.value) return
      submitting.value = true
      const wasService = isService.value
      const wasQuoteContact = isQuoteContact.value
      const success = wasQuoteContact
        ? appointmentStore.completeQuote(appointment.value.id)
        : wasService
        ? appointmentStore.completeService(appointment.value.id)
        : appointmentStore.confirmService(appointment.value.id, {
            visitDate: visitDate.value,
            visitTime: timeOptions[timeIndex.value],
            address: visitAddress.value,
            communicationRecord: communicationRecord.value.trim(),
          })

      if (!success) {
        submitting.value = false
        uni.showToast({ title: '预约状态已变化，请返回刷新', icon: 'none' })
        return
      }

      const nextStatus = wasService || wasQuoteContact ? 'completed' : 'service'
      uni.$emit('appointment-status-changed', nextStatus)
      uni.showToast({
        title: wasQuoteContact
          ? '报价服务已完成'
          : wasService
          ? appointment.value.type === 'measure'
            ? '量房服务已完成'
            : '服务已完成'
          : '已转为待服务',
        icon: 'success',
      })
      setTimeout(() => uni.navigateBack(), 500)
    },
  })
}
</script>

<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="detail-content" :class="{ 'service-state': hasSchedule }">
        <view class="card overview-card">
          <view class="overview-accent" />
          <view class="overview-heading">
            <view>
              <view class="service-name">{{ appointment.title }}</view>
              <view class="service-summary">{{ overviewSummary }}</view>
            </view>
            <view class="status-pill" :class="{ service: isService, completed: isCompleted }">
              {{ isCompleted ? '已完成' : isService ? '待服务' : '待联系' }}
            </view>
          </view>
          <view class="customer-line">
            <view class="overview-fields">
              <view class="overview-row"
                ><text>客户</text
                ><text>{{ appointment.customer }} {{ appointment.mobile }}</text></view
              >
              <view class="overview-row"
                ><text>预约来源</text><text>{{ overviewSource }}</text></view
              >
              <view class="overview-row"
                ><text>提交时间</text><text>{{ appointment.submitTime }}</text></view
              >
            </view>
            <view class="phone-button" @click="contactCustomer">
              <text class="iconfont icon-dianhua phone-icon" />
            </view>
          </view>
        </view>

        <view class="card section-card appointment-info-card">
          <view class="section-title">预约信息</view>
          <view v-for="row in appointment.info" :key="row.label" class="info-row">
            <text class="row-label">{{ row.label }}</text>
            <text class="row-value">{{ row.value }}</text>
          </view>
        </view>

        <view v-if="appointment.type === 'measure'" class="card section-card arrange-card">
          <view class="section-title">上门安排</view>
          <view class="info-row action-row" @click="openDatePicker">
            <text class="row-label">上门日期</text><text class="row-value">{{ displayDate }}</text
            ><text class="row-action">修改</text>
          </view>
          <view class="info-row action-row" @click="openTimePicker">
            <text class="row-label">上门时间</text
            ><text class="row-value">{{ timeOptions[timeIndex] }}</text
            ><text class="row-action">修改</text>
          </view>
          <view class="info-row action-row" @click="chooseAddress">
            <text class="row-label">上门地址</text
            ><text class="row-value address-value">{{ displayAddress }}</text
            ><text class="row-action">选择地址</text>
          </view>
          <view class="info-row">
            <text class="row-label">服务内容</text
            ><text class="row-value">{{ appointment.serviceContent }}</text>
          </view>
        </view>

        <view class="card section-card record-card">
          <view class="section-title">本次沟通记录</view>
          <view class="textarea-wrap">
            <textarea
              v-model="communicationRecord"
              class="record-textarea"
              maxlength="100"
              placeholder="请输入本次沟通记录"
            />
            <text class="record-count">{{ communicationRecord.length }}/100</text>
          </view>
        </view>

        <view class="card section-card status-card">
          <view class="section-title">状态说明</view>
          <view class="status-description">{{ statusDescription }}</view>
        </view>
      </view>
    </scroll-view>

    <wd-datetime-picker
      v-model="dateValue"
      v-model:visible="datePickerVisible"
      type="date"
      title="选择上门日期"
      :min-date="new Date(2025, 0, 1).getTime()"
      :max-date="new Date(2035, 11, 31).getTime()"
      confirm-button-text="确定"
      custom-style="--wot-datetime-picker-action-color: #D92D20;"
      @confirm="changeDate"
    />

    <wd-picker
      v-model="timeValue"
      v-model:visible="timePickerVisible"
      title="选择上门时间"
      :columns="timeOptions"
      confirm-button-text="确定"
      custom-style="--wot-picker-action-color-confirm: #D92D20;"
      @confirm="changeTime"
    />

    <view class="bottom-bar">
      <button
        class="confirm-button"
        :disabled="submitting || isCompleted"
        :class="{ submitted: submitting || isCompleted }"
        @click="confirmAppointment"
      >
        {{ submitting ? '处理中...' : actionText }}
      </button>
    </view>
  </view>
</template>

<style lang="scss">
.detail-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}
.detail-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.detail-content {
  padding: 24rpx 24rpx 42rpx;
}
.card {
  position: relative;
  overflow: hidden;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(70, 53, 39, 0.035);
}
.overview-card {
  padding: 24rpx 24rpx 22rpx;
}
.overview-accent {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3rpx;
  background: #ef4438;
}
.overview-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20rpx;
}
.service-name {
  font-size: 29rpx;
  font-weight: 600;
  line-height: 42rpx;
}
.service-summary {
  margin-top: 4rpx;
  color: #777;
  font-size: 24rpx;
  line-height: 36rpx;
}
.status-pill {
  height: 44rpx;
  padding: 0 20rpx;
  flex-shrink: 0;
  color: #e52d24;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 44rpx;
  background: #fff0ef;
  border-radius: 24rpx;
}
.status-pill.service {
  color: #d38a3c;
  background: #fff4e8;
}
.status-pill.completed {
  color: #888;
  background: #f3f3f3;
}
.customer-line {
  display: flex;
  margin-top: 17rpx;
  align-items: center;
}
.overview-fields {
  min-width: 0;
  flex: 1;
}
.overview-row {
  display: flex;
  min-height: 40rpx;
  color: #666;
  font-size: 24rpx;
  line-height: 36rpx;
}
.overview-row text:first-child {
  width: 116rpx;
  flex-shrink: 0;
  color: #999;
}
.phone-button {
  display: flex;
  width: 64rpx;
  height: 64rpx;
  margin-left: 12rpx;
  align-items: center;
  justify-content: center;
}
.phone-icon {
  color: #66b56c;
  font-size: 36rpx;
}
.section-card {
  margin-top: 24rpx;
  padding: 26rpx 24rpx;
}
.appointment-info-card {
  order: 2;
}
.arrange-card {
  order: 3;
}
.record-card {
  order: 4;
}
.status-card {
  order: 5;
}
.detail-content {
  display: flex;
  flex-direction: column;
}
.overview-card {
  order: 1;
}
.service-state .arrange-card {
  order: 2;
}
.service-state .appointment-info-card {
  order: 3;
}
.section-title {
  margin-bottom: 18rpx;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}
.info-row {
  display: flex;
  min-height: 58rpx;
  align-items: center;
  border-bottom: 2rpx solid #eee;
  font-size: 25rpx;
  line-height: 36rpx;
}
.row-label {
  width: 140rpx;
  flex-shrink: 0;
  color: #777;
}
.row-value {
  min-width: 0;
  flex: 1;
  color: #242424;
  font-weight: 500;
}
.row-action {
  margin-left: 12rpx;
  flex-shrink: 0;
  color: #e52d24;
  font-weight: 500;
}
.address-value {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.arrange-card .section-title {
  margin-bottom: 10rpx;
}
.record-card {
  padding-bottom: 24rpx;
}
.textarea-wrap {
  position: relative;
  box-sizing: border-box;
  height: 158rpx;
  padding: 18rpx 20rpx 40rpx;
  background: #fff;
  border: 2rpx solid #e7e7e7;
  border-radius: 9rpx;
}
.record-textarea {
  width: 100%;
  height: 100%;
  color: #666;
  font-size: 24rpx;
  line-height: 36rpx;
}
.record-count {
  position: absolute;
  right: 18rpx;
  bottom: 13rpx;
  color: #777;
  font-size: 22rpx;
}
.status-card {
  padding-bottom: 24rpx;
}
.status-card .section-title {
  margin-bottom: 12rpx;
}
.status-description {
  color: #777;
  font-size: 24rpx;
  line-height: 38rpx;
}
.bottom-bar {
  padding: 20rpx 40rpx calc(20rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  background: #fff;
  border-top: 2rpx solid #eee;
}
.confirm-button {
  height: 72rpx;
  margin: 0;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 72rpx;
  background: #e52d24;
  border-radius: 16rpx;
}
.confirm-button.submitted {
  background: #aaa;
}
button::after {
  border: 0;
}
</style>

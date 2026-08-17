<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AppointmentDate, CalendarConfirmEvent, TimeSlot } from '@/types/appointment'

// 星期文案列表
const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

// 生成从今天开始的五个快捷安装日期
const createLocalDate = (offset = 0) => {
  // 日期
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return date
}

// 格式化日期
const formatFullDate = (timestamp: number) => {
  // 日期
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 日期列表
const dates: AppointmentDate[] = Array.from({ length: 5 }, (_, index) => {
  // 日期
  const date = createLocalDate(index)
  return {
    label: index === 0 ? '今天' : index === 1 ? '明天' : WEEK_LABELS[date.getDay()],
    date: `${date.getMonth() + 1}/${date.getDate()}`,
    fullDate: formatFullDate(date.getTime()),
    timestamp: date.getTime(),
  }
})

// 原型中的可选上门时间段
const timeSlots: TimeSlot[] = [
  { time: '09:00-12:00', label: '上午' },
  { time: '13:00-16:00', label: '下午' },
  { time: '16:00-19:00', label: '傍晚' },
  { time: '19:00-21:00', label: '晚间' },
]

// 日历
const calendarRef = ref<any>()
// 最小日期
const minDate = createLocalDate().getTime()
// 最大日期
const maxDate = createLocalDate(60).getTime()
// 已选日期
const selectedDateIndex = ref(1)
// 已选日期
const selectedDateTimestamp = ref(dates[1].timestamp)
// 日历值
const calendarValue = ref(dates[1].timestamp)
// 已选时间
const selectedTimeIndex = ref(0)
// 已选日期
const selectedDate = computed(() => ({ fullDate: formatFullDate(selectedDateTimestamp.value) }))
// 已选时间
const selectedTime = computed(() => timeSlots[selectedTimeIndex.value])

// 点击快捷日期时同步日历当前值
const selectQuickDate = (index: number) => {
  selectedDateIndex.value = index
  selectedDateTimestamp.value = dates[index].timestamp
  calendarValue.value = dates[index].timestamp
}

// 打开更多日期日历
const openCalendar = () => {
  calendarValue.value = selectedDateTimestamp.value
  calendarRef.value?.open()
}

// 确认日历日期并同步快捷日期高亮
const confirmCalendarDate = ({ value }: CalendarConfirmEvent) => {
  if (typeof value !== 'number') return

  // 已选择日期
  const chosenDate = new Date(value)
  chosenDate.setHours(0, 0, 0, 0)
  selectedDateTimestamp.value = chosenDate.getTime()
  calendarValue.value = chosenDate.getTime()
  selectedDateIndex.value = dates.findIndex((item) => item.timestamp === chosenDate.getTime())
}

// 确认预约后将时间回传给确认订单页
const confirmAppointment = () => {
  // 当前页面栈
  const pages = getCurrentPages()
  // 当前页面实例
  const currentPage = pages[pages.length - 1] as any
  // 页面间事件通道
  const eventChannel = currentPage?.getOpenerEventChannel?.()
  eventChannel?.emit('appointmentSelected', {
    date: selectedDate.value.fullDate,
    time: selectedTime.value.time,
  })
  uni.navigateBack()
}
</script>

<template>
  <view class="appointment-page">
    <scroll-view class="appointment-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <!-- 预约安装概要 -->
        <view class="summary-card">
          <image
            class="calendar-icon"
            src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/日历%201.png"
            mode="aspectFit"
          />
          <view>
            <view class="summary-title">预约安装</view>
            <view class="summary-description">商品到货后，师傅上门安装</view>
          </view>
        </view>

        <!-- 安装日期选择 -->
        <view class="date-card">
          <view class="section-title">安装日期</view>
          <view class="date-list">
            <view
              v-for="(item, index) in dates"
              :key="item.date"
              class="date-option"
              :class="{ selected: selectedDateIndex === index }"
              @click="selectQuickDate(index)"
            >
              <view class="date-label">{{ item.label }}</view>
              <view class="date-value">{{ item.date }}</view>
            </view>
          </view>
          <view class="more-date-row" @click="openCalendar">
            <text>更多日期</text>
            <text class="iconfont icon-youjiantou right-arrow" />
          </view>
        </view>

        <!-- 安装时间段选择 -->
        <view class="time-card">
          <view class="section-title">时间段</view>
          <view class="time-list">
            <view
              v-for="(item, index) in timeSlots"
              :key="item.time"
              class="time-option"
              :class="{ selected: selectedTimeIndex === index }"
              @click="selectedTimeIndex = index"
            >
              <view class="time-value">{{ item.time }}</view>
              <view class="time-label">{{ item.label }}</view>
              <wd-checkbox
                v-if="selectedTimeIndex === index"
                :model-value="true"
                checked-color="#D92D20"
              />
            </view>
          </view>
        </view>

        <!-- 预约说明 -->
        <view class="description-card">
          <view class="description-title">预约说明</view>
          <view class="description-line">1.提交订单后，客服会按所选时间确认师傅排期</view>
          <view class="description-line">2.如需改期，可在订单详情中联系专属客服</view>
        </view>
      </view>
    </scroll-view>

    <!-- 更多安装日期日历 -->
    <wd-calendar
      ref="calendarRef"
      v-model="calendarValue"
      type="date"
      title="选择安装日期"
      confirm-text="确认日期"
      :min-date="minDate"
      :max-date="maxDate"
      switch-mode="month"
      root-portal
      safe-area-inset-bottom
      custom-style="--wot-primary-6: #D92D20; --wot-primary-7: #C6281D; --wot-calendar-view-color-active: #D92D20;"
      @confirm="confirmCalendarDate"
    />

    <!-- 底部已选时间与确认按钮 -->
    <view class="confirm-bar">
      <view class="selected-summary">
        <view class="selected-label">已选择</view>
        <view class="selected-value">{{ selectedDate.fullDate }}{{ selectedTime.time }}</view>
      </view>
      <button class="confirm-button" @click="confirmAppointment">确认预约</button>
    </view>
  </view>
</template>

<style lang="scss">
/* 页面基础布局 */
.appointment-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.appointment-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.page-content {
  padding: 24rpx 24rpx 34rpx;
}

/* 预约概要 */
.summary-card {
  display: flex;
  min-height: 112rpx;
  padding: 24rpx 30rpx;
  align-items: center;
  gap: 24rpx;
  background: #fff;
  border-radius: 18rpx;
}

.calendar-icon {
  width: 50rpx;
  height: 50rpx;
  flex-shrink: 0;
}

.summary-title {
  color: $jfx-font-title;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.summary-description {
  margin-top: 4rpx;
  color: $jfx-font-dec2;
  font-size: 23rpx;
  line-height: 32rpx;
}

/* 日期选择 */
.date-card,
.time-card,
.description-card {
  margin-top: 24rpx;
  padding: 26rpx 24rpx;
  background: #fff;
  border-radius: 18rpx;
}

.section-title,
.description-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.date-list {
  display: flex;
  margin-top: 22rpx;
  gap: 10rpx;
}

.date-option {
  display: flex;
  height: 94rpx;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: #faf9f7;
  border: 2rpx solid transparent;
  border-radius: 15rpx;
}

.date-option.selected {
  color: $jfx-brandColor;
  background: #fff;
  border-color: $jfx-brandColor;
}

.date-label {
  font-size: 26rpx;
  font-weight: 500;
  line-height: 36rpx;
}

.date-value {
  margin-top: 7rpx;
  font-size: 22rpx;
  line-height: 30rpx;
}

.more-date-row {
  display: flex;
  margin-top: 24rpx;
  align-items: center;
  justify-content: space-between;
  color: $jfx-font-dec2;
  font-size: 24rpx;
  line-height: 34rpx;
}

.right-arrow {
  color: $jfx-font-dec2;
  font-size: 28rpx;
}

/* 时间段选择 */
.time-list {
  display: grid;
  margin-top: 22rpx;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22rpx 40rpx;
}

.time-option {
  position: relative;
  box-sizing: border-box;
  min-height: 84rpx;
  padding: 12rpx 18rpx;
  background: #fff;
  border: 2rpx solid $jfx-border2;
  border-radius: 14rpx;
}

.time-option.selected {
  background: #fff2f0;
  border-color: $jfx-brandColor;
}

.time-value {
  color: $jfx-font-title;
  font-size: 23rpx;
  line-height: 32rpx;
}

.time-label {
  margin-top: 4rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 30rpx;
}

.time-option.selected .time-value {
  color: $jfx-brandColor;
}

.time-option :deep(.wd-checkbox) {
  position: absolute;
  top: 50%;
  right: 16rpx;
  transform: translateY(-50%);
}

/* 预约说明 */
.description-card {
  padding-bottom: 28rpx;
}

.description-line {
  margin-top: 20rpx;
  color: $jfx-font-dec;
  font-size: 22rpx;
  line-height: 34rpx;
}

/* 底部预约确认栏 */
.confirm-bar {
  display: flex;
  box-sizing: border-box;
  min-height: 126rpx;
  padding: 18rpx 40rpx calc(18rpx + constant(safe-area-inset-bottom));
  padding: 18rpx 40rpx calc(18rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  align-items: center;
  background: #fff;
  border-top: 2rpx solid $jfx-border2;
}

.selected-summary {
  min-width: 0;
  flex: 1;
}

.selected-label {
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 30rpx;
}

.selected-value {
  margin-top: 5rpx;
  color: $jfx-font-title;
  font-size: 24rpx;
  line-height: 34rpx;
}

.confirm-button {
  width: 244rpx;
  height: 64rpx;
  margin: 0 0 0 24rpx;
  flex-shrink: 0;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 64rpx;
  background: $jfx-brandColor;
  border-radius: 16rpx;
}

button::after {
  border: 0;
}
</style>

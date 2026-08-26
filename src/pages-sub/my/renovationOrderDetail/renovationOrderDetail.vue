<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { projectStatusText, useRenovationBusinessStore } from '@/stores/modules/renovation-business'

// 当前装修项目 ID
const id = ref(0)
// 装修业务状态
const store = useRenovationBusinessStore()
// 当前装修项目详情
const project = computed(() => store.getProject(id.value))
// 当前项目的跟进记录
const records = computed(() => store.followUps.filter((item) => item.projectId === id.value))

onLoad((query) => {
  id.value = Number(query?.id) || 0
})
</script>

<template>
  <view class="page">
    <view v-if="project" class="content">
      <view class="card hero-card">
        <view class="hero-head">
          <view class="project-copy">
            <text class="title">{{ project.name }}</text>
            <text class="project-no">{{ project.projectNo }}</text>
          </view>
          <text :class="['status', `status-${project.status}`]">
            {{ projectStatusText[project.status] }}
          </text>
        </view>
        <view class="hero-footer">
          <text>装修项目</text>
          <text>项目详情与服务进度</text>
        </view>
      </view>

      <view class="card info-card">
        <view class="section-head">
          <text class="section-title">项目信息</text>
          <text class="section-caption">PROJECT INFO</text>
        </view>
        <view class="info-list">
          <view class="row">
            <text class="label">客户</text>
            <text class="value">{{ project.customerName }} {{ project.mobile }}</text>
          </view>
          <view class="row">
            <text class="label">服务地址</text>
            <text class="value">{{ project.serviceAddress }}</text>
          </view>
          <view class="row">
            <text class="label">预估金额</text>
            <text class="amount">¥{{ project.quotedAmount.toFixed(2) }}</text>
          </view>
          <view class="row">
            <text class="label">来源预约</text>
            <text class="value">{{
              project.appointmentId ? `#${project.appointmentId}` : '无'
            }}</text>
          </view>
        </view>
      </view>

      <view v-if="records.length" class="card follow-card">
        <view class="section-head">
          <text class="section-title">项目跟进</text>
          <text class="record-count">{{ records.length }} 条记录</text>
        </view>
        <view class="record-list">
          <view v-for="(record, index) in records" :key="record.id" class="record">
            <view class="timeline">
              <view class="timeline-dot" />
              <view v-if="index < records.length - 1" class="timeline-line" />
            </view>
            <view class="record-copy">
              <text class="record-content">{{ record.content }}</text>
              <text class="record-time">{{ record.createdAt }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty">项目不存在</view>
  </view>
</template>

<style lang="scss">
.page {
  min-height: 100vh;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.content {
  padding: 24rpx 24rpx calc(52rpx + env(safe-area-inset-bottom));
}

.card {
  background: #ffffff;
  border: 1rpx solid rgba(114, 89, 69, 0.045);
  border-radius: 20rpx;
  box-shadow: 0 5rpx 18rpx rgba(72, 52, 38, 0.03);
}

.card + .card {
  margin-top: 24rpx;
}

.hero-card {
  padding: 22rpx 24rpx 0;
  overflow: hidden;
}

.hero-head {
  display: flex;
  min-height: 84rpx;
  align-items: flex-start;
  justify-content: space-between;
}

.project-copy {
  min-width: 0;
  padding-right: 20rpx;
}

.title,
.project-no {
  display: block;
}

.title {
  overflow: hidden;
  color: #222222;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 40rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-no {
  margin-top: 3rpx;
  color: #aaaaaa;
  font-size: 22rpx;
  line-height: 32rpx;
}

.status {
  display: inline-flex;
  height: 42rpx;
  padding: 0 20rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 40rpx;
  border-radius: 23rpx;
  box-sizing: border-box;
}

.status-PENDING_CONFIRM {
  color: #d85b32;
  background: #fffaf6;
  border: 1rpx solid #f3c8b5;
}

.status-IN_SERVICE {
  color: #4c9560;
  background: #eef8f0;
}

.status-COMPLETED {
  color: #777777;
  background: #f3f2f0;
}

.hero-footer {
  display: flex;
  min-height: 64rpx;
  align-items: center;
  justify-content: space-between;
  color: #b5b1ad;
  font-size: 21rpx;
  line-height: 30rpx;
  border-top: 2rpx solid #f0efed;
}

.info-card,
.follow-card {
  padding: 24rpx;
}

.section-head {
  display: flex;
  min-height: 42rpx;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  position: relative;
  padding-left: 18rpx;
  color: #222222;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 38rpx;
}

.section-title::before {
  position: absolute;
  top: 9rpx;
  bottom: 7rpx;
  left: 0;
  width: 5rpx;
  background: #df6b4d;
  border-radius: 4rpx;
  content: '';
}

.section-caption,
.record-count {
  color: #b9b5b1;
  font-size: 20rpx;
  line-height: 30rpx;
}

.info-list,
.record-list {
  margin-top: 18rpx;
  padding-top: 4rpx;
  border-top: 2rpx solid #f0efed;
}

.row {
  display: flex;
  min-height: 66rpx;
  align-items: center;
  justify-content: space-between;
  font-size: 24rpx;
  line-height: 36rpx;
}

.row + .row {
  border-top: 1rpx solid #f5f3f1;
}

.label {
  flex-shrink: 0;
  color: #888888;
}

.value {
  max-width: 72%;
  margin-left: 24rpx;
  color: #333333;
  text-align: right;
}

.amount {
  color: #d92d20;
  font-size: 27rpx;
  font-weight: 600;
}

.record {
  display: flex;
  min-height: 92rpx;
}

.record:first-child {
  padding-top: 16rpx;
}

.timeline {
  position: relative;
  width: 30rpx;
  flex-shrink: 0;
}

.timeline-dot {
  position: relative;
  z-index: 1;
  width: 13rpx;
  height: 13rpx;
  margin-top: 11rpx;
  background: #ffffff;
  border: 4rpx solid #df6b4d;
  border-radius: 50%;
  box-sizing: border-box;
}

.timeline-line {
  position: absolute;
  top: 24rpx;
  bottom: -11rpx;
  left: 6rpx;
  width: 1rpx;
  background: #eee8e3;
}

.record-copy {
  min-width: 0;
  padding: 0 0 20rpx 8rpx;
  flex: 1;
}

.record-content,
.record-time {
  display: block;
}

.record-content {
  color: #333333;
  font-size: 24rpx;
  line-height: 36rpx;
}

.record-time {
  margin-top: 6rpx;
  color: #aaaaaa;
  font-size: 21rpx;
  line-height: 30rpx;
}

.empty {
  padding-top: 200rpx;
  color: #aaaaaa;
  font-size: 24rpx;
  text-align: center;
}
</style>

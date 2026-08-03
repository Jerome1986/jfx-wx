<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const detailType = ref<'measure' | 'quote'>('measure')

onLoad((options) => {
  detailType.value = options?.type === 'quote' ? 'quote' : 'measure'
})

const cancelAppointment = () => {
  uni.showModal({
    title: '取消预约',
    content: '确定取消本次免费量房服务吗？',
    confirmText: '确定取消',
    confirmColor: '#D92D20',
  })
}

const reschedule = () => uni.showToast({ title: '改期功能建设中', icon: 'none' })
const contactConsultant = () => uni.showToast({ title: '正在联系顾问', icon: 'none' })
const supplementInfo = () => uni.showToast({ title: '补充信息功能建设中', icon: 'none' })
</script>

<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <template v-if="detailType === 'quote'">
          <view class="service-card">
            <view class="service-heading">
              <view class="service-title">房屋报价服务</view>
              <view class="status-badge quote-status">待确认</view>
            </view>
            <view class="service-number">服务编号 YY202606180032</view>
            <view class="service-description">顾问回根据您提交的信息，先电话沟通大致报价范围</view>
          </view>

          <view class="section-card">
            <view class="section-title">您提交的信息</view>
            <view class="detail-list submitted-list">
              <view class="detail-line"
                ><text class="detail-label">房屋面积</text><text>95㎡</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">户型</text><text>两居室</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">所在城市</text><text>武汉</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">手机号</text><text>13822445628</text></view
              >
            </view>
            <view class="section-tip">以上信息来自装修预算计算器，顾问联系时会进一步确认。</view>
          </view>

          <view class="section-card">
            <view class="section-heading">
              <view class="section-title">报价需求</view>
              <view class="modify-action" @click="supplementInfo">修改</view>
            </view>
            <view class="requirement-tags">
              <text>厨房改造</text>
              <text>老房翻新</text>
              <text>先估预算</text>
            </view>
            <view class="section-divider" />
            <view class="detail-line"
              ><text class="detail-label">关注内容</text
              ><text>大概费用、工期范围、是否需要上门复核</text></view
            >
            <view class="detail-line"
              ><text class="detail-label">补充说明</text
              ><text>想先了解预算，合适后再继续沟通方案</text></view
            >
          </view>

          <view class="section-card">
            <view class="section-title">顾问联系</view>
            <view class="measure-list contact-list">
              <view>预计24小时内电话联系你</view>
              <view>会先核对面积、户型和改造范围</view>
              <view>如需要现场判断，顾问会建议您再预约量房</view>
            </view>
          </view>

          <view class="section-card">
            <view class="section-title">服务说明</view>
            <view class="paragraph"
              >房屋报价服务用于初步了解预算范围，不等同于正式装修报价。若您后续继续推进，顾问会协助进入装修订单确认方案、地址和报价</view
            >
          </view>

          <view class="section-card">
            <view class="section-title">温馨提示</view>
            <view class="paragraph">请保持电话畅通；若手机号或房屋信息有误，可以先补充信息</view>
          </view>
        </template>

        <template v-else>
          <view class="service-card">
            <view class="service-heading">
              <view class="service-title">免费量房服务</view>
              <view class="status-badge">待服务</view>
            </view>
            <view class="service-number">服务编号 YY202606180032</view>
            <view class="service-description"
              >顾问将按约定时间上门量房，记录房屋尺寸和基础需求</view
            >
          </view>

          <view class="section-card schedule-card">
            <view class="section-title">上门安排</view>
            <view class="detail-list">
              <view class="detail-line"
                ><text class="detail-label">上门时间</text><text>06月24日 10:00</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">联系人</text><text>张先生 13822445628</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">服务地址</text><text>武汉市洪山区珞喻路88号</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">详细地址</text><text>家翻新社区服务中心2楼</text></view
              >
            </view>
            <view class="section-tip">以上信息来自装修预算计算器，顾问联系时会进一步确认。</view>
          </view>

          <view class="section-card requirement-card">
            <view class="section-title">房屋需求</view>
            <view class="requirement-tags">
              <text>厨房改造</text>
              <text>老房翻新</text>
              <text>95㎡</text>
            </view>
            <view class="requirement-list">
              <view class="detail-line"
                ><text class="detail-label">房屋情况</text
                ><text>老房厨房局改，储物不足，动线需要重做</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">期望服务</text
                ><text>先上门量房，再根据现场情况沟通方案</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">备注</text
                ><text>希望重点看收纳、台面和水电位置</text></view
              >
            </view>
          </view>

          <view class="section-card measure-card">
            <view class="section-title">量房内容</view>
            <view class="measure-list">
              <view>测量房基础尺寸</view>
              <view>了解现有布局和改造想法</view>
              <view>记录现场问题，方便后续方案沟通</view>
              <view>根据实际情况沟通预算范围</view>
            </view>
          </view>

          <view class="section-card preparation-card">
            <view class="section-title">上门准备</view>
            <view class="paragraph"
              >请提前确认家中有人接待，并尽量准备户型图、想改造的位置、预算范围或参考图片，方便顾问更快了解需求</view
            >
          </view>

          <view class="section-card notice-card">
            <view class="section-title">服务说明</view>
            <view class="paragraph"
              >免费量房是一次上门服务，量房完成后，本次预约服务结束；如继续推进，顾问会协助您沟通下一步</view
            >
          </view>
        </template>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <template v-if="detailType === 'quote'">
        <button class="outline-button" @click="cancelAppointment">取消预约</button>
        <button class="outline-button" @click="supplementInfo">补充信息</button>
        <button class="primary-button" @click="contactConsultant">联系客服</button>
      </template>
      <template v-else>
        <button class="outline-button" @click="cancelAppointment">取消预约</button>
        <button class="outline-button" @click="reschedule">改期</button>
        <button class="primary-button" @click="contactConsultant">联系顾问</button>
      </template>
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

.page-content {
  padding: 24rpx 24rpx 28rpx;
}

.service-card,
.section-card {
  background: #ffffff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(55, 42, 32, 0.045);
}

.service-card {
  padding: 22rpx 24rpx 20rpx;
  border-left: 3rpx solid $jfx-brandColor;
}

.service-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.service-title,
.section-title {
  color: #222222;
  font-size: 27rpx;
  line-height: 40rpx;
}

.status-badge {
  display: flex;
  height: 40rpx;
  padding: 0 18rpx;
  align-items: center;
  color: #c77a17;
  font-size: 21rpx;
  font-weight: 400;
  line-height: 40rpx;
  background: #fff5e8;
  border-radius: 22rpx;
}

.quote-status {
  color: $jfx-brandColor;
  background: #fff0ef;
}

.service-number {
  margin-top: 8rpx;
  color: #222222;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 34rpx;
}

.service-description {
  margin-top: 12rpx;
  color: #777777;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 34rpx;
}

.section-card {
  margin-top: 24rpx;
  padding: 24rpx;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.modify-action {
  color: $jfx-brandColor;
  font-size: 21rpx;
  font-weight: 400;
  line-height: 40rpx;
}

.detail-list {
  margin-top: 16rpx;
}

.detail-line {
  display: flex;
  color: #333333;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 42rpx;
}

.detail-label {
  width: 144rpx;
  flex-shrink: 0;
  color: #777777;
}

.section-tip {
  margin-top: 7rpx;
  color: #aaaaaa;
  font-size: 21rpx;
  font-weight: 400;
  line-height: 32rpx;
}

.requirement-tags {
  display: flex;
  margin-top: 14rpx;
  gap: 16rpx;
}

.requirement-tags text {
  padding: 4rpx 16rpx;
  color: #a9704d;
  font-size: 20rpx;
  font-weight: 400;
  line-height: 30rpx;
  background: #fbf3eb;
  border-radius: 18rpx;
}

.requirement-list {
  margin-top: 14rpx;
}

.section-divider {
  height: 2rpx;
  margin: 18rpx 0 14rpx;
  background: #f0f0f0;
}

.submitted-list .detail-line {
  line-height: 48rpx;
}

.requirement-list .detail-label {
  width: 144rpx;
  color: #999999;
}

.measure-list {
  margin-top: 13rpx;
}

.measure-list view {
  position: relative;
  padding-left: 18rpx;
  color: #666666;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 42rpx;
}

.measure-list view::before {
  position: absolute;
  top: 0;
  left: 0;
  color: #d9a47f;
  font-size: 28rpx;
  content: '•';
}

.contact-list view {
  display: flex;
  padding-left: 0;
  align-items: baseline;
}

.contact-list view::before {
  position: static;
  margin-right: 8rpx;
  flex-shrink: 0;
}

.paragraph {
  margin-top: 14rpx;
  color: #777777;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 38rpx;
}

.bottom-bar {
  display: flex;
  min-height: 104rpx;
  padding: 14rpx 24rpx calc(14rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  align-items: center;
  gap: 30rpx;
  background: #ffffff;
  border-top: 2rpx solid #eeeeee;
}

.outline-button,
.primary-button {
  height: 54rpx;
  margin: 0;
  padding: 0;
  flex: 1;
  font-size: 22rpx;
  line-height: 54rpx;
  border-radius: 12rpx;
}

.outline-button {
  color: #777777;
  background: #ffffff;
  border: 2rpx solid #eeeeee;
}

.primary-button {
  color: #ffffff;
  background: $jfx-brandColor;
}

.outline-button::after,
.primary-button::after {
  border: 0;
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'

// 反馈
const feedbackTypes = ['功能建议', '服务体验', '订单问题', '其他']
// 已选类型
const selectedType = ref('功能建议')
// 反馈内容
const feedbackContent = ref('')
// 内容
const contentLength = computed(() => feedbackContent.value.length)

// 提交反馈
const submitFeedback = () => {
  if (!feedbackContent.value.trim()) {
    uni.showToast({ title: '请填写反馈内容', icon: 'none' })
    return
  }

  uni.showToast({ title: '感谢您的反馈', icon: 'success' })
}
</script>

<template>
  <view class="feedback-page">
    <scroll-view class="feedback-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="intro-card">
          <view class="intro-icon-box">
            <image
              class="intro-icon"
              src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/意见反馈3.png"
              mode="aspectFit"
            />
          </view>
          <view class="intro-copy">
            <view class="intro-title">把使用感受告诉我们</view>
            <view class="intro-description">
              问题、建议或体验不顺畅的地方，都可以在这里反馈 我们会认真查看，并持续优化服务体验
            </view>
          </view>
        </view>

        <view class="type-card">
          <view class="section-heading">
            <text class="section-title">反馈类型</text>
            <text class="section-note">请选择最接近的一项</text>
          </view>
          <view class="type-list">
            <view
              v-for="item in feedbackTypes"
              :key="item"
              class="type-option"
              :class="{ selected: selectedType === item }"
              @click="selectedType = item"
            >
              {{ item }}
            </view>
          </view>
        </view>

        <view class="content-card">
          <view class="section-heading">
            <text class="section-title">反馈内容</text>
            <text class="section-note">必填</text>
          </view>
          <view class="textarea-wrap">
            <textarea
              v-model="feedbackContent"
              class="feedback-textarea"
              :maxlength="300"
              placeholder="请描述你遇到的问题或建议，例如页面、操作步骤、希望如何优化等"
              placeholder-class="textarea-placeholder"
              :show-confirm-bar="false"
            />
            <text class="content-count">{{ contentLength }}/300</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="submit-bar">
      <button class="submit-button" @click="submitFeedback">预约安装</button>
    </view>
  </view>
</template>

<style lang="scss">
.feedback-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.feedback-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.page-content {
  padding: 24rpx;
}

.intro-card,
.type-card,
.content-card {
  background: #ffffff;
  border-radius: 18rpx;
  box-shadow: 0 5rpx 24rpx rgba(55, 42, 32, 0.035);
}

.intro-card {
  display: flex;
  min-height: 164rpx;
  padding: 24rpx;
  align-items: flex-start;
}

.intro-icon-box {
  display: flex;
  width: 64rpx;
  height: 64rpx;
  margin-right: 18rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff0ef;
  border-radius: 8rpx;
}

.intro-icon {
  width: 40rpx;
  height: 40rpx;
}

.intro-copy {
  min-width: 0;
  padding-top: 3rpx;
  flex: 1;
}

.intro-title {
  color: #1d1d1f;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.intro-description {
  margin-top: 6rpx;
  color: #777777;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 34rpx;
}

.type-card {
  min-height: 146rpx;
  margin-top: 24rpx;
  padding: 26rpx 24rpx 24rpx;
}

.section-heading {
  display: flex;
  align-items: baseline;
}

.section-title {
  color: #1d1d1f;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.section-note {
  margin-left: 12rpx;
  color: #777777;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 34rpx;
}

.type-list {
  display: flex;
  margin-top: 20rpx;
  align-items: center;
  gap: 24rpx;
}

.type-option {
  display: flex;
  height: 42rpx;
  padding: 0 16rpx;
  align-items: center;
  justify-content: center;
  color: #777777;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 40rpx;
  white-space: nowrap;
  background: #f8f7f5;
  border: 2rpx solid transparent;
  border-radius: 23rpx;
}

.type-option.selected {
  color: #e52e24;
  background: #ffffff;
  border-color: #e52e24;
}

.content-card {
  min-height: 290rpx;
  margin-top: 24rpx;
  padding: 26rpx 24rpx 24rpx;
}

.textarea-wrap {
  position: relative;
  height: 190rpx;
  margin-top: 20rpx;
  overflow: hidden;
  background: #ffffff;
  border: 2rpx solid #eeeeee;
  border-radius: 14rpx;
}

.feedback-textarea {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 24rpx 24rpx 52rpx;
  color: #333333;
  font-size: 23rpx;
  font-weight: 500;
  line-height: 34rpx;
}

.feedback-textarea :deep(.textarea-placeholder),
.textarea-placeholder {
  color: #aaaaaa;
  font-weight: 500;
}

.content-count {
  position: absolute;
  right: 22rpx;
  bottom: 20rpx;
  color: #aaaaaa;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 32rpx;
  pointer-events: none;
}

.submit-bar {
  box-sizing: border-box;
  min-height: 104rpx;
  padding: 18rpx 40rpx calc(18rpx + constant(safe-area-inset-bottom));
  padding: 18rpx 40rpx calc(18rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  background: #ffffff;
  border-top: 2rpx solid #eeeae6;
}

.submit-button {
  width: 100%;
  height: 70rpx;
  margin: 0;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 70rpx;
  background: #e42b22;
  border-radius: 15rpx;
}

.submit-button::after {
  border: 0;
}
</style>

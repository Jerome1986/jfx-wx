<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request } from '@/utils/http'

interface FeedbackRecord {
  id: number
  feedbackNo: string
  type: string
  content: string
  status: 'PENDING' | 'PROCESSING' | 'REPLIED' | 'CLOSED'
  reply: string | null
  completedAt: string | null
  createdAt: string
}

interface FeedbackPage {
  list: FeedbackRecord[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

const statusLabels: Record<FeedbackRecord['status'], string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  REPLIED: '已回复',
  CLOSED: '已关闭',
}
const records = ref<FeedbackRecord[]>([])
const recordsLoading = ref(false)
const recordsError = ref(false)
const recordsPage = ref(0)
const recordsTotalPage = ref(0)
let recordsRequestId = 0

// 刷新从第一页开始；忽略过期请求，避免旧分页结果覆盖新记录。
const queryRecords = async (reset = true) => {
  if (!reset && (recordsLoading.value || recordsPage.value >= recordsTotalPage.value)) return
  const requestId = ++recordsRequestId
  const pageNum = reset ? 1 : recordsPage.value + 1
  recordsLoading.value = true
  recordsError.value = false
  try {
    const res = await request<FeedbackPage>({
      url: '/feedback/mine',
      method: 'GET',
      data: { pageNum, pageSize: 10 },
    })
    if (requestId !== recordsRequestId) return
    if (res.code !== 200 || !res.data || !Array.isArray(res.data.list)) {
      uni.showToast({ title: res.message || '查询反馈记录失败', icon: 'none' })
      recordsError.value = true
      return
    }
    records.value = reset
      ? res.data.list
      : [
          ...records.value,
          ...res.data.list.filter((item) => !records.value.some((record) => record.id === item.id)),
        ]
    recordsPage.value = res.data.pageNum
    recordsTotalPage.value = res.data.totalPage
  } catch {
    if (requestId === recordsRequestId) recordsError.value = true
  } finally {
    if (requestId === recordsRequestId) recordsLoading.value = false
  }
}

const formatTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    ' ' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  )
}

const feedbackTypes = ['功能建议', '服务体验', '订单问题', '其他']
const selectedType = ref('功能建议')
const feedbackContent = ref('')
const contentLength = computed(() => feedbackContent.value.length)
const queryState = ref<'loading' | 'ready' | 'error'>('loading')
const pendingFeedback = ref<FeedbackRecord | null>(null)
const submitting = ref(false)
const submitDisabled = computed(
  () => queryState.value !== 'ready' || pendingFeedback.value !== null || submitting.value,
)

const queryFeedback = async () => {
  queryState.value = 'loading'
  try {
    const res = await request<FeedbackRecord | null>({ url: '/feedback/user', method: 'GET' })
    if (res.code !== 200 || res.data === undefined) {
      uni.showToast({ title: res.message || '查询反馈失败，请重试', icon: 'none' })
      queryState.value = 'error'
      return
    }
    pendingFeedback.value = res.data
    queryState.value = 'ready'
  } catch {
    // 请求封装统一提示错误，查询失败不能视为没有未处理反馈。
    queryState.value = 'error'
  }
}

// 进入页面及手动刷新时，同时更新提交资格与反馈记录。
const refreshFeedback = async () => {
  await Promise.all([queryFeedback(), queryRecords()])
}

onShow(() => {
  if (!submitting.value) void refreshFeedback()
})

const submitFeedback = async () => {
  if (submitDisabled.value) return
  const type = selectedType.value.trim()
  const content = feedbackContent.value.trim()
  if (!type || type.length > 191) {
    uni.showToast({ title: '请选择反馈类型，最多191个字符', icon: 'none' })
    return
  }
  if (!content || content.length > 5000) {
    uni.showToast({ title: !content ? '请填写反馈内容' : '反馈内容最多5000个字符', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const res = await request<FeedbackRecord>({
      url: '/feedback/submit',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { type, content },
    })
    if (res.code !== 200 || !res.data) {
      uni.showToast({ title: res.message || '提交失败，请重试', icon: 'none' })
      await queryFeedback()
      return
    }
    pendingFeedback.value = res.data
    feedbackContent.value = ''
    uni.showToast({ title: '提交成功', icon: 'success' })
    await queryRecords()
  } catch (error) {
    // 冲突或网络失败时可能已经落库，重新查询后再开放提交。
    const statusCode = (error as { statusCode?: number })?.statusCode
    if (statusCode === 401 || statusCode === 403) {
      queryState.value = 'error'
    } else if (statusCode !== 400) {
      await queryFeedback()
    }
  } finally {
    submitting.value = false
  }
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
              :maxlength="5000"
              placeholder="请描述你遇到的问题或建议，例如页面、操作步骤、希望如何优化等"
              placeholder-class="textarea-placeholder"
              :show-confirm-bar="false"
            />
            <text class="content-count">{{ contentLength }}/5000</text>
          </view>
        </view>
        <view class="history-card">
          <view class="section-heading history-heading">
            <text class="section-title">我的反馈</text>
            <button
              class="history-action"
              :disabled="recordsLoading || submitting"
              @click="refreshFeedback"
            >
              刷新
            </button>
          </view>
          <view v-for="item in records" :key="item.id" class="history-item">
            <view class="history-heading">
              <text class="history-type">{{ item.type }}</text>
              <text class="history-status" :class="{ replied: item.status === 'REPLIED' }">{{
                statusLabels[item.status]
              }}</text>
            </view>
            <text class="history-time">提交时间：{{ formatTime(item.createdAt) }}</text>
            <view class="history-content">{{ item.content }}</view>
            <view v-if="item.reply" class="history-reply">
              <text class="history-type">管理员回复</text>
              <view class="history-content">{{ item.reply }}</view>
            </view>
            <text v-if="item.completedAt" class="history-time"
              >完成时间：{{ formatTime(item.completedAt) }}</text
            >
          </view>
          <view v-if="recordsLoading" class="history-hint">正在加载反馈记录…</view>
          <view v-else-if="recordsError" class="history-hint">
            反馈记录加载失败
            <button class="history-action" :disabled="submitting" @click="refreshFeedback">
              重新加载
            </button>
          </view>
          <view v-else-if="!records.length" class="history-hint">暂无反馈记录</view>
          <button
            v-else-if="recordsPage < recordsTotalPage"
            class="history-action"
            :disabled="submitting"
            @click="queryRecords(false)"
          >
            加载更多
          </button>
          <view v-else class="history-hint">已显示全部反馈</view>
        </view>
      </view>
    </scroll-view>

    <view class="submit-bar">
      <view v-if="queryState === 'loading'" class="feedback-status">正在查询反馈状态…</view>
      <view v-else-if="queryState === 'error'" class="feedback-status">
        反馈状态查询失败，请重试
        <button class="retry-button" :disabled="submitting" @click="queryFeedback">重新查询</button>
      </view>
      <view v-else-if="pendingFeedback" class="feedback-status">
        您有待处理的反馈，请耐心等候
        <text>（{{ pendingFeedback.status === 'PROCESSING' ? '处理中' : '待处理' }}）</text>
      </view>
      <button
        class="submit-button"
        :disabled="submitDisabled"
        :loading="submitting"
        @click="submitFeedback"
      >
        提交
      </button>
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
.submit-button[disabled] {
  color: #ffffff;
  background: #cccccc;
}

.feedback-status {
  margin-bottom: 16rpx;
  color: #777777;
  font-size: 24rpx;
  text-align: center;
}

.retry-button {
  margin-top: 12rpx;
  font-size: 24rpx;
}
.history-card {
  margin-top: 24rpx;
  padding: 24rpx;
  background: #ffffff;
  border-radius: 18rpx;
}

.history-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.history-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #eeeeee;
}

.history-type {
  font-size: 25rpx;
  font-weight: 600;
}

.history-status {
  flex-shrink: 0;
  color: #777777;
  font-size: 23rpx;
}

.history-status.replied {
  color: #258354;
}

.history-time {
  display: block;
  margin-top: 12rpx;
  color: #999999;
  font-size: 22rpx;
}

.history-content {
  margin-top: 12rpx;
  font-size: 25rpx;
  line-height: 38rpx;
  white-space: pre-wrap;
  word-break: break-all;
}

.history-reply {
  margin-top: 16rpx;
  padding: 20rpx;
  background: #f8f7f5;
  border-radius: 12rpx;
}

.history-hint {
  padding: 20rpx 0;
  color: #999999;
  font-size: 24rpx;
  text-align: center;
}

.history-action {
  margin: 12rpx 0;
  color: #e42b22;
  background: #fff5f4;
  font-size: 24rpx;
}
</style>

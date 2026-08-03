<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

type OrderStatus = 'pending' | 'servicing' | 'completed'

const status = ref<OrderStatus>('pending')

const statusText = computed(
  () =>
    ({
      pending: '待确认',
      servicing: '服务中',
      completed: '已完成',
    }[status.value]),
)

const progressText = computed(
  () =>
    ({
      pending: '确认预算和方案范围',
      servicing: '施工安排推进中',
      completed: '施工安排推进中',
    }[status.value]),
)

onLoad((query) => {
  const queryStatus = query?.status as OrderStatus | undefined
  if (queryStatus && ['pending', 'servicing', 'completed'].includes(queryStatus))
    status.value = queryStatus
})

const callCustomer = () => uni.makePhoneCall({ phoneNumber: '13800005628' })
const viewQuoteDetail = () => {
  uni.navigateTo({
    url: `/pages-sub/my/quoteDetail/quoteDetail?status=${status.value}&mode=readonly`,
  })
}
</script>

<template>
  <view class="detail-page" :class="{ 'has-action': status === 'pending' }">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="summary-card" :class="`summary-${status}`">
          <view class="summary-heading">
            <text class="project-title">95m²老房厨房改造</text>
            <text class="status-tag" :class="`tag-${status}`">{{ statusText }}</text>
          </view>
          <view class="summary-meta">
            <text>{{ progressText }}</text>
            <text>更新于06月20日 16:20</text>
          </view>
        </view>

        <view class="info-card customer-card">
          <view class="card-heading">
            <text class="card-title">客户与房屋信息</text>
            <button class="call-button" @click="callCustomer">拨打</button>
          </view>
          <view class="info-row"
            ><text class="info-label">客户</text><text>张先生 138****5628</text></view
          >
          <view class="info-row"
            ><text class="info-label">服务地址</text><text>武汉市洪山区珞瑜路88号</text></view
          >
          <view class="info-row"
            ><text class="info-label">房屋信息</text><text>两居室/95m²/老房翻新</text></view
          >
          <view class="info-row"
            ><text class="info-label">改造需求</text
            ><text>厨房改造，重点关注台面、水电位和收纳</text></view
          >
        </view>

        <view class="info-card quote-card">
          <view class="card-heading">
            <text class="card-title">报价费用清单</text>
            <button class="detail-button" @click="viewQuoteDetail">查看明细</button>
          </view>
          <view class="quote-item">
            <view
              ><view class="quote-name">主材</view
              ><view class="quote-desc">水槽、龙头、台面及基础五金</view></view
            >
            <text class="quote-price">¥3888</text>
          </view>
          <view class="quote-item">
            <view
              ><view class="quote-name">人工+辅材</view
              ><view class="quote-desc">拆除、水电改造、墙地砖铺贴</view></view
            >
            <text class="quote-price">¥10275</text>
          </view>
          <view class="quote-item">
            <view
              ><view class="quote-name">服务保障</view
              ><view class="quote-desc">上门量房、项目管理、开荒保洁</view></view
            >
            <text class="quote-price">已包含</text>
          </view>
          <view class="total-row">
            <text>{{ status === 'pending' ? '预估合计' : '费用合计' }}</text>
            <text class="quote-price">¥14163</text>
          </view>
          <view class="quote-note">最终费用以现场量房和确认方案为准</view>
        </view>

        <view v-if="status === 'completed'" class="info-card archive-card">
          <view class="card-title archive-title">归档资料</view>
          <view class="info-row"
            ><text class="archive-label">验收时间</text><text>06月25日 18:20</text></view
          >
          <view class="info-row"
            ><text class="archive-label">留存时间</text
            ><text>报价明细/服务记录/验收结果</text></view
          >
          <view class="info-row"
            ><text class="archive-label">后续处理</text
            ><text>如有售后，按公司流程登记处理</text></view
          >
        </view>
      </view>
    </scroll-view>

    <view v-if="status === 'pending'" class="bottom-action">
      <button class="waiting-button" disabled>等待客户确认</button>
    </view>
  </view>
</template>

<style lang="scss">
.detail-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: #252527;
  background: #f8f7f5;
}
.detail-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.page-content {
  padding: 24rpx 24rpx calc(52rpx + env(safe-area-inset-bottom));
}
.has-action .page-content {
  padding-bottom: 32rpx;
}
.summary-card,
.info-card {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(57, 45, 34, 0.045);
}
.summary-card {
  padding: 24rpx;
  border-left: 2rpx solid #e52e24;
}
.summary-completed {
  border-left-color: #888;
}
.summary-heading,
.summary-meta,
.card-heading,
.quote-item,
.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.project-title {
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
.summary-meta {
  margin-top: 20rpx;
  color: #777;
  font-size: 24rpx;
  line-height: 34rpx;
}
.info-card {
  margin-top: 24rpx;
  padding: 26rpx 24rpx;
}
.card-title {
  font-size: 29rpx;
  font-weight: 600;
  line-height: 42rpx;
}
.call-button,
.detail-button {
  height: 43rpx;
  margin: 0;
  padding: 0 22rpx;
  color: #e52e24;
  font-size: 23rpx;
  line-height: 41rpx;
  background: #fff0ef;
  border-radius: 24rpx;
}
.call-button::after,
.detail-button::after,
.waiting-button::after {
  border: 0;
}
.info-row {
  display: flex;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 30rpx;
}
.info-label {
  width: 112rpx;
  flex-shrink: 0;
  color: #777;
}
.quote-card {
  padding-bottom: 27rpx;
}
.quote-item {
  min-height: 84rpx;
  border-bottom: 2rpx solid #eee;
}
.quote-item > view {
  min-width: 0;
}
.quote-name {
  font-size: 25rpx;
  font-weight: 500;
  line-height: 35rpx;
}
.quote-desc {
  margin-top: 3rpx;
  color: #777;
  font-size: 23rpx;
  line-height: 32rpx;
}
.quote-price {
  margin-left: 20rpx;
  flex-shrink: 0;
  color: #e52e24;
  font-size: 25rpx;
}
.total-row {
  padding-top: 13rpx;
  color: #777;
  font-size: 24rpx;
  line-height: 34rpx;
}
.quote-note {
  margin-top: 3rpx;
  color: #777;
  font-size: 23rpx;
  line-height: 32rpx;
}
.archive-card {
  padding-bottom: 25rpx;
}
.archive-title {
  margin-bottom: 20rpx;
}
.archive-card .info-row {
  margin-top: 9rpx;
}
.archive-label {
  width: 124rpx;
  flex-shrink: 0;
  color: #777;
}
.bottom-action {
  padding: 24rpx 42rpx calc(24rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  background: #fff;
  border-top: 2rpx solid #eee;
}
.waiting-button {
  height: 70rpx;
  margin: 0;
  color: #777 !important;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 70rpx;
  background: #d2d2d2 !important;
  border-radius: 16rpx;
  opacity: 1;
}
</style>

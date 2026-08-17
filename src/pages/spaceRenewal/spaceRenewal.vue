<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { getRenewalPlanListApi } from '@/api/renewal-plan'
import type { RenewalPlan } from '@/types/space-renewal'

// 搜索框关键词
const keyword = ref('')

// 焕新方案列表
const renewalPlans = ref<RenewalPlan[]>([])
// 加载状态
const loading = ref(false)

// 加载焕新方案
const loadRenewalPlans = async () => {
  loading.value = true
  try {
    const { data } = await getRenewalPlanListApi()
    renewalPlans.value = data.filter((item) => item.status === 'PUBLISHED')
  } catch (error) {
    console.error('获取焕新方案失败：', error)
  } finally {
    loading.value = false
  }
}

onLoad(loadRenewalPlans)

// 根据关键词筛选标题、描述和标签
const visiblePlans = computed(() => {
  // 当前处理值
  const value = keyword.value.trim().toLowerCase()
  if (!value) return renewalPlans.value
  return renewalPlans.value.filter((item) =>
    [item.name, item.summary, ...item.tags].some((text) => text.toLowerCase().includes(value)),
  )
})

// 查看方案详情
const viewPlan = (item: RenewalPlan) => {
  // 页面跳转查询参数
  const query = [
    `id=${item.id}`,
    `title=${encodeURIComponent(item.name)}`,
    `description=${encodeURIComponent(item.summary || '')}`,
    `cover=${encodeURIComponent(item.cover || '')}`,
  ].join('&')
  uni.navigateTo({ url: `/pages/spaceRenewalDetail/spaceRenewalDetail?${query}` })
}
</script>

<template>
  <view class="renewal-page">
    <!-- 方案搜索区域 -->
    <view class="search-box">
      <wd-icon name="search" custom-style="font-size: 32rpx; color: #1d1d1f;" />
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索焕新方案、简介或标签"
        placeholder-class="search-placeholder"
      />
    </view>
    <!-- 方案标题和数量 -->
    <view class="plan-heading">
      <text class="heading-title">焕新方案</text>
      <text class="heading-count">共{{ visiblePlans.length }}个方案</text>
    </view>
    <!-- 可滚动方案列表 -->
    <scroll-view class="plan-scroll" scroll-y :show-scrollbar="false">
      <view class="plan-list">
        <!-- 单个焕新方案卡片 -->
        <view v-for="item in visiblePlans" :key="item.id" class="plan-card" @click="viewPlan(item)">
          <!-- 方案封面 -->
          <image class="plan-cover" :src="item.cover" mode="aspectFill" />
          <!-- 方案主要信息 -->
          <view class="plan-content">
            <view class="plan-title">{{ item.name }}</view>
            <view class="plan-description">{{ item.summary }}</view>
            <view class="plan-tags">
              <text v-for="tag in item.tags" :key="tag" class="plan-tag">{{ tag }}</text>
            </view>
          </view>
          <!-- 预算和操作区域 -->
          <view class="plan-footer">
            <text class="detail-link">施工前确认预算明细</text>
            <view class="price-wrap">
              <text class="price-label">参考报价</text>
              <text class="plan-price">¥{{ item.startingPrice }}起</text>
            </view>
            <button class="view-button" @click.stop="viewPlan(item)">查看方案</button>
          </view>
        </view>
        <!-- 搜索无结果状态 -->
        <view v-if="loading" class="empty-state">正在加载焕新方案...</view>
        <view v-else-if="visiblePlans.length === 0" class="empty-state">没有找到相关焕新方案</view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
// 页面整体布局
.renewal-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  padding: 24rpx;
  background-color: $jfx-pageBackGroundColor;
}

// 顶部搜索框
.search-box {
  display: flex;
  height: 64rpx;
  flex-shrink: 0;
  align-items: center;
  padding: 0 20rpx;
  background-color: #ffffff;
  border: 2rpx solid $jfx-border2;
  border-radius: 32rpx;
}

// 搜索输入框
.search-input {
  height: 60rpx;
  margin-left: 12rpx;
  flex: 1;
  color: $jfx-font-title;
  font-size: 24rpx;
  line-height: 60rpx;
}

.search-placeholder {
  color: $jfx-font-dec2;
}

// 方案区域标题
.plan-heading {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0 16rpx;
}

.heading-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: bold;
}
.heading-count {
  color: $jfx-font-dec;
  font-size: 24rpx;
}

// 方案滚动列表
.plan-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.plan-list {
  padding-bottom: 24rpx;
}

// 单个方案卡片
.plan-card {
  @include jfx-shadow;
  position: relative;
  display: flex;
  min-height: 248rpx;
  padding: 24rpx 24rpx 72rpx;
  background-color: #ffffff;
  border-radius: 16rpx;

  &:not(:last-child) {
    margin-bottom: 16rpx;
  }
}

// 卡片封面和内容
.plan-cover {
  width: 192rpx;
  height: 164rpx;
  flex-shrink: 0;
  border-radius: 8rpx;
}
.plan-content {
  min-width: 0;
  margin-left: 16rpx;
  flex: 1;
}
.plan-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: bold;
  line-height: 40rpx;
}

.plan-description {
  @include ellipsis(2);
  min-height: 64rpx;
  margin-top: 4rpx;
  color: $jfx-font-dec;
  font-size: 22rpx;
  line-height: 32rpx;
}

// 方案标签
.plan-tags {
  display: flex;
  gap: 8rpx;
  margin-top: 8rpx;
  white-space: nowrap;
}
.plan-tag {
  padding: 4rpx 10rpx;
  color: #db842f;
  font-size: 20rpx;
  line-height: 28rpx;
  background-color: #fff3e8;
  border-radius: 16rpx;
}

// 卡片底部信息和操作
.plan-footer {
  position: absolute;
  right: 24rpx;
  bottom: 16rpx;
  left: 24rpx;
  display: flex;
  align-items: center;
}

.detail-link,
.price-label {
  color: $jfx-font-dec;
  font-size: 20rpx;
}
.price-wrap {
  display: flex;
  margin-left: auto;
  align-items: center;
}
.plan-price {
  margin-left: 6rpx;
  color: $jfx-brandColor;
  font-size: 24rpx;
}

// 查看方案按钮
.view-button {
  height: 48rpx;
  margin: 0 0 0 18rpx;
  padding: 0 18rpx;
  color: #ffffff;
  font-size: 20rpx;
  line-height: 48rpx;
  background-color: $jfx-brandColor;
  border-radius: 24rpx;
}

// 搜索无结果提示
.empty-state {
  padding: 120rpx 0;
  color: $jfx-font-dec2;
  font-size: 24rpx;
  text-align: center;
}
</style>

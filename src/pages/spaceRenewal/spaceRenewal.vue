<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RenewalPlan } from '@/types/space-renewal'

// 搜索框关键词
const keyword = ref('')

// 焕新方案列表
const renewalPlans: RenewalPlan[] = [
  {
    title: '厨房动线优化',
    description: '台面收纳一起升级，适合老旧厨房、台面拥挤',
    tags: ['动线优化', '收纳升级', '台面焕新'],
    price: '1.8万起',
    cover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/厨房.png',
  },
  {
    title: '卫生间干湿分离',
    description: '分区更清爽，防滑和收纳同步优化',
    tags: ['干湿分离', '防滑升级', '洁具焕新'],
    price: '2.6万起',
    cover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/卫生间.png',
  },
  {
    title: '阳台洗晒收纳区',
    description: '洗衣机柜、晾晒、休闲角一体规划，适合阳台杂乱，功能单一',
    tags: ['洗晒收纳', '休闲空间', '空间扩容'],
    price: '1.2万起',
    cover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/阳台.png',
  },
  {
    title: '全屋墙面环保刷新',
    description: '耐擦洗材料，重新搭配加的颜色，适合墙面发黄、局部开裂',
    tags: ['环保耐用', '颜色焕新', '颜值提升'],
    price: '1.8万起',
    cover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/墙面.png',
  },
  {
    title: '卧室收纳升级',
    description: '利用墙面与床侧空间，改善衣物和日常用品收纳',
    tags: ['衣柜定制', '空间利用', '舒适焕新'],
    price: '1.5万起',
    cover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/墙面.png',
  },
  {
    title: '客厅功能焕新',
    description: '优化会客与储物布局，让公共空间更宽敞实用',
    tags: ['布局优化', '收纳提升', '功能升级'],
    price: '2.8万起',
    cover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/阳台.png',
  },
]

// 根据关键词筛选标题、描述和标签
const visiblePlans = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  if (!value) return renewalPlans
  return renewalPlans.filter((item) =>
    [item.title, item.description, ...item.tags].some((text) => text.toLowerCase().includes(value)),
  )
})

// 查看方案详情
const viewPlan = (item: RenewalPlan) => {
  const query = `title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.cover)}`
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
        placeholder="搜索水龙头、花洒、浴室柜"
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
        <view
          v-for="item in visiblePlans"
          :key="item.title"
          class="plan-card"
          @click="viewPlan(item)"
        >
          <!-- 方案封面 -->
          <image class="plan-cover" :src="item.cover" mode="aspectFill" />
          <!-- 方案主要信息 -->
          <view class="plan-content">
            <view class="plan-title">{{ item.title }}</view>
            <view class="plan-description">{{ item.description }}</view>
            <view class="plan-tags">
              <text v-for="tag in item.tags" :key="tag" class="plan-tag">{{ tag }}</text>
            </view>
          </view>
          <!-- 预算和操作区域 -->
          <view class="plan-footer">
            <text class="detail-link">施工前确认预算明细</text>
            <view class="price-wrap">
              <text class="price-label">参考报价</text>
              <text class="plan-price">¥{{ item.price }}</text>
            </view>
            <button class="view-button" @click.stop="viewPlan(item)">查看方案</button>
          </view>
        </view>
        <!-- 搜索无结果状态 -->
        <view v-if="visiblePlans.length === 0" class="empty-state">没有找到相关焕新方案</view>
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

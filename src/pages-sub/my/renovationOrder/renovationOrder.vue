<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { projectStatusText, useRenovationBusinessStore } from '@/stores/modules/renovation-business'
import type { RenovationProjectStatus } from '@/types/renovation-business'

type Filter = 'all' | RenovationProjectStatus
// 装修项目筛选项
const filters: Array<{ label: string; value: Filter }> = [
  { label: '全部', value: 'all' },
  { label: '待确认', value: 'PENDING_CONFIRM' },
  { label: '服务中', value: 'IN_SERVICE' },
  { label: '已完成', value: 'COMPLETED' },
]
// 当前项目筛选状态
const active = ref<Filter>('all')
// 装修业务状态
const store = useRenovationBusinessStore()
// 当前筛选后的装修项目列表
const list = computed(() =>
  store.projects
    .filter((item) => active.value === 'all' || item.status === active.value)
    .slice()
    .sort((a, b) => b.id - a.id),
)
// 打开装修项目详情
const open = (id: number) =>
  uni.navigateTo({ url: `/pages-sub/my/renovationOrderDetail/renovationOrderDetail?id=${id}` })

onLoad((query) => {
  // 页面参数指定的初始筛选状态
  const value = query?.status as Filter
  if (filters.some((item) => item.value === value)) active.value = value
})
</script>
<template>
  <view class="page">
    <view class="tabs">
      <view
        v-for="item in filters"
        :key="item.value"
        class="tab-item"
        :class="{ active: active === item.value }"
        @click="active = item.value"
      >
        {{ item.label }}
      </view>
    </view>

    <scroll-view class="scroll" scroll-y :show-scrollbar="false">
      <view class="content">
        <view class="count">共 {{ list.length }} 个装修项目</view>

        <view class="project-list">
          <view v-for="item in list" :key="item.id" class="card" @click="open(item.id)">
            <view class="head">
              <view class="project-copy">
                <text class="title">{{ item.name }}</text>
                <text class="project-no">{{ item.projectNo }}</text>
              </view>
              <text :class="['status', `status-${item.status}`]">
                {{ projectStatusText[item.status] }}
              </text>
            </view>

            <view class="project-info">
              <view class="line address-line">
                <text class="label">服务地址</text>
                <text class="value">{{ item.serviceAddress }}</text>
              </view>
              <view class="line">
                <text class="label">预估金额</text>
                <text class="amount">¥{{ item.quotedAmount.toFixed(2) }}</text>
              </view>
            </view>

            <view class="card-footer">
              <text class="footer-copy">点击查看项目详情与服务进度</text>
              <text class="arrow">›</text>
            </view>
          </view>
        </view>

        <view v-if="!list.length" class="empty">暂无相关装修项目</view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.tabs {
  display: flex;
  height: 98rpx;
  margin: 24rpx 24rpx 0;
  padding: 0 24rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-radius: 18rpx;
  box-shadow: 0 6rpx 22rpx rgba(89, 65, 46, 0.035);
}

.tab-item {
  display: flex;
  height: 46rpx;
  padding: 0 30rpx;
  align-items: center;
  justify-content: center;
  color: #666666;
  font-size: 24rpx;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 25rpx;
}

.tab-item.active {
  color: #e52e24;
  background: #fff0ef;
}

.scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.content {
  padding: 24rpx 24rpx calc(52rpx + env(safe-area-inset-bottom));
}

.count {
  color: #aaaaaa;
  font-size: 23rpx;
  line-height: 34rpx;
}

.project-list {
  margin-top: 24rpx;
}

.card {
  padding: 20rpx 24rpx 0;
  background: #ffffff;
  border: 1rpx solid rgba(114, 89, 69, 0.045);
  border-radius: 20rpx;
  box-shadow: 0 5rpx 18rpx rgba(72, 52, 38, 0.03);
}

.card + .card {
  margin-top: 24rpx;
}

.head {
  display: flex;
  min-height: 78rpx;
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
  font-size: 27rpx;
  font-weight: 600;
  line-height: 38rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-no {
  margin-top: 2rpx;
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

.project-info {
  padding: 22rpx 0 20rpx;
  border-top: 2rpx solid #f0efed;
  border-bottom: 2rpx solid #f0efed;
}

.line {
  display: flex;
  min-height: 38rpx;
  align-items: flex-start;
  justify-content: space-between;
  font-size: 24rpx;
  line-height: 36rpx;
}

.line + .line {
  margin-top: 14rpx;
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

.card-footer {
  display: flex;
  min-height: 68rpx;
  align-items: center;
  justify-content: space-between;
}

.footer-copy {
  color: #bbbbbb;
  font-size: 22rpx;
  line-height: 32rpx;
}

.arrow {
  color: #b6b1ad;
  font-size: 34rpx;
  font-weight: 300;
  line-height: 34rpx;
}

.empty {
  padding: 180rpx 0;
  color: #aaaaaa;
  font-size: 24rpx;
  text-align: center;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectPlanCandidate } from '@/types/project-quote'
import { lineCents, moneyText, quoteTotals } from '@/utils/project-quote'
const props = defineProps<{
  plan: ProjectPlanCandidate
  active?: boolean
  expanded?: boolean
  selecting?: boolean
}>()
defineEmits<{ (event: 'toggle'): void; (event: 'select'): void }>()
const productCount = computed(
  () => props.plan.items.filter((item) => item.category === 'product').length,
)
const serviceCount = computed(() => props.plan.items.length - productCount.value)
</script>
<template>
  <view class="plan-card" :class="{ active }">
    <view class="plan-main">
      <image v-if="plan.cover" class="plan-cover" :src="plan.cover" mode="aspectFill" />
      <view v-else class="plan-cover plan-placeholder">方案</view>
      <view class="plan-info">
        <view class="title-row"
          ><view class="plan-name">{{ plan.name }}</view
          ><text v-if="active" class="current">当前方案</text></view
        >
        <view class="description">{{ plan.description }}</view>
        <view class="tags"
          ><text>商品 {{ productCount }} 项</text><text>服务 {{ serviceCount }} 项</text></view
        >
      </view>
    </view>
    <view class="plan-toolbar">
      <view class="detail-link" @click="$emit('toggle')">
        <text>{{ expanded ? '收起明细' : '查看明细' }}</text>
      </view>
      <view class="action"
        ><view class="price"
          ><text>参考价</text>¥{{
            moneyText(quoteTotals({ items: plan.items, discount: '0' }).total)
          }}</view
        ><button :disabled="active || selecting" @click="$emit('select')">
          {{ active ? '已选择' : '使用方案' }}
        </button></view
      >
    </view>
    <view v-if="expanded" class="detail-list">
      <view v-for="item in plan.items" :key="item.id" class="detail-row"
        ><view
          ><text class="kind">{{ item.category === 'product' ? '商品' : '服务' }}</text
          ><text class="name">{{ item.name }}</text></view
        ><text>×{{ item.quantity }} · ¥{{ moneyText(lineCents(item)) }}</text></view
      >
    </view>
  </view>
</template>
<style scoped lang="scss">
.plan-card {
  padding: 24rpx;
  margin-bottom: 20rpx;
  background: #fff;
  border: 2rpx solid transparent;
  border-radius: 18rpx;
  box-shadow: 0 5rpx 18rpx rgba(48, 35, 30, 0.045);
}
.plan-card.active {
  border-color: rgba(229, 45, 36, 0.55);
}
.plan-main {
  display: flex;
  gap: 22rpx;
}
.plan-cover {
  width: 176rpx;
  height: 150rpx;
  flex: 0 0 176rpx;
  border-radius: 12rpx;
  background: #f5f3f1;
}
.plan-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 24rpx;
}
.plan-info {
  min-width: 0;
  flex: 1;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.plan-name {
  overflow: hidden;
  flex: 1;
  font-size: 29rpx;
  line-height: 42rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.current {
  flex-shrink: 0;
  padding: 4rpx 10rpx;
  color: #d92d20;
  background: #fff1ef;
  border-radius: 6rpx;
  font-size: 19rpx;
}
.description {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 8rpx;
  color: #777;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 34rpx;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.tags {
  display: flex;
  gap: 10rpx;
  margin-top: 13rpx;
}
.tags text {
  padding: 4rpx 10rpx;
  color: #777;
  background: #f6f5f3;
  border-radius: 6rpx;
  font-size: 20rpx;
}
.plan-toolbar {
  display: flex;
  min-height: 64rpx;
  margin-top: 18rpx;
  padding-top: 18rpx;
  align-items: center;
  justify-content: space-between;
  border-top: 1rpx solid #f0efed;
}
.detail-link {
  color: #777;
  font-size: 23rpx;
  font-weight: 400;
}
.action {
  display: flex;
  align-items: center;
  gap: 18rpx;
}
.price {
  color: #e52d24;
  font-size: 28rpx;
}
.price > text {
  margin-right: 7rpx;
  color: #999;
  font-size: 20rpx;
  font-weight: 400;
}
button {
  width: auto;
  height: 50rpx;
  padding: 0 22rpx;
  margin: 0;
  color: #fff;
  background: #e52d24;
  border-radius: 25rpx;
  font-size: 21rpx;
  line-height: 50rpx;
}
button[disabled] {
  color: #d92d20;
  background: #fff1ef;
}
button::after {
  border: 0;
}
.detail-list {
  margin-top: 18rpx;
  padding: 6rpx 18rpx;
  background: #f8f7f5;
  border-radius: 12rpx;
}
.detail-row {
  display: flex;
  padding: 17rpx 0;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  color: #777;
  border-bottom: 1rpx solid #eceae8;
  font-size: 22rpx;
  font-weight: 400;
}
.detail-row:last-child {
  border-bottom: 0;
}
.detail-row > view {
  min-width: 0;
  display: flex;
  align-items: center;
}
.kind {
  flex-shrink: 0;
  margin-right: 10rpx;
  padding: 3rpx 8rpx;
  color: #d92d20;
  background: #fff1ef;
  border-radius: 5rpx;
  font-size: 18rpx;
}
.name {
  overflow: hidden;
  color: #444;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-row > text {
  flex-shrink: 0;
}
</style>

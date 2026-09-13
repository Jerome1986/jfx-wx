<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectQuote } from '@/types/project-quote'
import { moneyText, quoteTotals } from '@/utils/project-quote'
const props = defineProps<{ quote: ProjectQuote }>()
const totals = computed(() => quoteTotals(props.quote))
</script>
<template>
  <view class="summary">
    <view class="row"
      ><text>报价明细</text><text>{{ quote.items.length }} 项</text></view
    >
    <view class="row"
      ><text>商品小计</text><text>¥{{ moneyText(totals.product) }}</text></view
    >
    <view class="row"
      ><text>施工服务小计</text><text>¥{{ moneyText(totals.service) }}</text></view
    >
    <view class="row"
      ><text>优惠减免</text><text>− ¥{{ moneyText(totals.discount) }}</text></view
    >
    <view class="row total"
      ><text>最终报价</text><text>¥{{ moneyText(totals.total) }}</text></view
    >
  </view>
</template>
<style scoped lang="scss">
.row {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 20rpx;
  color: #777;
  font-size: 26rpx;
}
.total {
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
  color: #d92d20;
  font-size: 32rpx;
}
</style>

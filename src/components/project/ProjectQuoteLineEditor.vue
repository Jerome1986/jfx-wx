<script setup lang="ts">
import type { ProjectQuoteLine } from '@/types/project-quote'

defineProps<{ item: ProjectQuoteLine; replaceable?: boolean }>()
const emit = defineEmits<{
  replace: []
  remove: []
  quantityChange: [value: string]
}>()

const changeQuantity = (event: { detail: { value: string } }) => {
  emit('quantityChange', event.detail.value)
}
</script>

<template>
  <view class="editor-card">
    <view class="editor-head">
      <text class="category">{{ item.category === 'product' ? '主材' : '人工/辅材' }}</text>
      <text class="remove" @click="$emit('remove')">删除</text>
    </view>
    <view class="item-name">{{ item.name }}</view>
    <view class="item-description"
      >{{ item.businessCategory }} · {{ item.description || '暂无说明' }}</view
    >
    <view class="field-pair locked-fields">
      <view
        ><text>标准单价</text><text>¥{{ item.unitPrice }}/{{ item.unit }}</text></view
      >
      <view class="quantity"
        ><text>施工数量</text
        ><input :value="item.quantity" type="digit" placeholder="1" @input="changeQuantity"
      /></view>
    </view>
    <button v-if="replaceable" class="replace" @click="$emit('replace')">从同类项目中替换</button>
  </view>
</template>

<style scoped lang="scss">
.editor-card {
  margin-bottom: 18rpx;
  padding: 22rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(48, 35, 30, 0.035);
}
.editor-head,
.field-pair {
  display: flex;
  align-items: center;
}
.editor-head {
  justify-content: space-between;
  margin-bottom: 8rpx;
}
.category {
  padding: 7rpx 16rpx;
  color: #d92d20;
  font-size: 21rpx;
  background: #fff0ef;
  border-radius: 18rpx;
}
.remove {
  color: #999;
  font-size: 22rpx;
}
.item-name {
  margin-top: 16rpx;
  color: #332e2b;
  font-size: 27rpx;
}
.item-description {
  margin-top: 8rpx;
  color: #999;
  font-size: 21rpx;
  line-height: 32rpx;
}
.locked-fields {
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #f0eeec;
}
.locked-fields > view {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  color: #999;
  font-size: 20rpx;
}
.locked-fields > view > text:last-child {
  color: #333;
  font-size: 23rpx;
}
.quantity {
  align-items: flex-end;
}
.quantity input {
  width: 150rpx;
  height: 54rpx;
  padding: 0 14rpx;
  text-align: right;
  background: #f8f7f5;
  border-radius: 8rpx;
}
.replace {
  width: auto;
  height: 52rpx;
  margin: 18rpx 0 0 auto;
  padding: 0 20rpx;
  color: #d92d20;
  font-size: 21rpx;
  line-height: 52rpx;
  background: #fff0ef;
  border-radius: 26rpx;
}
.replace::after {
  border: 0;
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CancelProjectInput } from '@/types/project'

const props = defineProps<{
  visible: boolean
  status: 'PENDING_CONFIRM' | 'IN_SERVICE'
  submitting: boolean
}>()
const emit = defineEmits<{ close: []; submit: [input: CancelProjectInput] }>()
const reason = ref('')
const agreed = ref(false)
const presets = ['客户暂缓装修', '报价未达成一致', '客户需求变更', '线下协商终止']
const valid = computed(
  () =>
    !!reason.value.trim() &&
    reason.value.trim().length <= 500 &&
    (props.status !== 'IN_SERVICE' || agreed.value),
)

// 每次重新打开清空表单；提交失败时保持弹窗和当前输入。
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      reason.value = ''
      agreed.value = false
    }
  },
)
// 关闭入口在请求期间锁定。
const close = () => {
  if (!props.submitting) emit('close')
}
// 提交完整原因以及打开操作时对应的状态。
const submit = () => {
  if (!valid.value || props.submitting) return
  emit('submit', { reason: reason.value.trim(), expectedStatus: props.status })
}
</script>

<template>
  <wd-popup
    :model-value="visible"
    position="bottom"
    round
    safe-area-inset-bottom
    :close-on-click-modal="false"
    @close="close"
  >
    <view class="cancel-sheet">
      <view class="sheet-title">取消项目</view>
      <view class="sheet-description">请先与客户沟通，并记录取消原因。</view>
      <view class="notice">{{
        status === 'IN_SERVICE'
          ? '该项目正在服务中，请先在线下协商施工及费用处理，再取消项目。'
          : '取消后将停止当前项目，客户将无法继续确认报价。'
      }}</view>
      <view class="field-title">取消原因<text class="required">必填</text></view>
      <view class="presets">
        <button
          v-for="item in presets"
          :key="item"
          class="preset"
          :class="{ selected: reason === item }"
          :disabled="submitting"
          @click="reason = item"
        >
          {{ item }}
        </button>
      </view>
      <view class="input-wrap">
        <textarea
          v-model="reason"
          :disabled="submitting"
          :maxlength="500"
          placeholder="选择常用原因，或填写具体沟通情况"
        />
        <view class="count">{{ reason.length }}/500</view>
      </view>
      <label
        v-if="status === 'IN_SERVICE'"
        class="agreement"
        @click="!submitting && (agreed = !agreed)"
      >
        <checkbox :checked="agreed" :disabled="submitting" color="#d92d20" />
        <text>已与客户线下协商一致</text>
      </label>
      <view class="sheet-actions">
        <button class="keep" :disabled="submitting" @click="close">暂不取消</button>
        <button
          class="confirm"
          :disabled="!valid || submitting"
          :loading="submitting"
          @click="submit"
        >
          {{ submitting ? '提交中' : '确认取消项目' }}
        </button>
      </view>
    </view>
  </wd-popup>
</template>

<style scoped lang="scss">
.cancel-sheet {
  padding: 32rpx 28rpx 24rpx;
  background: #fff;
}
.sheet-title {
  color: #2a2522;
  font-size: 32rpx;
  font-weight: 600;
}
.sheet-description {
  margin-top: 10rpx;
  color: #8b837e;
  font-size: 24rpx;
}
.notice {
  margin-top: 24rpx;
  padding: 18rpx 20rpx;
  color: #8a643e;
  background: #faf6f0;
  border-radius: 12rpx;
  font-size: 23rpx;
  line-height: 1.6;
}
.field-title {
  margin-top: 28rpx;
  color: #38322f;
  font-size: 26rpx;
}
.required {
  margin-left: 12rpx;
  color: #d92d20;
  font-size: 21rpx;
}
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}
.preset {
  margin: 0;
  padding: 0 18rpx;
  line-height: 52rpx;
  font-size: 22rpx;
  color: #777;
  background: #f7f6f5;
  border-radius: 8rpx;
}
.preset.selected {
  color: #d92d20;
  background: #fff0ee;
}
.input-wrap {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #f8f7f5;
  border-radius: 12rpx;
}
textarea {
  width: 100%;
  height: 144rpx;
  font-size: 25rpx;
  line-height: 1.6;
}
.count {
  margin-top: 10rpx;
  color: #aaa;
  font-size: 21rpx;
  text-align: right;
}
.agreement {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 20rpx;
  color: #777;
  font-size: 23rpx;
}
.agreement checkbox {
  transform: scale(0.8);
}
.sheet-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 28rpx;
}
.sheet-actions button {
  flex: 1;
  margin: 0;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
}
.keep {
  color: #777;
  background: #f5f4f3;
}
.confirm {
  color: #fff;
  background: #d92d20;
}
.confirm[disabled] {
  color: #fff;
  opacity: 0.45;
  background: #d92d20;
}
button::after {
  border: 0;
}
</style>

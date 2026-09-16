<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { UpdateAppointmentRequirementInput } from '@/types/appointment'
import type { Appointment } from '@/types/renovation-business'

const props = defineProps<{ appointment: Appointment; editable: boolean; saving: boolean }>()
const emit = defineEmits<{ save: [value: UpdateAppointmentRequirementInput] }>()
const form = reactive({
  customerName: '',
  houseType: '',
  city: '',
  area: '',
  roomLayout: '',
  demand: '',
  focus: '',
})

watch(
  () => props.appointment,
  (item) =>
    Object.assign(form, {
      customerName: item.customerName || '',
      houseType: item.houseType || '',
      city: item.city || '',
      area: item.area || '',
      roomLayout: item.roomLayout || '',
      demand: item.demand || '',
      focus: item.focus || '',
    }),
  { immediate: true },
)

// 当前表单是否已经保存过房屋信息
const hasSavedRequirement = computed(() =>
  [
    props.appointment.customerName,
    props.appointment.houseType,
    props.appointment.city,
    props.appointment.area,
    props.appointment.roomLayout,
    props.appointment.demand,
    props.appointment.focus,
  ].some((value) => value !== null && value !== undefined && String(value).trim()),
)

// 对比当前表单与接口数据，避免重复保存未改变的内容
const requirementChanged = computed(() => {
  const current = [
    props.appointment.customerName,
    props.appointment.houseType,
    props.appointment.city,
    props.appointment.area,
    props.appointment.roomLayout,
    props.appointment.demand,
    props.appointment.focus,
  ].map((value) => String(value ?? '').trim())
  const edited = [
    form.customerName,
    form.houseType,
    form.city,
    form.area,
    form.roomLayout,
    form.demand,
    form.focus,
  ].map((value) => value.trim())
  return current.some((value, index) => value !== edited[index])
})

// 确认后提交新增或修改的房屋信息
const save = async () => {
  if (!requirementChanged.value || props.saving) return
  const modifying = hasSavedRequirement.value
  const confirmed = await new Promise<boolean>((resolve) =>
    uni.showModal({
      title: modifying ? '修改房屋信息' : '保存房屋信息',
      content: modifying
        ? '确认保存本次修改后的客户房屋信息？'
        : '确认保存当前填写的客户房屋信息？',
      confirmText: modifying ? '确认修改' : '确认保存',
      confirmColor: '#D92D20',
      success: ({ confirm }) => resolve(confirm),
      fail: () => resolve(false),
    }),
  )
  if (!confirmed) return
  const area = Number(form.area)
  emit('save', {
    customerName: form.customerName.trim(),
    houseType: form.houseType.trim(),
    city: form.city.trim(),
    area: Number.isFinite(area) && area > 0 ? area : undefined,
    roomLayout: form.roomLayout.trim(),
    demand: form.demand.trim(),
    focus: form.focus.trim(),
  })
}
</script>

<template>
  <view class="card case-card">
    <view class="section-title">意向案例</view>
    <view class="case-main">
      <image
        v-if="appointment.case?.afterImage"
        class="case-cover"
        :src="appointment.case.afterImage"
        mode="aspectFill"
      />
      <view class="case-copy">
        <view class="case-title">{{ appointment.case?.title || '关联案例' }}</view>
        <view class="case-meta">{{
          [
            appointment.case?.city,
            appointment.case?.roomType,
            appointment.case?.area ? `${appointment.case.area}㎡` : '',
            appointment.case?.style,
          ]
            .filter(Boolean)
            .join(' · ') || '案例资料待确认'
        }}</view>
        <view v-if="appointment.case?.totalPrice" class="case-price"
          >参考价 ¥{{ appointment.case.totalPrice }}</view
        >
      </view>
    </view>
  </view>

  <view class="card">
    <view class="section-heading">
      <view class="section-title">客户房屋信息</view>
      <text v-if="editable" class="edit-tip">沟通后补录</text>
      <text v-else class="edit-tip">已锁定</text>
    </view>
    <template v-if="editable">
      <view class="field"
        ><text>客户姓名</text
        ><input v-model="form.customerName" :maxlength="50" placeholder="请输入客户姓名"
      /></view>
      <view class="field"
        ><text>房屋类型</text
        ><input v-model="form.houseType" :maxlength="50" placeholder="如：旧房"
      /></view>
      <view class="field"
        ><text>所在城市</text
        ><input v-model="form.city" :maxlength="100" placeholder="请输入所在城市"
      /></view>
      <view class="field"
        ><text>房屋面积</text
        ><input v-model="form.area" type="digit" :maxlength="10" placeholder="请输入平方米数"
      /></view>
      <view class="field"
        ><text>房屋户型</text
        ><input v-model="form.roomLayout" :maxlength="100" placeholder="如：三室两厅"
      /></view>
      <view class="field column"
        ><text>预约需求</text
        ><textarea v-model="form.demand" :maxlength="2000" placeholder="记录改造范围与客户需求" />
      </view>
      <view class="field column"
        ><text>关注重点（选填）</text
        ><textarea v-model="form.focus" :maxlength="191" placeholder="如：预算、收纳、施工周期" />
      </view>
      <button
        class="save-button"
        :loading="saving"
        :disabled="saving || !requirementChanged"
        @click="save"
      >
        {{
          saving
            ? hasSavedRequirement
              ? '修改中...'
              : '保存中...'
            : hasSavedRequirement
            ? '修改房屋信息'
            : '保存房屋信息'
        }}
      </button>
      <view v-if="!requirementChanged" class="unchanged-tip">房屋信息未发生变化</view>
    </template>
    <view v-else class="readonly-list">
      <view class="row"
        ><text>客户姓名</text><text>{{ appointment.customerName || '待沟通补充' }}</text></view
      >
      <view class="row"
        ><text>房屋类型</text><text>{{ appointment.houseType || '待沟通补充' }}</text></view
      >
      <view class="row"
        ><text>所在城市</text><text>{{ appointment.city || '待沟通补充' }}</text></view
      >
      <view class="row"
        ><text>房屋面积</text
        ><text>{{ appointment.area ? `${appointment.area}㎡` : '待沟通补充' }}</text></view
      >
      <view class="row"
        ><text>房屋户型</text><text>{{ appointment.roomLayout || '待沟通补充' }}</text></view
      >
      <view class="row"
        ><text>预约需求</text><text>{{ appointment.demand || '待沟通补充' }}</text></view
      >
      <view class="row"
        ><text>关注重点</text><text>{{ appointment.focus || '未填写' }}</text></view
      >
    </view>
  </view>
</template>

<style scoped lang="scss">
.card {
  margin-bottom: 20rpx;
  padding: 26rpx;
  background: #fff;
  border-radius: 18rpx;
}
.section-heading,
.case-main {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 700;
}
.edit-tip {
  color: #999;
  font-size: 21rpx;
}
.case-main {
  margin-top: 20rpx;
  justify-content: flex-start;
}
.case-cover {
  width: 150rpx;
  height: 112rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
}
.case-copy {
  min-width: 0;
}
.case-title {
  color: #333;
  font-size: 27rpx;
  font-weight: 600;
}
.case-meta {
  margin-top: 10rpx;
  color: #888;
  font-size: 21rpx;
  line-height: 1.5;
}
.case-price {
  margin-top: 8rpx;
  color: #d92d20;
  font-size: 23rpx;
}
.field {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
  color: #666;
  font-size: 24rpx;
}
.field > text {
  width: 180rpx;
  flex-shrink: 0;
}
.field input {
  min-width: 0;
  flex: 1;
  text-align: right;
}
.field.column {
  align-items: flex-start;
  flex-direction: column;
  gap: 14rpx;
}
.field.column textarea {
  box-sizing: border-box;
  width: 100%;
  height: 120rpx;
  padding: 16rpx;
  color: #333;
  background: #f7f7f7;
  border-radius: 10rpx;
}
.save-button {
  height: 68rpx;
  margin-top: 24rpx;
  color: #fff;
  font-size: 24rpx;
  line-height: 68rpx;
  background: #d92d20;
  border-radius: 34rpx;
}
.save-button::after {
  border: 0;
}
.save-button[disabled] {
  color: #aaa;
  background: #eee;
}
.unchanged-tip {
  margin-top: 12rpx;
  color: #aaa;
  font-size: 20rpx;
  text-align: center;
}
.row {
  display: flex;
  justify-content: space-between;
  gap: 30rpx;
  margin-top: 20rpx;
  color: #777;
  font-size: 24rpx;
}
.row text:last-child {
  max-width: 70%;
  color: #333;
  text-align: right;
  overflow-wrap: anywhere;
}
</style>

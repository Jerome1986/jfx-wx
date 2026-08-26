<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  appointmentStatusText,
  appointmentTypeText,
  useRenovationBusinessStore,
} from '@/stores/modules/renovation-business'
import { getAppointmentSummary } from '@/utils/appointment'
const props = defineProps<{ appointmentId: number }>()
const store = useRenovationBusinessStore()
const appointment = computed(() => store.getAppointment(props.appointmentId))
const followText = ref('')
const nextFollowAt = ref('')
const visitDate = ref('2026-08-22')
const timeSlot = ref('10:00-12:00')
const visitAddress = ref('武汉市洪山区珞瑜路88号')
const records = computed(() =>
  store.followUps
    .filter((item) => item.appointmentId === props.appointmentId)
    .sort((a, b) => b.id - a.id),
)
const convertedProject = computed(() =>
  store.projects.find((item) => item.appointmentId === props.appointmentId),
)
watch(
  appointment,
  (item) => {
    if (!item) return
    visitDate.value = item.visitDate || visitDate.value
    timeSlot.value = item.timeSlot || timeSlot.value
    visitAddress.value = item.visitAddress || visitAddress.value
  },
  { immediate: true },
)
const addFollow = () => {
  const result = store.addFollowUp({
    appointmentId: props.appointmentId,
    employeeId: 1,
    content: followText.value,
    nextFollowAt: nextFollowAt.value || undefined,
  })
  if (!result) {
    uni.showToast({ title: '请输入跟进内容', icon: 'none' })
    return
  }
  followText.value = ''
  uni.showToast({ title: '跟进已记录', icon: 'success' })
}
const confirm = () => {
  if (!visitDate.value || !timeSlot.value || !visitAddress.value) {
    uni.showToast({ title: '请完善上门安排', icon: 'none' })
    return
  }
  if (
    store.confirmVisit(props.appointmentId, {
      visitDate: visitDate.value,
      timeSlot: timeSlot.value,
      visitAddress: visitAddress.value,
      followUp: followText.value,
    })
  ) {
    followText.value = ''
    uni.showToast({ title: '已确认上门', icon: 'success' })
  }
}
const complete = () => {
  if (store.completeAppointment(props.appointmentId))
    uni.showToast({ title: '预约服务已完成', icon: 'success' })
}
const convert = () => {
  const project = store.convertToRenovationProject(props.appointmentId)
  uni.showToast({
    title: project
      ? convertedProject.value
        ? '已关联装修项目'
        : '已转装修项目'
      : '当前状态不可转化',
    icon: project ? 'success' : 'none',
  })
}
const call = () => appointment.value && uni.makePhoneCall({ phoneNumber: appointment.value.mobile })
const summary = () =>
  appointment.value &&
  getAppointmentSummary(appointment.value, appointmentTypeText[appointment.value.type])
</script>
<template>
  <view v-if="appointment" class="page"
    ><scroll-view class="scroll" scroll-y
      ><view class="content">
        <view class="card hero"
          ><view
            ><view class="title">{{ appointmentTypeText[appointment.type] }}</view
            ><view class="sub"
              >{{ appointment.appointmentNo }} · {{ appointment.source }}</view
            ></view
          ><text class="status">{{ appointmentStatusText[appointment.status] }}</text></view
        >
        <view class="card"
          ><view class="section-title">客户与预约信息</view
          ><view class="row"
            ><text>客户</text
            ><text @click="call"
              >{{ appointment.customerName }} {{ appointment.mobile }}</text
            ></view
          ><view class="row"
            ><text>需求</text><text>{{ summary() }}</text></view
          ><view class="row"
            ><text>关注重点</text><text>{{ appointment.focus || '待沟通确认' }}</text></view
          ></view
        >
        <view class="card"
          ><view class="section-title">跟进记录</view
          ><textarea v-model="followText" maxlength="300" placeholder="记录本次沟通内容" /><input
            v-model="nextFollowAt"
            placeholder="下次跟进时间（选填）"
          /><button class="secondary" @click="addFollow">保存跟进</button
          ><view v-for="item in records" :key="item.id" class="record"
            ><view>{{ item.content }}</view
            ><text
              >{{ item.createdAt
              }}<template v-if="item.nextFollowAt"> · 下次 {{ item.nextFollowAt }}</template></text
            ></view
          ></view
        >
        <view v-if="appointment.status === 'PENDING_CONTACT'" class="card"
          ><view class="section-title">确认上门安排</view
          ><input v-model="visitDate" placeholder="上门日期" /><input
            v-model="timeSlot"
            placeholder="上门时段"
          /><input v-model="visitAddress" placeholder="上门地址" /><button
            class="primary"
            @click="confirm"
          >
            确认预约并进入待上门
          </button></view
        >
        <view v-if="appointment.status === 'PENDING_VISIT'" class="card"
          ><view class="section-title">上门安排</view
          ><view class="row"
            ><text>时间</text
            ><text>{{ appointment.visitDate }} {{ appointment.timeSlot }}</text></view
          ><view class="row"
            ><text>地址</text><text>{{ appointment.visitAddress }}</text></view
          ><button class="primary" @click="complete">标记服务完成</button></view
        >
        <view v-if="appointment.status === 'COMPLETED'" class="card"
          ><view class="section-title">预约转化</view
          ><view class="hint">确认客户成交后，将预约转为正式装修项目。</view
          ><button class="primary" :disabled="!!convertedProject" @click="convert">
            {{ convertedProject ? `已转项目 ${convertedProject.projectNo}` : '转为装修项目' }}
          </button></view
        >
      </view></scroll-view
    ></view
  ><view v-else class="empty">预约不存在</view>
</template>
<style lang="scss">
.page {
  height: 100vh;
  background: #f8f7f5;
}
.scroll {
  height: 100%;
}
.content {
  padding: 24rpx 24rpx 60rpx;
}
.card {
  margin-bottom: 20rpx;
  padding: 26rpx;
  background: #fff;
  border-radius: 18rpx;
}
.hero {
  display: flex;
  justify-content: space-between;
  border-left: 4rpx solid #d92d20;
}
.title,
.section-title {
  font-size: 30rpx;
  font-weight: 700;
}
.sub,
.hint {
  margin-top: 8rpx;
  color: #888;
  font-size: 23rpx;
}
.status {
  color: #d92d20;
}
.row {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
  color: #777;
  font-size: 24rpx;
}
.row text:last-child {
  max-width: 70%;
  color: #333;
  text-align: right;
}
textarea,
input {
  box-sizing: border-box;
  width: 100%;
  margin-top: 18rpx;
  padding: 18rpx;
  background: #f7f7f7;
  border-radius: 10rpx;
  font-size: 24rpx;
}
textarea {
  height: 130rpx;
}
.primary,
.secondary {
  margin-top: 20rpx;
  border-radius: 40rpx;
  font-size: 25rpx;
}
.primary {
  color: #fff;
  background: #d92d20;
}
.secondary {
  color: #d92d20;
  background: #fff4f3;
}
.primary::after,
.secondary::after {
  border: 0;
}
.record {
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #eee;
  font-size: 24rpx;
}
.record text {
  display: block;
  margin-top: 8rpx;
  color: #999;
  font-size: 21rpx;
}
.empty {
  padding-top: 200rpx;
  text-align: center;
}
</style>

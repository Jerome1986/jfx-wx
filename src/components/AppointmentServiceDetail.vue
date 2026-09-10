<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  appointmentComplete,
  appointmentConfirmVisit,
  appointmentFollowUp,
  getAppointmentDetailApi,
} from '@/api/appointment'
import { appointmentStatusText, appointmentTypeText } from '@/stores/modules/renovation-business'
import type { Appointment } from '@/types/renovation-business'
import { formatDateTime } from '@/utils/format'
// 页面传入的预约编号
const props = defineProps<{ appointmentId: number }>()
// 当前预约详情
const appointment = ref<Appointment>()
// 详情加载状态
const loading = ref(false)
// 详情加载失败状态
const loadFailed = ref(false)
// 待提交的跟进内容
const followText = ref('')
// 跟进记录提交状态
const followSubmitting = ref(false)
// 最近一次跟进是否保存成功
const followSaved = ref(false)
// 确认上门提交状态
const visitSubmitting = ref(false)
// 标记服务完成提交状态
const completeSubmitting = ref(false)
// 日历组件实例
const calendarRef = ref<any>()
// 计划上门日期
const visitDate = ref('')
// 日历当前值
const calendarValue = ref(Date.now())
// 日历最小可选日期
const minDate = new Date().setHours(0, 0, 0, 0)
// 日历最大可选日期
const maxDate = new Date(minDate).setDate(new Date(minDate).getDate() + 60)
// 可选上门时段
const timeSlots = [
  { value: '09:00-12:00', label: '上午' },
  { value: '13:00-16:00', label: '下午' },
  { value: '16:00-19:00', label: '傍晚' },
  { value: '19:00-21:00', label: '晚间' },
]
// 计划上门时段
const timeSlot = ref('')
// 员工确认后的上门地址
const visitAddress = ref('')
// 当前预约的跟进记录
const records = computed(() =>
  [...(appointment.value?.followUps || [])].sort((a, b) => b.id - a.id),
)
// 当前预约关联的装修项目
const convertedProject = computed(() => appointment.value?.project)
// 方案明细列表
const planItems = computed(() => appointment.value?.snapshot?.items || [])
// 确认上门所需数据是否完整
const canConfirmVisit = computed(() =>
  Boolean(visitAddress.value.trim() && visitDate.value && timeSlot.value),
)
// 确认上门请求参数
const confirmVisitPayload = computed(() => ({
  visitDate: visitDate.value,
  timeSlot: timeSlot.value,
  visitAddress: visitAddress.value.trim(),
}))
// 将日期字符串转换成本地时间戳
const parseLocalDate = (value?: string) => {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  const date = new Date(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}
// 将日历时间戳格式化为接口日期
const formatLocalDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
// 打开上门日期选择器
const openCalendar = () => calendarRef.value?.open()
// 确认日历日期
const confirmCalendarDate = ({ value }: { value: number | number[] }) => {
  if (typeof value !== 'number') return
  calendarValue.value = value
  visitDate.value = formatLocalDate(value)
}
// 加载后端预约详情
const loadAppointmentDetail = async () => {
  if (!Number.isInteger(props.appointmentId) || props.appointmentId <= 0) return
  loading.value = true
  loadFailed.value = false
  try {
    const { data } = await getAppointmentDetailApi(props.appointmentId)
    appointment.value = data
  } catch (error) {
    console.error('获取员工预约详情失败：', error)
    appointment.value = undefined
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}
watch(
  () => props.appointmentId,
  (appointmentId) => {
    if (appointmentId > 0) loadAppointmentDetail()
  },
  { immediate: true },
)
watch(appointment, (item) => {
  visitDate.value = item?.visitDate || ''
  timeSlot.value = item?.timeSlot || ''
  visitAddress.value = item?.visitAddress || item?.serviceAddress || ''
  const visitTimestamp = parseLocalDate(item?.visitDate)
  calendarValue.value = visitTimestamp || minDate
})
watch(followText, () => {
  followSaved.value = false
})
// 提示员工操作接口尚未接入
const showActionPending = () => {
  uni.showToast({ title: '该操作接口待对接', icon: 'none' })
}
// 保存预约跟进记录
const addFollow = async () => {
  const content = followText.value.trim()
  if (!content) {
    uni.showToast({ title: '请输入跟进内容', icon: 'none' })
    return
  }
  if (!appointment.value?.employeeId || followSubmitting.value) {
    uni.showToast({ title: '当前无权限', icon: 'none' })
    return
  }
  followSubmitting.value = true
  followSaved.value = false
  try {
    await appointmentFollowUp(appointment.value.id, content, appointment.value.employeeId)
    followText.value = ''
    const { data } = await getAppointmentDetailApi(appointment.value.id)
    appointment.value = data
    followSaved.value = true
    uni.showToast({ title: '跟进记录已保存', icon: 'success' })
  } catch (error) {
    console.error('保存预约跟进失败：', error)
  } finally {
    followSubmitting.value = false
  }
}
// 确认预约上门安排
const confirm = async () => {
  const currentAppointment = appointment.value
  if (!currentAppointment || visitSubmitting.value) return
  if (currentAppointment.status !== 'PENDING_CONTACT') return
  if (!canConfirmVisit.value) {
    uni.showToast({ title: '请完善上门安排', icon: 'none' })
    return
  }
  visitSubmitting.value = true
  try {
    const { visitDate, timeSlot, visitAddress } = confirmVisitPayload.value
    const { data } = await appointmentConfirmVisit(
      currentAppointment.id,
      visitDate,
      timeSlot,
      visitAddress,
    )
    if (props.appointmentId !== currentAppointment.id || !appointment.value) return
    appointment.value = {
      ...appointment.value,
      status: data.status,
      visitDate: data.visitDate.slice(0, 10),
      timeSlot: data.timeSlot,
      visitAddress: data.visitAddress,
      updatedAt: data.updatedAt,
    }
    uni.showToast({ title: '已确认上门安排', icon: 'success' })
  } catch (error) {
    console.error('确认预约上门失败：', error)
  } finally {
    visitSubmitting.value = false
  }
}
// 标记预约服务完成
const complete = async () => {
  const currentAppointment = appointment.value
  if (!currentAppointment || completeSubmitting.value) return
  if (currentAppointment.status !== 'PENDING_VISIT') return
  completeSubmitting.value = true
  try {
    const { data, code } = await appointmentComplete(currentAppointment.id)
    if (code === 400) return
    if (props.appointmentId !== currentAppointment.id || !appointment.value) return
    appointment.value = {
      ...appointment.value,
      status: data.status,
      completedAt: data.completedAt,
      updatedAt: data.updatedAt,
    }
    uni.showToast({ title: '服务已完成', icon: 'success' })
  } catch (error) {
    console.error('标记预约服务完成失败：', error)
  } finally {
    completeSubmitting.value = false
  }
}
// 将已完成预约转为装修项目
const convert = () => showActionPending()
// 拨打客户电话
const call = () => appointment.value && uni.makePhoneCall({ phoneNumber: appointment.value.mobile })
</script>
<template>
  <view v-if="loading" class="empty">正在加载预约详情...</view>
  <view v-else-if="appointment" class="page"
    ><scroll-view class="scroll" scroll-y>
      <view class="content">
        <view class="card hero">
          <view>
            <view class="title">{{ appointmentTypeText[appointment.type] }}</view>
            <view class="sub"
              >{{ appointment.appointmentNo }} · {{ appointment.source }}</view
            > </view
          ><text class="status">{{ appointmentStatusText[appointment.status] }}</text>
        </view>
        <view class="card">
          <view class="section-title">客户与预约信息</view>
          <view class="row">
            <text>客户</text>
            <view class="customer-contact">
              <text class="customer-name">{{ appointment.customerName }}</text>
              <view class="phone-action" @click="call">
                <text class="phone-number">{{ appointment.mobile }}</text>
                <text class="iconfont icon-dianhua phone-icon" />
              </view>
            </view>
          </view>
          <view class="row"
            ><text>预约来源</text><text>{{ appointment.source }}</text></view
          >
        </view>
        <view class="card">
          <view class="section-title">客户预约内容</view>
          <view class="detail-list">
            <view class="row"
              ><text>房屋类型</text><text>{{ appointment.houseType || '未填写' }}</text></view
            >
            <view class="row"
              ><text>所在城市</text><text>{{ appointment.city || '未填写' }}</text></view
            >
            <view class="row"
              ><text>房屋面积</text
              ><text>{{ appointment.area ? `${appointment.area}㎡` : '未填写' }}</text>
            </view>
            <view class="row"
              ><text>房屋户型</text><text>{{ appointment.roomLayout || '未填写' }}</text></view
            >
            <view class="row"
              ><text>预约需求</text><text>{{ appointment.demand || '未填写' }}</text></view
            >
            <view class="row"
              ><text>关注重点</text><text>{{ appointment.focus || '未填写' }}</text></view
            >
          </view>
          <view v-if="appointment.snapshot" class="snapshot-block">
            <view class="subsection-title">方案快照</view>
            <view class="row"
              ><text>方案名称</text><text>{{ appointment.snapshot.title || '未填写' }}</text></view
            >
            <view class="row"
              ><text>参考金额</text
              ><text>{{
                appointment.snapshot.referencePrice
                  ? `¥${appointment.snapshot.referencePrice}`
                  : '未填写'
              }}</text></view
            >
            <view v-if="planItems.length" class="plan-items">
              <view
                v-for="(item, index) in planItems"
                :key="item.sourceItemId || index"
                class="plan-item"
              >
                <text class="plan-item-name">{{ item.name }}</text>
                <text class="plan-item-quantity"
                  >{{ item.quantity || '-' }}{{ item.unit || '' }}</text
                >
              </view>
            </view>
          </view>
        </view>
        <view class="card">
          <view class="section-title">跟进记录</view>
          <view v-if="!records.length" class="record-empty">暂无跟进记录</view>
          <view v-for="item in records" :key="item.id" class="record">
            <view>{{ item.content }}</view
            ><text
              >{{ formatDateTime(item.createdAt)
              }}<template v-if="item.nextFollowAt">
                · 下次 {{ formatDateTime(item.nextFollowAt) }}</template
              ></text
            >
          </view>
          <view class="follow-editor">
            <view class="subsection-title">新增跟进</view>
            <textarea
              v-model="followText"
              class="follow-textarea"
              :maxlength="300"
              placeholder="记录本次沟通内容"
              placeholder-style="color: #999; font-size: 24rpx;"
            />
            <button
              class="secondary"
              :loading="followSubmitting"
              :disabled="followSubmitting || !followText.trim()"
              @click="addFollow"
            >
              {{ followSubmitting ? '保存中...' : '保存跟进' }}
            </button>
            <view v-if="followSaved" class="follow-success">跟进记录已保存，列表已更新</view>
          </view>
        </view>
        <view v-if="appointment.status === 'PENDING_CONTACT'" class="card">
          <view class="section-title">确认上门安排</view>
          <view class="address-field">
            <text class="schedule-label">上门地址</text>
            <textarea
              v-model="visitAddress"
              class="address-textarea"
              :maxlength="200"
              placeholder="请补充客户上门服务地址"
              placeholder-style="color: #999; font-size: 24rpx;"
            />
            <text v-if="appointment.serviceAddress" class="address-hint">
              已自动带入用户填写的服务地址，可补充门牌号等信息
            </text>
            <text v-else class="address-hint warning"> 用户未填写服务地址，请联系客户后补充 </text>
          </view>
          <view class="schedule-field selectable" @click="openCalendar">
            <text class="schedule-label">上门日期</text>
            <view class="schedule-selection">
              <text :class="['schedule-value', { missing: !visitDate }]">{{
                visitDate || '请选择日期'
              }}</text>
              <text class="iconfont icon-youjiantou schedule-arrow" />
            </view>
          </view>
          <view class="time-section">
            <text class="schedule-label">上门时段</text>
            <view class="time-options">
              <view
                v-for="slot in timeSlots"
                :key="slot.value"
                :class="['time-option', { selected: timeSlot === slot.value }]"
                @click="timeSlot = slot.value"
              >
                <text class="time-label">{{ slot.label }}</text>
                <text class="time-value">{{ slot.value }}</text>
              </view>
            </view>
          </view>
          <button
            class="primary"
            :loading="visitSubmitting"
            :disabled="!canConfirmVisit || visitSubmitting"
            @click="confirm"
          >
            {{ visitSubmitting ? '提交中...' : '确认预约并进入待上门' }}
          </button>
        </view>
        <view v-if="appointment.status === 'PENDING_VISIT'" class="card">
          <view class="section-title">上门安排</view>
          <view class="row"
            ><text>时间</text
            ><text>{{ appointment.visitDate }} {{ appointment.timeSlot }}</text></view
          >
          <view class="row"
            ><text>地址</text><text>{{ appointment.visitAddress }}</text></view
          ><button
            class="primary"
            :loading="completeSubmitting"
            :disabled="completeSubmitting"
            @click="complete"
          >
            {{ completeSubmitting ? '提交中...' : '标记服务完成' }}
          </button>
        </view>
        <view v-if="appointment.status === 'COMPLETED'" class="card">
          <view class="section-title">预约转化</view>
          <view class="hint">确认客户成交后，将预约转为正式装修项目。</view
          ><button class="primary" :disabled="!!convertedProject" @click="convert">
            {{ convertedProject ? `已转项目 ${convertedProject.projectNo}` : '转为装修项目' }}
          </button>
        </view>
      </view>
    </scroll-view></view
  >
  <view v-else class="empty">
    <text>{{ loadFailed ? '预约不存在或无权查看' : '预约不存在' }}</text>
    <button v-if="loadFailed" class="secondary retry" @click="loadAppointmentDetail">
      重新加载
    </button>
  </view>
  <wd-calendar
    ref="calendarRef"
    v-model="calendarValue"
    type="date"
    title="选择上门日期"
    confirm-text="确认日期"
    :min-date="minDate"
    :max-date="maxDate"
    switch-mode="month"
    root-portal
    safe-area-inset-bottom
    custom-style="--wot-primary-6: #D92D20; --wot-primary-7: #C6281D; --wot-calendar-view-color-active: #D92D20;"
    @confirm="confirmCalendarDate"
  />
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

.customer-contact {
  display: flex;
  max-width: 76%;
  flex-direction: column;
  align-items: flex-end;
  color: #333;
}

.customer-name {
  color: #333;
  font-size: 25rpx;
  font-weight: 500;
  line-height: 34rpx;
}

.phone-action {
  display: flex;
  margin-top: 8rpx;
  align-items: center;
  color: #333;
}

.phone-number {
  line-height: 40rpx;
}

.phone-action:active {
  opacity: 0.65;
}

.customer-contact .phone-action .phone-icon {
  display: flex;
  width: 40rpx;
  height: 40rpx;
  max-width: none;
  margin-left: 10rpx;
  justify-content: center;
  align-items: center;
  color: #22a447;
  background: #edf8f0;
  border-radius: 50%;
  text-align: center;
  font-size: 22rpx;
  line-height: 1;
  transform: translateY(-1rpx);
}

.detail-list {
  margin-top: 4rpx;
}

.snapshot-block {
  margin-top: 26rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #eee;
}

.subsection-title {
  color: #333;
  font-size: 27rpx;
  font-weight: 600;
}

.plan-items {
  margin-top: 18rpx;
  padding: 0 18rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
}

.plan-item {
  display: flex;
  min-height: 70rpx;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #e8e8e8;
  font-size: 24rpx;
}

.plan-item:last-child {
  border-bottom: 0;
}

.plan-item-name {
  padding-right: 20rpx;
  color: #333;
}

.plan-item-quantity {
  flex-shrink: 0;
  color: #777;
}

.form-input,
.follow-textarea {
  box-sizing: border-box;
  display: block;
  width: 100%;
  margin-top: 18rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
  font-size: 24rpx;
}

.schedule-field {
  display: flex;
  min-height: 80rpx;
  margin-top: 18rpx;
  padding: 18rpx 20rpx;
  justify-content: space-between;
  align-items: center;
  background: #f7f7f7;
  border-radius: 12rpx;
}

.address-field {
  margin-top: 18rpx;
}

.address-textarea {
  box-sizing: border-box;
  display: block;
  width: 100%;
  height: 120rpx;
  min-height: 120rpx;
  margin-top: 14rpx;
  padding: 18rpx 20rpx;
  color: #333;
  background: #f7f7f7;
  border-radius: 12rpx;
  font-size: 24rpx;
  line-height: 36rpx;
}

.address-hint {
  display: block;
  margin-top: 10rpx;
  color: #999;
  font-size: 21rpx;
  line-height: 32rpx;
}

.address-hint.warning {
  color: #d92d20;
}

.schedule-label {
  flex-shrink: 0;
  color: #777;
  font-size: 24rpx;
}

.schedule-value {
  margin-left: 24rpx;
  color: #333;
  text-align: right;
  font-size: 24rpx;
  line-height: 36rpx;
}

.schedule-value.missing {
  color: #999;
}

.selectable:active {
  opacity: 0.7;
}

.schedule-selection {
  display: flex;
  min-width: 0;
  align-items: center;
}

.schedule-arrow {
  margin-left: 12rpx;
  color: #999;
  font-size: 22rpx;
}

.time-section {
  margin-top: 26rpx;
}

.time-options {
  display: grid;
  margin-top: 16rpx;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.time-option {
  display: flex;
  min-height: 88rpx;
  padding: 12rpx;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #555;
  background: #f7f7f7;
  border: 2rpx solid transparent;
  border-radius: 12rpx;
}

.time-option.selected {
  color: #d92d20;
  background: #fff3f1;
  border-color: #d92d20;
}

.time-label {
  font-size: 24rpx;
  font-weight: 600;
}

.time-value {
  margin-top: 4rpx;
  font-size: 22rpx;
}

.form-input {
  height: 76rpx;
  min-height: 76rpx;
  padding: 0 20rpx;
  line-height: 76rpx;
}

.follow-textarea {
  height: 144rpx;
  min-height: 144rpx;
  padding: 20rpx;
  line-height: 36rpx;
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

.primary[disabled] {
  color: #fff;
  background: #d9d9d9;
  opacity: 1;
}

.secondary {
  color: #d92d20;
  background: #fff4f3;
}

.secondary[disabled] {
  color: #aaa;
  background: #f2f2f2;
  opacity: 1;
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

.follow-success {
  margin-top: 18rpx;
  padding: 16rpx 20rpx;
  color: #15803d;
  background: #f0fdf4;
  border-radius: 12rpx;
  font-size: 23rpx;
}

.follow-editor {
  margin-top: 26rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #eee;
}

.record-empty {
  padding: 30rpx 0 8rpx;
  color: #aaa;
  text-align: center;
  font-size: 23rpx;
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

.retry {
  width: 240rpx;
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { cancelAppointmentApi, getAppointmentDetailApi } from '@/api/appointment'
import { appointmentStatusText } from '@/stores/modules/renovation-business'
import type { Appointment } from '@/types/renovation-business'

// 当前预约 ID
const appointmentId = ref(0)
// 当前预约详情
const appointment = ref<Appointment>()
// 详情加载状态
const loading = ref(true)
// 详情加载失败状态
const loadFailed = ref(false)
// 取消预约提交状态
const canceling = ref(false)
// 是否属于报价类预约
const isQuote = computed(() => ['BUDGET', 'QUOTE'].includes(appointment.value?.type || ''))
// 是否属于量房预约
const isMeasure = computed(() => appointment.value?.type === 'MEASURE')
// 当前预约是否允许取消
const canCancel = computed(() =>
  appointment.value
    ? appointment.value.type === 'PLAN' &&
      ['PENDING_CONTACT', 'PENDING_VISIT'].includes(appointment.value.status)
    : false,
)
// 当前预约的服务标题
const serviceTitle = computed(() => {
  // 当前预约类型
  const type = appointment.value?.type
  if (!type) return ''
  return {
    BUDGET: '房屋报价服务',
    QUOTE: '房屋报价服务',
    MEASURE: '免费量房服务',
    PLAN: '焕新方案预约',
    CASE: '同款案例报价',
    OUTLET: '网点咨询服务',
  }[type]
})

// 当前预约的服务说明
const serviceDescription = computed(() => {
  // 当前预约数据
  const item = appointment.value
  if (!item) return ''
  if (item.type === 'MEASURE') return '顾问将按约定时间上门量房，记录房屋尺寸和基础需求'
  if (isQuote.value) return '顾问会根据您提交的信息，先电话沟通大致报价范围'
  if (item.type === 'PLAN') return '顾问会结合您选择的焕新方案，联系确认现场情况和服务安排'
  if (item.type === 'CASE') return '顾问会参考您选择的案例，沟通同款改造范围与预算'
  return '服务网点会根据您的咨询需求，安排顾问与您进一步联系'
})

// 格式化上门时间
const displayVisitTime = computed(() => {
  // 当前预约数据
  const item = appointment.value
  if (!item?.visitDate) return '待顾问联系确认'
  return `${item.visitDate} ${item.timeSlot || ''}`.trim()
})

// 计算方案明细预估总额
const estimatedTotal = computed(() =>
  appointment.value?.snapshot?.items
    ?.reduce((total, item) => total + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0)
    .toFixed(2),
)

// 提交取消预约请求
const submitCancellation = async () => {
  if (!appointment.value || canceling.value) return
  canceling.value = true
  try {
    const { data } = await cancelAppointmentApi(appointment.value.id)
    appointment.value.status = data.status
    appointment.value.canceledAt = data.canceledAt || undefined
    uni.showToast({ title: '预约已取消', icon: 'success' })
  } catch (error) {
    console.error('取消预约失败：', error)
  } finally {
    canceling.value = false
  }
}

// 确认是否取消当前预约
const cancelAppointment = () => {
  if (canceling.value) return
  uni.showModal({
    title: '取消预约',
    content: '确定取消本次预约吗？',
    confirmText: '确定取消',
    confirmColor: '#D92D20',
    success: ({ confirm }) => {
      if (confirm) submitCancellation()
    },
  })
}
// 联系当前预约顾问
const contactConsultant = () => uni.showToast({ title: '正在联系顾问', icon: 'none' })

// 加载当前预约详情
const loadAppointmentDetail = async () => {
  if (!appointmentId.value) return
  loading.value = true
  loadFailed.value = false
  try {
    const { data } = await getAppointmentDetailApi(appointmentId.value)
    appointment.value = data
  } catch (error) {
    console.error('获取预约详情失败：', error)
    appointment.value = undefined
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  // 页面参数中的预约 ID
  const id = Number(options?.id)
  if (!Number.isInteger(id) || id <= 0) {
    loading.value = false
    loadFailed.value = true
    return
  }
  appointmentId.value = id
  loadAppointmentDetail()
})
</script>

<template>
  <view class="detail-page">
    <view v-if="loading" class="empty-state">正在加载预约详情...</view>
    <scroll-view v-else-if="appointment" class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="service-card" :class="`service-${appointment.status.toLowerCase()}`">
          <view class="service-heading">
            <view class="service-title">{{ serviceTitle }}</view>
            <view class="status-badge" :class="appointment.status.toLowerCase()">
              {{ appointmentStatusText[appointment.status] }}
            </view>
          </view>
          <view class="service-number">服务编号 {{ appointment.appointmentNo }}</view>
          <view class="service-description">{{ serviceDescription }}</view>
        </view>

        <template v-if="isQuote">
          <view class="section-card">
            <view class="section-title">您提交的信息</view>
            <view class="detail-list submitted-list">
              <view class="detail-line"
                ><text class="detail-label">房屋面积</text
                ><text>{{ appointment.area || '待补充' }}㎡</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">户型</text
                ><text>{{ appointment.roomLayout || '待补充' }}</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">所在城市</text
                ><text>{{ appointment.city || '待补充' }}</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">手机号</text><text>{{ appointment.mobile }}</text>
              </view>
            </view>
            <view class="section-tip"
              >以上信息来自{{ appointment.source }}，顾问联系时会进一步确认。</view
            >
          </view>
          <view class="section-card">
            <view class="section-title">报价需求</view>
            <view class="requirement-tags"
              ><text>厨房改造</text><text>老房翻新</text><text>先估预算</text></view
            >
            <view class="section-divider" />
            <view class="detail-line"
              ><text class="detail-label">关注内容</text
              ><text>{{ appointment.focus || '大概费用、工期范围、是否需要上门复核' }}</text></view
            >
            <view class="detail-line"
              ><text class="detail-label">补充说明</text
              ><text>{{ appointment.demand || '想先了解预算，合适后再继续沟通方案' }}</text></view
            >
          </view>
          <view class="section-card">
            <view class="section-title">顾问联系</view>
            <view class="bullet-list">
              <view>预计24小时内电话联系您</view>
              <view>会先核对面积、户型和改造范围</view>
              <view>如需要现场判断，顾问会建议您再预约量房</view>
            </view>
          </view>
          <view class="section-card">
            <view class="section-title">服务说明</view>
            <view class="paragraph"
              >房屋报价服务用于初步了解预算范围，不等同于正式装修报价。若后续继续推进，顾问会协助进入装修订单确认方案、地址和报价。</view
            >
          </view>
          <view class="section-card">
            <view class="section-title">温馨提示</view>
            <view class="paragraph">请保持电话畅通；若手机号或房屋信息有误，请联系客服处理。</view>
          </view>
        </template>

        <template v-else-if="isMeasure">
          <view class="section-card">
            <view class="section-title">上门安排</view>
            <view class="detail-list">
              <view class="detail-line"
                ><text class="detail-label">上门时间</text><text>{{ displayVisitTime }}</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">联系人</text
                ><text>{{ appointment.customerName }} {{ appointment.mobile }}</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">服务地址</text
                ><text>{{ appointment.visitAddress || '待顾问联系确认' }}</text></view
              >
            </view>
            <view class="section-tip">以上安排由顾问联系确认，如有变化请及时沟通。</view>
          </view>
          <view class="section-card">
            <view class="section-title">房屋需求</view>
            <view class="requirement-tags"
              ><text>厨房改造</text><text>老房翻新</text
              ><text>{{ appointment.area || '待确认' }}㎡</text></view
            >
            <view class="requirement-list">
              <view class="detail-line"
                ><text class="detail-label">房屋情况</text
                ><text>{{ appointment.demand || '待沟通房屋现状与改造范围' }}</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">期望服务</text
                ><text>先上门量房，再根据现场情况沟通方案</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">备注</text
                ><text>{{ appointment.focus || '希望重点了解尺寸、收纳和水电位置' }}</text></view
              >
            </view>
          </view>
          <view class="section-card">
            <view class="section-title">量房内容</view>
            <view class="bullet-list">
              <view>测量房屋基础尺寸</view>
              <view>了解现有布局和改造想法</view>
              <view>记录现场问题，方便后续方案沟通</view>
              <view>根据实际情况沟通预算范围</view>
            </view>
          </view>
          <view class="section-card">
            <view class="section-title">上门准备</view>
            <view class="paragraph"
              >请提前确认家中有人接待，并尽量准备户型图、想改造的位置、预算范围或参考图片，方便顾问更快了解需求。</view
            >
          </view>
          <view class="section-card">
            <view class="section-title">服务说明</view>
            <view class="paragraph"
              >免费量房是一次上门服务，量房完成后，本次预约服务结束；如继续推进，顾问会协助您沟通下一步。</view
            >
          </view>
        </template>

        <template v-else-if="appointment.type === 'PLAN'">
          <view class="section-card">
            <view class="section-title">焕新方案</view>
            <view class="snapshot-heading">{{
              appointment.snapshot?.title || appointment.demand
            }}</view>
            <view class="requirement-tags"
              ><text>空间焕新</text><text>方案预约</text
              ><text v-if="appointment.snapshot?.items"
                >{{ appointment.snapshot.items.length }}项服务</text
              ></view
            >
            <view v-if="appointment.snapshot?.referencePrice" class="snapshot-price"
              >预约时参考金额 ¥{{ appointment.snapshot.referencePrice }}</view
            >
          </view>
          <view class="section-card">
            <view class="section-title">方案明细</view>
            <view v-if="appointment.snapshot?.items?.length" class="snapshot-list">
              <view
                v-for="item in appointment.snapshot.items"
                :key="`${item.sourceItemId}-${item.name}`"
                class="snapshot-item"
              >
                <view>
                  <view class="item-name">{{ item.name }}</view>
                  <view class="item-description"
                    >{{ item.category }} · {{ item.description }}</view
                  > </view
                ><text>¥{{ item.unitPrice }} × {{ item.quantity }}</text>
              </view>
            </view>
            <view v-else class="paragraph"
              >本次预约使用标准焕新方案，具体项目由顾问联系后确认。</view
            >
            <view v-if="estimatedTotal" class="snapshot-total"
              ><text>预估合计</text><text>¥{{ estimatedTotal }}</text>
            </view>
          </view>
          <view class="section-card">
            <view class="section-title">下一步安排</view>
            <view class="bullet-list">
              <view>顾问联系确认方案范围和服务地址</view>
              <view>如需现场判断，将进一步预约上门时间</view>
              <view>现场沟通后确认最终方案和报价</view>
            </view>
          </view>
          <view class="section-card">
            <view class="section-title">服务说明</view>
            <view class="paragraph"
              >当前方案、项目和金额为预约时的参考快照，实际服务内容以现场情况及双方最终确认结果为准。</view
            >
          </view>
        </template>

        <template v-else-if="appointment.type === 'CASE'">
          <view class="section-card">
            <view class="section-title">咨询案例</view>
            <view class="snapshot-heading">{{
              appointment.snapshot?.title || appointment.demand
            }}</view>
            <view class="requirement-tags"
              ><text>同款咨询</text><text>参考报价</text
              ><text>{{ appointment.city || '城市待确认' }}</text></view
            >
            <view v-if="appointment.snapshot?.referencePrice" class="snapshot-price"
              >案例参考金额 {{ appointment.snapshot.referencePrice }}</view
            >
          </view>
          <view class="section-card">
            <view class="section-title">咨询需求</view>
            <view class="detail-line"
              ><text class="detail-label">需求说明</text><text>{{ appointment.demand }}</text></view
            >
            <view class="detail-line"
              ><text class="detail-label">关注重点</text
              ><text>{{ appointment.focus || '同款改造范围、材料与预算' }}</text></view
            >
          </view>
          <view class="section-card">
            <view class="section-title">顾问联系</view>
            <view class="bullet-list">
              <view>了解您的房屋现状与期望效果</view>
              <view>说明案例方案可复用和需调整的部分</view>
              <view>结合实际情况沟通预算和后续上门安排</view>
            </view>
          </view>
          <view class="section-card">
            <view class="section-title">服务说明</view>
            <view class="paragraph"
              >案例价格和工期仅供参考，实际方案需结合户型、现场条件和材料选择重新确认。</view
            >
          </view>
        </template>

        <template v-else>
          <view class="section-card">
            <view class="section-title">咨询网点</view>
            <view class="snapshot-heading">{{ appointment.snapshot?.title || '服务网点' }}</view>
            <view class="detail-list">
              <view class="detail-line"
                ><text class="detail-label">网点地址</text
                ><text>{{ appointment.snapshot?.address || '待确认' }}</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">联系电话</text
                ><text>{{ appointment.snapshot?.contact || '请联系在线客服' }}</text></view
              >
              <view class="detail-line"
                ><text class="detail-label">咨询需求</text><text>{{ appointment.demand }}</text>
              </view>
            </view>
          </view>
          <view class="section-card">
            <view class="section-title">咨询说明</view>
            <view class="bullet-list">
              <view>顾问会确认到店时间和咨询内容</view>
              <view>到店可沟通材料、方案和服务范围</view>
              <view>需要上门时会另行确认时间及地址</view>
            </view>
          </view>
          <view class="section-card">
            <view class="section-title">温馨提示</view>
            <view class="paragraph"
              >请保持电话畅通；到店前建议准备户型、面积、预算和参考图片。</view
            >
          </view>
        </template>
      </view>
    </scroll-view>
    <view v-else-if="loadFailed" class="empty-state retry-state" @click="loadAppointmentDetail">
      加载失败，点击重试
    </view>
    <view v-else class="empty-state">预约不存在</view>

    <view v-if="appointment" class="bottom-bar">
      <button
        v-if="canCancel"
        class="outline-button"
        :disabled="canceling"
        :loading="canceling"
        @click="cancelAppointment"
      >
        {{ canceling ? '取消中' : '取消预约' }}
      </button>
      <button class="primary-button" @click="contactConsultant">
        {{ isMeasure ? '联系顾问' : '联系客服' }}
      </button>
    </view>
  </view>
</template>

<style lang="scss">
.detail-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.detail-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.page-content {
  padding: 24rpx 24rpx 28rpx;
}

.service-card,
.section-card {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(55, 42, 32, 0.045);
}

.service-card {
  padding: 22rpx 24rpx 20rpx;
  border-left: 3rpx solid $jfx-brandColor;
}

.service-pending_visit {
  border-left-color: #c77a17;
}

.service-completed,
.service-canceled {
  border-left-color: #777;
}

.service-heading,
.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.service-title,
.section-title {
  color: #222;
  font-size: 27rpx;
  line-height: 40rpx;
}

.status-badge {
  display: flex;
  height: 40rpx;
  padding: 0 18rpx;
  align-items: center;
  color: $jfx-brandColor;
  font-size: 21rpx;
  line-height: 40rpx;
  background: #fff0ef;
  border-radius: 22rpx;
}

.status-badge.pending_visit {
  color: #c77a17;
  background: #fff5e8;
}

.status-badge.completed,
.status-badge.canceled {
  color: #666;
  background: #f1f0ef;
}

.service-number {
  margin-top: 8rpx;
  color: #222;
  font-size: 23rpx;
  line-height: 34rpx;
}

.service-description {
  margin-top: 12rpx;
  color: #777;
  font-size: 22rpx;
  line-height: 34rpx;
}

.section-card {
  margin-top: 24rpx;
  padding: 24rpx;
}

.detail-list {
  margin-top: 16rpx;
}

.detail-line {
  display: flex;
  color: #333;
  font-size: 22rpx;
  line-height: 42rpx;
}

.detail-label {
  width: 144rpx;
  flex-shrink: 0;
  color: #777;
}

.detail-line text:last-child {
  min-width: 0;
  flex: 1;
}

.section-tip {
  margin-top: 7rpx;
  color: #aaa;
  font-size: 21rpx;
  line-height: 32rpx;
}

.requirement-tags {
  display: flex;
  margin-top: 14rpx;
  flex-wrap: wrap;
  gap: 16rpx;
}

.requirement-tags text {
  padding: 4rpx 16rpx;
  color: #a9704d;
  font-size: 20rpx;
  line-height: 30rpx;
  background: #fbf3eb;
  border-radius: 18rpx;
}

.requirement-list {
  margin-top: 14rpx;
}

.section-divider {
  height: 2rpx;
  margin: 18rpx 0 14rpx;
  background: #f0f0f0;
}

.submitted-list .detail-line {
  line-height: 48rpx;
}

.requirement-list .detail-label {
  color: #999;
}

.bullet-list {
  margin-top: 13rpx;
}

.bullet-list view {
  position: relative;
  padding-left: 24rpx;
  color: #666;
  font-size: 22rpx;
  line-height: 42rpx;
}

.bullet-list view::before {
  position: absolute;
  top: 15rpx;
  left: 0;
  width: 9rpx;
  height: 9rpx;
  background: #d9a47f;
  border-radius: 50%;
  content: '';
}

.paragraph {
  margin-top: 14rpx;
  color: #777;
  font-size: 22rpx;
  line-height: 38rpx;
}

.snapshot-heading {
  margin-top: 16rpx;
  color: #222;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 38rpx;
}

.snapshot-price {
  margin-top: 18rpx;
  color: #d92d20;
  font-size: 23rpx;
}

.snapshot-list {
  margin-top: 14rpx;
}

.snapshot-item {
  display: flex;
  padding: 18rpx 0;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  border-bottom: 1rpx solid #eee;
  font-size: 22rpx;
}

.snapshot-item:last-child {
  border-bottom: 0;
}

.snapshot-item > view {
  min-width: 0;
  flex: 1;
}

.snapshot-item > text {
  flex-shrink: 0;
  color: #d92d20;
}

.item-name {
  color: #222;
}

.item-description {
  margin-top: 6rpx;
  color: #999;
  font-size: 20rpx;
}

.snapshot-total {
  display: flex;
  padding-top: 18rpx;
  justify-content: space-between;
  border-top: 1rpx solid #eee;
  font-size: 24rpx;
}

.snapshot-total text:last-child {
  color: #d92d20;
  font-weight: 600;
}

.bottom-bar {
  display: flex;
  min-height: 108rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  align-items: center;
  gap: 20rpx;
  background: #fff;
  border-top: 2rpx solid #eee;
  box-shadow: 0 -8rpx 24rpx rgba(55, 42, 32, 0.04);
}

.outline-button,
.primary-button {
  box-sizing: border-box;
  height: 72rpx;
  margin: 0;
  padding: 0;
  font-size: 25rpx;
  line-height: 68rpx;
  border-radius: 36rpx;
}

.outline-button {
  width: 210rpx;
  flex: none;
  color: #666;
  background: #fff;
  border: 2rpx solid #ddd;
}

.primary-button {
  min-width: 0;
  flex: 1;
  color: #fff;
  font-weight: 600;
  background: $jfx-brandColor;
}

.outline-button::after,
.primary-button::after {
  border: 0;
}

.empty-state {
  padding-top: 200rpx;
  color: #aaa;
  text-align: center;
}

.retry-state {
  color: $jfx-brandColor;
}
</style>

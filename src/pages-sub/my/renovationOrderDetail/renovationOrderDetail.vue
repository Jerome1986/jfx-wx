<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type {
  RenovationStatus,
  RenovationStatusConfig as StatusConfig,
} from '@/types/renovation-order-detail'

// 配置集合
const configs: Record<RenovationStatus, StatusConfig> = {
  pending: {
    label: '待确认',
    description: '请确认报价与服务地址和报价清单',
    note: '确认后顾问将安排上门，费用明细可继续查看',
    footerAction: '确认预约',
  },
  servicing: {
    label: '服务中',
    description: '请确认报价与服务地址和报价清单',
    note: '确认后顾问将安排上门，费用明细可继续查看',
    footerAction: '联系顾问',
  },
  completed: {
    label: '已完成',
    description: '服务已完成验收',
    note: '后续如有问题，可在质保范围内申请售后服务',
    footerAction: '申请售后',
  },
}

// 状态
const status = ref<RenovationStatus>('completed')
// 配置
const config = computed(() => configs[status.value])
// 是否显示关联案例
const showRelatedCase = computed(() => status.value === 'pending')

onLoad((query) => {
  // 查询参数状态
  const queryStatus = query?.status as RenovationStatus | undefined
  if (queryStatus && configs[queryStatus]) status.value = queryStatus
})

// 联系装修顾问
const contactConsultant = () => {
  uni.makePhoneCall({
    phoneNumber: '15822221111',
    fail: () => uni.showToast({ title: '联系电话：15822221111', icon: 'none' }),
  })
}

// 打开案例
const openCase = () => uni.navigateTo({ url: '/pages/caseDetail/caseDetail?id=1' })
// 修改地址
const modifyAddress = () => uni.navigateTo({ url: '/pages-sub/my/address/address' })
// 查看订单报价
const viewQuote = () => {
  uni.navigateTo({ url: `/pages-sub/my/quoteDetail/quoteDetail?status=${status.value}` })
}

// 取消订单
const cancelOrder = () => {
  uni.showModal({
    title: '取消装修订单',
    content: '确定取消该装修订单吗？',
    confirmText: '确定取消',
    confirmColor: '#D92D20',
    success: ({ confirm }) => {
      if (confirm) uni.navigateBack()
    },
  })
}

// 执行操作
const runFooterAction = () => {
  if (status.value === 'pending') {
    uni.showModal({
      title: '确认预约',
      content: '确认报价、服务地址与报价清单，并安排工作人员上门？',
      confirmText: '确认预约',
      confirmColor: '#D92D20',
      success: ({ confirm }) => {
        if (!confirm) return
        status.value = 'servicing'
        uni.showToast({ title: '预约已确认', icon: 'success' })
      },
    })
    return
  }
  if (status.value === 'servicing') {
    contactConsultant()
    return
  }
  uni.showToast({ title: '售后申请功能建设中', icon: 'none' })
}
</script>

<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view :class="['status-card', `card-${status}`]">
          <view class="status-heading">
            <view class="project-title">95m²老房厨房改造</view>
            <view :class="['status-badge', `status-${status}`]">{{ config.label }}</view>
          </view>
          <view class="status-description">{{ config.description }}</view>
          <view class="status-note">{{ config.note }}</view>
        </view>

        <view v-if="showRelatedCase" class="content-card related-card">
          <view class="card-heading">
            <view class="section-title">关联案例</view>
            <view class="text-action" @click="openCase">查看详情</view>
          </view>
          <view class="case-content" @click="openCase">
            <image
              class="case-image"
              src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/房屋改造后.png"
              mode="aspectFill"
            />
            <view class="case-copy">
              <view class="case-title">95m²老房厨房改造：储物翻倍，动线重做</view>
              <view class="case-number">案例编号 CASE20260608</view>
              <view class="case-meta">适合户型：老房翻新/厨房局改</view>
              <view class="case-meta">预计周期：7-10天，同款方案可调整</view>
            </view>
          </view>
        </view>

        <view class="content-card house-card">
          <view class="card-heading">
            <view class="section-title">房屋信息</view>
            <view v-if="status === 'pending'" class="text-action" @click="modifyAddress">修改</view>
          </view>
          <view class="house-tags">
            <text>厨房改造</text><text>老房翻新</text><text>95m²</text>
          </view>
          <view class="card-divider" />
          <view class="info-line"><text>联系人</text><text>张先生 13812345682</text></view>
          <view class="info-line"><text>服务地址</text><text>武汉市洪山区珞瑜路88号</text></view>
          <view class="sub-note">该地址用于安排顾问上门，详细方案以现场沟通为准</view>
        </view>

        <view class="content-card record-card">
          <view v-if="status === 'pending'">
            <view class="section-title">上门安排</view>
            <view class="info-line record-line"
              ><text>下一步</text><text>确认后安排工作人员上门</text></view
            >
            <view class="sub-note">如地址或改造需求需调整，可先修改后确认或联系下方顾问</view>
          </view>
          <view v-else-if="status === 'servicing'">
            <view class="section-title">服务进度</view>
            <view class="info-line record-line"
              ><text>当前进度</text><text>方案沟通与施工推进中</text></view
            >
            <view class="info-line"><text>最近更新</text><text>06月20日 16:20</text></view>
          </view>
          <view v-else>
            <view class="section-title">服务记录</view>
            <view class="info-line record-line"
              ><text>完成时间</text><text>06月15日已完成验收</text></view
            >
            <view class="sub-note">服务记录已保存，可查看费用与服务明细</view>
          </view>
        </view>

        <view class="content-card consultant-card">
          <view class="section-title">服务顾问</view>
          <view class="consultant-row">
            <image
              class="consultant-avatar"
              src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/avatar/kefutouxiang.png"
              mode="aspectFill"
            />
            <view class="consultant-copy">
              <view class="consultant-name">张经理 15822221111</view>
              <view class="consultant-note">
                {{
                  status === 'pending'
                    ? '负责报价确认、地址核对和上门安排'
                    : '负责现场协调、进度同步和问题跟进'
                }}
              </view>
            </view>
            <button class="contact-button" @click="contactConsultant">联系</button>
          </view>
        </view>

        <view class="content-card quote-card">
          <view class="card-heading">
            <view class="section-title">报价费用清单</view>
            <view class="detail-action" @click="viewQuote">查看明细</view>
          </view>
          <view class="quote-line">
            <view
              ><view class="quote-title">主材</view
              ><view class="quote-note">水槽、龙头、台面及基础五金</view></view
            >
            <text>¥3888</text>
          </view>
          <view class="quote-line">
            <view
              ><view class="quote-title">人工+辅材</view
              ><view class="quote-note">拆除、水电改造、墙地砖铺贴</view></view
            >
            <text>¥10275</text>
          </view>
          <view class="quote-line">
            <view
              ><view class="quote-title">服务保障</view
              ><view class="quote-note">上门量房、项目管理、开荒保洁</view></view
            >
            <text>已包含</text>
          </view>
          <view class="quote-total">
            <view>
              <view>{{ status === 'completed' ? '订单金额' : '预估合计' }}</view>
              <view class="quote-note">
                {{
                  status === 'completed'
                    ? '该订单已完成，完整费用可在明细中查看'
                    : '最终费用以现场量房和确认方案为准'
                }}
              </view>
            </view>
            <text>¥14163</text>
          </view>
        </view>

        <view class="content-card explanation-card">
          <view class="section-title">服务说明</view>
          <view class="explanation-copy">
            <template v-if="status === 'pending'">
              确认预约后，顾问会根据您的地址与您联系，并安排工作人员上门沟通或量房。当前案例、耗材和费用为参考预估，后续可根据实际需求和现场情况调整。如需修改地址、方案或预约时间，可先联系顾问后再确认。
            </template>
            <template v-else-if="status === 'servicing'">
              服务过程中如需变更方案、材料或时间，请先联系顾问确认
            </template>
            <template v-else>
              如后续出现使用问题，可提交售后申请，客服会根据服务记录处理。
            </template>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <view v-if="status !== 'completed'" class="bottom-amount">
        <text>订单金额</text>
        <view>¥14163</view>
      </view>
      <button v-if="status === 'pending'" class="secondary-button" @click="cancelOrder">
        取消
      </button>
      <button class="primary-button" @click="runFooterAction">{{ config.footerAction }}</button>
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
  padding: 24rpx 24rpx 36rpx;
}

.status-card,
.content-card {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 7rpx 25rpx rgba(55, 42, 32, 0.04);
}
.status-card {
  min-height: 150rpx;
  padding: 24rpx;
  border-left: 2rpx solid #777;
}
.status-card.card-pending {
  border-left-color: #e42b22;
}
.status-card.card-servicing {
  border-left-color: #55a35d;
}
.status-heading,
.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.project-title {
  color: #222;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 40rpx;
}
.status-badge {
  display: flex;
  height: 42rpx;
  padding: 0 20rpx;
  align-items: center;
  font-size: 22rpx;
  border-radius: 23rpx;
}
.status-pending {
  color: #e52e24;
  background: #fff0ef;
}
.status-servicing {
  color: #55a35d;
  background: #eef8ef;
}
.status-completed {
  color: #777;
  background: #f3f2f0;
}
.status-description {
  margin-top: 8rpx;
  color: #222;
  font-size: 23rpx;
  line-height: 34rpx;
}
.status-note {
  margin-top: 12rpx;
  color: #777;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 34rpx;
}

.content-card {
  margin-top: 24rpx;
  padding: 24rpx;
}
.section-title {
  color: #222;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 38rpx;
}
.text-action {
  color: #e42b22;
  font-size: 22rpx;
  line-height: 34rpx;
}
.related-card {
  min-height: 244rpx;
}
.case-content {
  display: flex;
  margin-top: 18rpx;
}
.case-image {
  width: 196rpx;
  height: 182rpx;
  flex-shrink: 0;
  border-radius: 14rpx;
}
.case-copy {
  min-width: 0;
  margin-left: 28rpx;
  flex: 1;
}
.case-title {
  color: #222;
  font-size: 23rpx;
  line-height: 34rpx;
}
.case-number,
.case-meta {
  color: #888;
  font-size: 20rpx;
  font-weight: 400;
  line-height: 30rpx;
}
.case-number {
  margin-top: 18rpx;
}

.house-tags {
  display: flex;
  margin-top: 10rpx;
  gap: 16rpx;
}
.house-tags text {
  padding: 7rpx 18rpx;
  color: #a87047;
  font-size: 21rpx;
  background: #f9f1e9;
  border-radius: 18rpx;
}
.card-divider {
  height: 2rpx;
  margin: 20rpx 0;
  background: #eee;
}
.info-line {
  display: flex;
  color: #aaa;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 36rpx;
}
.info-line text:first-child {
  width: 128rpx;
  flex-shrink: 0;
}
.info-line text:last-child {
  color: #777;
}
.sub-note {
  color: #aaa;
  font-size: 21rpx;
  font-weight: 400;
  line-height: 34rpx;
}
.record-line {
  margin-top: 14rpx;
}

.consultant-row {
  display: flex;
  margin-top: 16rpx;
  align-items: center;
}
.consultant-avatar {
  width: 60rpx;
  height: 60rpx;
  flex-shrink: 0;
  border-radius: 50%;
}
.consultant-copy {
  min-width: 0;
  margin-left: 20rpx;
  flex: 1;
}
.consultant-name {
  color: #222;
  font-size: 22rpx;
  line-height: 32rpx;
}
.consultant-note {
  overflow: hidden;
  color: #777;
  font-size: 20rpx;
  font-weight: 400;
  line-height: 30rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.contact-button {
  height: 42rpx;
  margin: 0 0 0 12rpx;
  padding: 0 18rpx;
  color: #e42b22;
  font-size: 21rpx;
  line-height: 42rpx;
  background: #fff0ef;
  border-radius: 12rpx;
}

.detail-action {
  padding: 7rpx 18rpx;
  color: #e42b22;
  font-size: 21rpx;
  background: #fff0ef;
  border-radius: 12rpx;
}
.quote-line {
  display: flex;
  min-height: 72rpx;
  padding: 12rpx 0;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 2rpx solid #eee;
}
.quote-title {
  color: #222;
  font-size: 22rpx;
  line-height: 30rpx;
}
.quote-note {
  color: #777;
  font-size: 20rpx;
  font-weight: 400;
  line-height: 30rpx;
}
.quote-line > text,
.quote-total > text {
  margin-left: 16rpx;
  flex-shrink: 0;
  color: #e42b22;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 32rpx;
}
.quote-total {
  display: flex;
  padding-top: 14rpx;
  align-items: flex-start;
  justify-content: space-between;
}
.explanation-copy {
  margin-top: 12rpx;
  color: #777;
  font-size: 21rpx;
  font-weight: 400;
  line-height: 34rpx;
}

.bottom-bar {
  display: flex;
  min-height: 104rpx;
  padding: 18rpx 40rpx calc(18rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  align-items: center;
  background: #fff;
  border-top: 2rpx solid #eeeae6;
  gap: 22rpx;
}
.bottom-amount {
  width: 250rpx;
  flex-shrink: 0;
  color: #aaa;
  font-size: 21rpx;
  font-weight: 400;
  line-height: 30rpx;
}
.bottom-amount view {
  margin-top: 4rpx;
  color: #e42b22;
  font-size: 29rpx;
  line-height: 38rpx;
}
.secondary-button,
.primary-button {
  height: 68rpx;
  margin: 0;
  font-size: 25rpx;
  line-height: 68rpx;
  border-radius: 14rpx;
}
.secondary-button {
  width: 140rpx;
  color: #777;
  background: #fff;
  border: 2rpx solid #eee;
}
.primary-button {
  min-width: 0;
  flex: 1;
  color: #fff;
  background: #e42b22;
}
.bottom-bar .primary-button:only-child {
  width: 100%;
  flex: none;
}
button::after {
  border: 0;
}
</style>

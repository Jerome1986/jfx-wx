<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import type { CaseDetail } from '@/types/case-detail'

// 会员状态仓库
const memberStore = useMemberStore()

// 旧房房屋案例
const oldHouseCase: CaseDetail = {
  title: '68㎡老房翻新焕新颜',
  label: '老房改造',
  beforeCover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/房屋改造前.png',
  afterCover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/房屋改造后.png',
  location: '武汉',
  roomType: '两居室',
  area: '68㎡',
  style: '奶油风',
  price: '28.6万',
  description:
    '屋主希望保留老房原有的生活记忆，同时解决采光不足、储物空间有限和动线拥挤的问题。设计以温暖的奶油色为基调，重新规划公共空间，让小户型也能拥有通透舒适的居住体验。',
  highlights: [
    { title: '空间扩容', description: '打通客餐厅视线，减少空间阻隔，提升整体通透感。' },
    { title: '收纳提升', description: '利用墙面和转角定制一体化柜体，释放日常活动空间。' },
    { title: '采光改善', description: '采用浅色材质与开放布局，让自然光进入室内深处。' },
  ],
  costs: [
    { name: '基础施工', value: '9.8万' },
    { name: '主材费用', value: '11.6万' },
    { name: '定制与软装', value: '7.2万' },
  ],
}

// 厨房案例
const kitchenCase: CaseDetail = {
  title: '老旧厨房大变身',
  label: '厨房改造',
  beforeCover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/厨房改造前.png',
  afterCover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/厨房改造后.png',
  location: '武汉',
  roomType: '两居室',
  area: '76㎡',
  style: '简约风',
  price: '1.8万',
  description:
    '原厨房操作台面不足、物品摆放杂乱。此次改造在不改变主体结构的前提下，重新梳理洗、切、炒动线，并通过吊柜和抽屉系统提升储物效率。',
  highlights: [
    { title: '动线优化', description: '按照洗、切、炒顺序重排功能区，减少往返操作。' },
    { title: '收纳升级', description: '补充吊柜、抽屉和转角收纳，常用物品触手可及。' },
    { title: '快速焕新', description: '保留可用结构，以局部更新缩短工期并控制预算。' },
  ],
  costs: [
    { name: '拆除与安装', value: '0.4万' },
    { name: '橱柜与台面', value: '0.9万' },
    { name: '五金与辅材', value: '0.5万' },
  ],
}

// 案例编号
const caseId = ref(1)
// 是否为员工视图
const isEmployeeMode = ref(false)
// 归属员工编号
const attributionEmployeeId = ref<string>()
// 详情
const detail = computed(() => (caseId.value === 2 ? kitchenCase : oldHouseCase))
// 员工编号
const employeeId = computed(() => memberStore.profile?.employeeId)

onLoad((options) => {
  // 当前数据编号
  const id = Number(options?.id)
  if (Number.isFinite(id)) caseId.value = id
  isEmployeeMode.value = options?.source === 'employee'
  attributionEmployeeId.value =
    typeof options?.employeeId === 'string' ? decodeURIComponent(options.employeeId) : undefined
})

// 获取当前案例的装修报价
const requestQuote = () => {
  uni.showToast({ title: `${detail.value.title}报价咨询`, icon: 'none' })
}

// 准备案例分享
const prepareCaseShare = () => {
  if (!employeeId.value) {
    uni.showToast({ title: '员工信息不完整，暂无法分享', icon: 'none' })
  }
}

onShareAppMessage(() => {
  // 所属人编号
  const ownerId = employeeId.value
  if (!ownerId) {
    return {
      title: '家翻新精选案例',
      path: '/pages/caseList/caseList',
    }
  }
  return {
    title: detail.value.title,
    path: `/pages/caseDetail/caseDetail?id=${caseId.value}&employeeId=${encodeURIComponent(
      ownerId,
    )}`,
    imageUrl: detail.value.afterCover,
  }
})
</script>

<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="compare-card">
        <view class="compare-images">
          <view class="compare-image-wrap">
            <image class="compare-image" :src="detail.beforeCover" mode="aspectFill" />
            <text class="image-label">改造前</text>
          </view>
          <view class="compare-image-wrap">
            <image class="compare-image" :src="detail.afterCover" mode="aspectFill" />
            <text class="image-label">改造后</text>
          </view>
          <image
            class="compare-arrow"
            src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/jiantou.png"
            mode="aspectFit"
          />
        </view>
        <view class="case-heading">
          <text class="case-label">{{ detail.label }}</text>
          <view class="case-title">{{ detail.title }}</view>
          <view class="case-meta">
            <text>{{ detail.location }}</text>
            <text>{{ detail.roomType }}</text>
            <text>{{ detail.area }}</text>
            <text>{{ detail.style }}</text>
          </view>
          <view class="case-result">
            <view>
              <text class="result-label">总花费</text>
              <text class="result-price">¥{{ detail.price }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="detail-card">
        <view class="section-title">案例背景</view>
        <view class="case-description">{{ detail.description }}</view>
      </view>

      <view class="detail-card">
        <view class="section-title">改造亮点</view>
        <view class="highlight-list">
          <view v-for="(item, index) in detail.highlights" :key="item.title" class="highlight-item">
            <view class="highlight-index">0{{ index + 1 }}</view>
            <view class="highlight-content">
              <view class="highlight-title">{{ item.title }}</view>
              <view class="highlight-description">{{ item.description }}</view>
            </view>
          </view>
        </view>
      </view>

      <view class="detail-card">
        <view class="section-heading">
          <view class="section-title">费用明细</view>
          <text class="section-tip">参考费用</text>
        </view>
        <view class="cost-list">
          <view v-for="item in detail.costs" :key="item.name" class="cost-item">
            <text>{{ item.name }}</text>
            <text class="cost-value">¥{{ item.value }}</text>
          </view>
          <view class="cost-total">
            <text>合计</text>
            <text>¥{{ detail.price }}</text>
          </view>
        </view>
      </view>

      <view class="detail-note">案例价格因房屋情况和材料选择不同仅供参考</view>
    </scroll-view>

    <view class="bottom-action">
      <view class="action-price">
        <text class="action-label">同款参考价</text>
        <text class="action-value">¥{{ detail.price }}</text>
      </view>
      <button
        v-if="isEmployeeMode"
        class="quote-button"
        :open-type="employeeId ? 'share' : undefined"
        @click="prepareCaseShare"
      >
        分享给客户
      </button>
      <button v-else class="quote-button" @click="requestQuote">获取同款报价</button>
    </view>
  </view>
</template>

<style lang="scss">
.detail-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  background-color: $jfx-pageBackGroundColor;
}

.detail-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.compare-card,
.detail-card {
  @include jfx-shadow;
  overflow: hidden;
  margin: 0 24rpx 20rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.compare-images {
  position: relative;
  display: flex;
  height: 320rpx;
}
.compare-image-wrap {
  position: relative;
  width: 50%;
  height: 100%;
  overflow: hidden;
}
.compare-image-wrap:first-child {
  border-right: 2rpx solid #ffffff;
}
.compare-image {
  width: 100%;
  height: 100%;
}

.image-label {
  position: absolute;
  bottom: 12rpx;
  left: 12rpx;
  padding: 3rpx 8rpx;
  color: #ffffff;
  font-size: 18rpx;
  line-height: 28rpx;
  background-color: rgba(29, 29, 31, 0.5);
  border-radius: 6rpx;
}

.compare-arrow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 48rpx;
  height: 48rpx;
  transform: translate(-50%, -50%);
}
.case-heading {
  padding: 24rpx;
}

.case-label {
  display: inline-block;
  padding: 4rpx 12rpx;
  color: $jfx-brandColor;
  font-size: 20rpx;
  line-height: 30rpx;
  background-color: #fff0ee;
  border-radius: 6rpx;
}

.case-title {
  margin-top: 12rpx;
  color: $jfx-font-title;
  font-size: 32rpx;
  line-height: 46rpx;
}
.case-meta {
  display: flex;
  gap: 16rpx;
  margin-top: 6rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 34rpx;
}

.case-result {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 2rpx solid $jfx-border;
}

.result-label {
  margin-right: 12rpx;
  color: $jfx-font-dec;
  font-size: 22rpx;
}
.result-price {
  color: $jfx-brandColor;
  font-size: 34rpx;
}

.detail-card {
  padding: 24rpx;
}
.section-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  line-height: 40rpx;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-tip {
  color: $jfx-font-dec2;
  font-size: 20rpx;
}
.case-description {
  margin-top: 14rpx;
  color: $jfx-font-dec;
  font-size: 23rpx;
  line-height: 40rpx;
}
.highlight-list {
  margin-top: 8rpx;
}
.highlight-item {
  display: flex;
  padding: 18rpx 0;
  border-bottom: 2rpx solid $jfx-border;
}
.highlight-item:last-child {
  border-bottom: 0;
}
.highlight-index {
  width: 54rpx;
  flex-shrink: 0;
  color: $jfx-brandColor;
  font-size: 24rpx;
  line-height: 36rpx;
}
.highlight-title {
  color: $jfx-font-title;
  font-size: 24rpx;
  line-height: 36rpx;
}
.highlight-description {
  margin-top: 4rpx;
  color: $jfx-font-dec2;
  font-size: 21rpx;
  line-height: 34rpx;
}

.cost-list {
  margin-top: 12rpx;
}
.cost-item,
.cost-total {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  color: $jfx-font-dec;
  font-size: 22rpx;
}
.cost-item {
  border-bottom: 2rpx solid $jfx-border;
}
.cost-value {
  color: $jfx-font-title;
}
.cost-total {
  color: $jfx-font-title;
  font-size: 25rpx;
}
.cost-total text:last-child {
  color: $jfx-brandColor;
}

.detail-note {
  padding: 12rpx 24rpx 32rpx;
  color: $jfx-font-dec2;
  font-size: 20rpx;
  text-align: center;
}

.bottom-action {
  display: flex;
  min-height: 112rpx;
  flex-shrink: 0;
  align-items: center;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.action-price {
  display: flex;
  min-width: 220rpx;
  flex-direction: column;
}
.action-label {
  color: $jfx-font-dec;
  font-size: 20rpx;
  line-height: 30rpx;
}
.action-value {
  color: $jfx-brandColor;
  font-size: 32rpx;
  line-height: 42rpx;
}
.quote-button {
  height: 72rpx;
  margin: 0 0 0 auto;
  padding: 0 44rpx;
  color: #ffffff;
  font-size: 24rpx;
  line-height: 72rpx;
  background-color: $jfx-brandColor;
  border-radius: 36rpx;
}
</style>

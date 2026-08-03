<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import type { BenefitItem, BudgetForm, CalculationNote } from '@/types/renovation-budget'

// 表单数据
const formData = ref<BudgetForm>({
  houseType: 'old',
  city: '武汉',
  area: '',
  layout: '',
  phone: '',
})

// 城市和户型选择器
const cityVisible = ref(false)
const layoutVisible = ref(false)
const cityValue = ref<string[]>(['武汉'])
const layoutValue = ref<string[]>([])
const cityColumns = ['武汉', '长沙', '南昌', '合肥', '郑州']
const layoutColumns = ['一室一厅', '两室一厅', '两室两厅', '三室一厅', '三室两厅', '四室及以上']

// 用户可获得的服务内容
const benefitList: BenefitItem[] = [
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/gujia.png',
    title: '总体估价',
    description: '按城市、面积、户型\n快速计算预算区间',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/mingxi.png',
    title: '费用明细',
    description: '主材、辅材、人工\n分享展示更清晰',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/jianyi.png',
    title: '服务建议',
    description: '匹配量房、报价\n施工与售后保障',
  },
]

// 计算说明列表
const calculationNotes: CalculationNote[] = [
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/house.png',
    content: '预算会收城市、面积、户型、房屋新旧和装修范围影响。',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/zhucai.png',
    content: '主材品牌、施工工艺和增项需求会在符合后形成正式报价。',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/anquandunpai.png',
    content: '手机号仅用于报价沟通，信息会按平台隐私规则保护。',
  },
]

// 接收首页已填写的面积和户型
onLoad((options) => {
  if (typeof options?.area === 'string') formData.value.area = decodeURIComponent(options.area)
  if (typeof options?.layout === 'string') {
    const layout = decodeURIComponent(options.layout)
    formData.value.layout = layout
    layoutValue.value = layout ? [layout] : []
  }
})

// 同步城市选择结果
const handleCityConfirm = ({ value }: { value: string[] }) => {
  formData.value.city = value[0] || '武汉'
}

// 同步户型选择结果
const handleLayoutConfirm = ({ value }: { value: string[] }) => {
  formData.value.layout = value[0] || ''
}

// 接收微信手机号授权结果
const handlePhoneNumber = (event: any) => {
  if (event.detail?.errMsg === 'getPhoneNumber:ok') {
    uni.showToast({ title: '手机号授权成功', icon: 'none' })
    return
  }
  uni.showToast({ title: '未授权手机号', icon: 'none' })
}

// 基础报价提交反馈
const submitBudget = () => {
  uni.showToast({ title: '报价信息已提交', icon: 'none' })
}

// 房屋类型 TAB 的激活与未激活样式
const houseTypeTabStyle = (value: BudgetForm['houseType']) => {
  const isActive = formData.value.houseType === value
  const textColor = isActive ? '#D92D20' : '#1D1D1F'
  const backgroundColor = isActive ? '#FFF0EF' : '#FFFFFF'
  const borderColor = isActive ? '#FFF0EF' : '#EEEEEE'

  return `border-color: ${borderColor}; background-color: ${backgroundColor}; border-radius: 32rpx; --wot-radio-label-color: ${textColor};`
}
</script>

<template>
  <scroll-view class="budget-page" scroll-y :show-scrollbar="false">
    <view class="page-content">
      <!-- 顶部预算介绍 -->
      <image
        class="budget-hero"
        src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/beijingtu/背景图-yusuan.png"
        mode="widthFix"
      />

      <!-- 房屋信息表单 -->
      <view class="budget-card form-card">
        <view class="card-heading">
          <text class="card-title">房屋信息</text>
          <text class="heading-tip">用于估算报价</text>
        </view>
        <wd-form
          :model="formData"
          border
          center
          title-width="180rpx"
          value-align="left"
          custom-style="--wot-cell-padding: 0; --wot-cell-title-font-size: 24rpx; --wot-cell-title-color: #1D1D1F; --wot-cell-border-margin-horizontal: 0;"
        >
          <wd-form-item title="房屋类型" prop="houseType" custom-style="height: 64rpx;">
            <wd-radio-group
              v-model="formData.houseType"
              type="button"
              direction="horizontal"
              custom-style="display: flex; width: 100%; justify-content: flex-end; align-items: center; gap: 12rpx; --wot-radio-button-margin: 0; --wot-radio-button-min-width: 72rpx; --wot-radio-button-padding: 4rpx 16rpx; --wot-radio-button-border-radius: 32rpx; --wot-radio-checked-color: #D92D20; --wot-radio-button-shape-size: 0;"
            >
              <wd-radio value="old" :custom-style="houseTypeTabStyle('old')">旧房</wd-radio>
              <wd-radio value="new" :custom-style="houseTypeTabStyle('new')">新房</wd-radio>
            </wd-radio-group>
          </wd-form-item>

          <wd-form-item
            title="所在城市"
            prop="city"
            :value="formData.city"
            clickable
            custom-style="height: 64rpx;"
            @click="cityVisible = true"
          >
            <view class="select-value">{{ formData.city }}</view>
          </wd-form-item>

          <wd-form-item title="建筑面积" prop="area" custom-style="height: 64rpx;">
            <view class="input-row">
              <wd-input
                v-model="formData.area"
                type="digit"
                placeholder="请输入房屋建筑面积"
                custom-style="flex: 1; padding: 0; --wot-input-bg: transparent; --wot-input-inner-font-size: 24rpx;"
              />
              <text class="input-unit">㎡</text>
            </view>
          </wd-form-item>

          <wd-form-item
            title="房屋户型"
            prop="layout"
            :value="formData.layout"
            clickable
            custom-style="height: 64rpx;"
            @click="layoutVisible = true"
          >
            <view class="select-value" :class="{ placeholder: !formData.layout }">
              {{ formData.layout || '请选择户型' }}
              <wd-icon name="arrow-right" custom-style="font-size: 28rpx; color: #999999;" />
            </view>
          </wd-form-item>

          <wd-form-item title="联系方式" prop="phone" custom-style="height: 64rpx;">
            <view class="phone-row">
              <wd-input
                v-model="formData.phone"
                type="number"
                maxlength="11"
                placeholder="请输入手机号"
                custom-style="flex: 1; padding: 0; --wot-input-bg: transparent; --wot-input-inner-font-size: 24rpx;"
              />
              <button
                class="phone-button"
                open-type="getPhoneNumber"
                @getphonenumber="handlePhoneNumber"
              >
                使用本机号码
              </button>
            </view>
          </wd-form-item>
        </wd-form>

        <button class="submit-button" @click="submitBudget">计算报价</button>
        <view class="form-notice">提交后管家将结合面积和需求符合，报价仅作预算参考</view>
      </view>

      <!-- 可获得的预算服务 -->
      <view class="budget-card benefits-card">
        <view class="section-title">您将获得</view>
        <view class="benefit-list">
          <view v-for="item in benefitList" :key="item.title" class="benefit-item">
            <image class="benefit-icon" :src="item.icon" mode="aspectFit" />
            <view class="benefit-title">{{ item.title }}</view>
            <view class="benefit-description">{{ item.description }}</view>
          </view>
        </view>
      </view>

      <!-- 计算说明 -->
      <view class="budget-card notes-card">
        <view class="section-title">计算说明</view>
        <view v-for="item in calculationNotes" :key="item.content" class="note-item">
          <image class="note-icon" :src="item.icon" mode="aspectFit" />
          <text class="note-content">{{ item.content }}</text>
        </view>
      </view>
    </view>

    <wd-picker
      v-model="cityValue"
      v-model:visible="cityVisible"
      :columns="cityColumns"
      custom-style="--wot-picker-action-color-confirm: #D92D20;"
      @confirm="handleCityConfirm"
    />
    <wd-picker
      v-model="layoutValue"
      v-model:visible="layoutVisible"
      :columns="layoutColumns"
      custom-style="--wot-picker-action-color-confirm: #D92D20;"
      @confirm="handleLayoutConfirm"
    />
  </scroll-view>
</template>

<style lang="scss">
.budget-page {
  height: 100%;
  background-color: $jfx-pageBackGroundColor;
}

.page-content {
  padding: 24rpx;
}

.budget-hero,
.budget-card {
  @include jfx-shadow;
  background-color: #ffffff;
  border-radius: 16rpx;
}

.budget-hero {
  display: block;
  width: 100%;
  height: 176rpx;
  border-radius: 16rpx;
}

.budget-card {
  margin-top: 24rpx;
  padding: 24rpx;
}

.card-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4rpx;
}

.card-title,
.section-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: bold;
  line-height: 40rpx;
}

.heading-tip {
  color: $jfx-brandColor;
  font-size: 22rpx;
}

.select-value,
.input-row,
.phone-row {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  color: $jfx-font-title;
  font-size: 24rpx;
}

.placeholder {
  color: $jfx-font-dec2;
}

.input-unit {
  margin-left: 8rpx;
  color: $jfx-font-title;
  font-size: 22rpx;
}

.phone-button {
  height: 48rpx;
  margin: 0;
  padding: 0 0 0 16rpx;
  color: $jfx-brandColor;
  font-size: 22rpx;
  line-height: 48rpx;
  background-color: transparent;
}

.submit-button {
  width: 100%;
  height: 60rpx;
  margin: 16rpx 0 0;
  padding: 0;
  color: #ffffff;
  font-size: 26rpx;
  line-height: 60rpx;
  background-color: $jfx-brandColor;
  border-radius: 12rpx;
}

.form-notice {
  margin-top: 14rpx;
  color: $jfx-font-dec;
  font-size: 20rpx;
  line-height: 30rpx;
}

.benefits-card {
  padding-bottom: 28rpx;
}

.benefit-list {
  display: flex;
  margin-top: 20rpx;
}

.benefit-item {
  display: flex;
  width: 33.3333%;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.benefit-icon {
  width: 64rpx;
  height: 64rpx;
}

.benefit-title {
  margin-top: 14rpx;
  color: $jfx-font-title;
  font-size: 24rpx;
  font-weight: bold;
  line-height: 34rpx;
}

.benefit-description {
  margin-top: 6rpx;
  color: $jfx-font-dec;
  font-size: 18rpx;
  line-height: 28rpx;
  white-space: pre-line;
}

.notes-card {
  margin-bottom: 24rpx;
}

.note-item {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}

.note-icon {
  width: 40rpx;
  height: 40rpx;
  flex-shrink: 0;
}

.note-content {
  margin-left: 16rpx;
  color: $jfx-font-dec;
  font-size: 20rpx;
}
</style>

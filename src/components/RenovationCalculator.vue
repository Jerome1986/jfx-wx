<script lang="ts" setup>
import { ref } from 'vue'

// 保存当前输入的房屋面积
const areaValue = ref('')

// 控制户型选择器的显示与隐藏
const layoutShow = ref(false)

// 保存当前选中的户型
const layoutValue = ref<string[]>([])

// 户型选择器可选项
const layoutColumns = ref([
  '一室一厅',
  '两室一厅',
  '两室两厅',
  '三室一厅',
  '三室两厅',
  '四室一厅',
  '四室两厅',
  '五室及以上',
])

// 装修报价服务优势列表
const calculatorBenefits = ref([
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/jingzhun.png',
    title: '精准报价',
    subTitle: '明细清晰透明',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/mianfei.png',
    title: '免费获取',
    subTitle: '无任何费用',
  },
  {
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/yinsi.png',
    title: '隐私保护',
    subTitle: '信息安全保障',
  },
])

// 进入装修预算详情并携带已填写信息
const goToBudgetDetail = () => {
  const query = `area=${encodeURIComponent(areaValue.value)}&layout=${encodeURIComponent(
    layoutValue.value[0] || '',
  )}`
  uni.navigateTo({ url: `/pages/renovationBudget/renovationBudget?${query}` })
}
</script>
<template>
  <view class="calculator-module">
    <!-- 顶部信息区 -->
    <view class="calculator">
      <view class="calculator-info">
        <view class="calculator-title-row">
          <view class="calculator-title">装修预算计算器</view>
          <view class="calculator-badge">30秒获取报价</view>
        </view>
        <view class="calculator-description">输入面积，选择户型，获取精准预算</view>
      </view>
      <view class="calculator-action">
        <image
          class="avatar-group"
          src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/avatar/touxiang-group.png"
          mode="aspectFit"
        />
        <view class="calculator-reference">
          已为 <text class="reference-count">8231</text> 户家庭 提供预算参考
        </view>
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="calculator-form">
      <view class="calculator-fields">
        <view class="calculator-field calculator-area-field">
          <view class="calculator-field-label">房屋面积</view>
          <wd-input
            v-model="areaValue"
            custom-class="calculator-input"
            custom-style="height: 56rpx; border: 1rpx solid #eeeeee; --wot-input-padding: 0 16rpx; --wot-input-inner-height: 40rpx;"
            type="digit"
            placeholder="请输入㎡"
          />
        </view>
        <view class="calculator-field calculator-layout-field">
          <view class="calculator-field-label">户型</view>
          <wd-cell
            custom-style="width: 100%; height: 56rpx; border: 1rpx solid #eeeeee; --wot-cell-padding: 0 16rpx; --wot-cell-value-font-size: var(--wot-input-inner-font-size, 28rpx); --wot-cell-value-line-height: 54rpx; --wot-cell-value-color: var(--wot-input-inner-color, #1d1f29); --wot-cell-placeholder-font-size: var(--wot-input-inner-font-size, 28rpx); --wot-cell-placeholder-line-height: 54rpx; --wot-cell-placeholder-color: var(--wot-input-inner-placeholder-color, #a9acb8);"
            placeholder="请选择户型"
            :value="layoutValue[0]"
            value-align="left"
            center
            ellipsis
            clickable
            @click="layoutShow = true"
          >
            <template #suffix>
              <wd-icon
                name="arrow-right"
                custom-style="height: 54rpx; margin-left: 8rpx; color: #868a9c; font-size: 28rpx; line-height: 54rpx;"
              />
            </template>
          </wd-cell>
          <wd-picker
            v-model="layoutValue"
            v-model:visible="layoutShow"
            :columns="layoutColumns"
            custom-style="--wot-picker-action-color-confirm: #D92D20;"
          />
        </view>
      </view>
      <button class="calculator-submit" @click="goToBudgetDetail">立即测算</button>
    </view>
    <!-- 图标和报价 -->
    <view class="calculator-benefits">
      <view v-for="item in calculatorBenefits" :key="item.title" class="calculator-benefit-item">
        <image class="benefit-icon" :src="item.icon" mode="aspectFit" />
        <view class="benefit-content">
          <view class="benefit-title">{{ item.title }}</view>
          <view class="benefit-subtitle">{{ item.subTitle }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
// 装修预算计算器模块
.calculator-module {
  margin: 0 24rpx;
  padding: 24rpx;
  background-color: #fefefe;
  border-radius: 24rpx;
  @include jfx-shadow;
}

// 计算器顶部信息区
.calculator {
  margin-bottom: 24rpx;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;

  // 左侧标题与预算说明区
  .calculator-info {
    flex: 1;
    min-width: 0;

    // 标题与报价标签行
    .calculator-title-row {
      margin-bottom: 8rpx;
      display: flex;
      align-items: center;
      gap: 8rpx;

      .calculator-title {
        color: $jfx-font-title;
        font-size: 28rpx;
      }

      .calculator-badge {
        flex-shrink: 0;
        padding: 4rpx 12rpx;
        color: $jfx-brandColor;
        background-color: #fee4e2;
        font-size: 20rpx;
        border-radius: 20rpx;
      }
    }

    .calculator-description {
      color: #666666;
      font-size: 24rpx;
      line-height: 1.4;
    }
  }

  // 右侧用户参考信息区
  .calculator-action {
    display: flex;
    width: 240rpx;
    flex-shrink: 0;
    justify-content: center;
    align-items: flex-start;
    gap: 8rpx;

    .avatar-group {
      width: 80rpx;
      height: 36rpx;
      flex-shrink: 0;
    }

    .calculator-reference {
      color: #666666;
      font-size: 20rpx;

      .reference-count {
        color: $jfx-font-title;
        font-size: 24rpx;
      }
    }
  }
}

// 预算测算表单区
.calculator-form {
  margin-top: 16rpx;
  display: flex;
  align-items: flex-end;
  gap: 16rpx;

  .calculator-fields {
    display: flex;
    flex: 1;
    min-width: 0;
    gap: 16rpx;

    .calculator-field {
      display: flex;
      flex: 1;
      min-width: 0;
      flex-direction: column;

      .calculator-field-label {
        margin-bottom: 8rpx;
        color: #666666;
        font-size: 28rpx;
      }

      .calculator-input {
        height: 56rpx;
        border: 1rpx solid #eeeeee;
        --wot-input-padding: 0 16rpx;
        --wot-input-inner-height: 40rpx;
      }
    }
  }

  .calculator-submit {
    margin: 0;
    height: 80rpx;
    padding: 0 24rpx;
    flex-shrink: 0;
    color: #ffffff;
    background-color: $jfx-brandColor;
    font-size: 24rpx;
    line-height: 80rpx;
    border-radius: 12rpx;
  }
}

// 报价服务优势区
.calculator-benefits {
  padding-top: 24rpx;
  display: flex;
  align-items: center;

  // 单个服务优势项
  .calculator-benefit-item {
    display: flex;
    flex: 1;
    min-width: 0;
    justify-content: center;
    align-items: center;
    gap: 8rpx;

    // 优势图标
    .benefit-icon {
      width: 56rpx;
      height: 56rpx;
      flex-shrink: 0;
    }

    // 优势文字区
    .benefit-content {
      display: flex;
      min-width: 0;
      flex-direction: column;

      .benefit-title {
        color: $jfx-font-title;
        font-size: 28rpx;
      }

      .benefit-subtitle {
        color: $jfx-font-dec;
        font-size: 24rpx;
      }
    }
  }
}
</style>

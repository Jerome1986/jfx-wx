<script setup lang="ts">
import CustomNavHome from '@/components/CustomNavHome.vue'
import RenovationCalculator from '@/components/RenovationCalculator.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import { useShare } from '@/utils/share'
import type { SelectedCase } from '@/types/home'
import { ref } from 'vue'

useShare({
  title: '家翻新｜让家更美好',
  path: '/pages/home/home',
  imageUrl: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/banner/banner1.png',
})

const swiperList = ref([
  'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/banner/banner1.png',
])

const showConsultFloat = ref(false)
const consultShowScrollTop = 300

const handleHomeScroll = (event: { detail: { scrollTop: number } }) => {
  showConsultFloat.value = event.detail.scrollTop >= consultShowScrollTop
}

const spaceRenewalList = [
  {
    title: '厨房改造',
    description: '动线优化/收纳升级',
    cover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/厨房.png',
  },
  {
    title: '卫生间改造',
    description: '干湿分离/焕新升级',
    cover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/卫生间.png',
  },
  {
    title: '阳台改造',
    description: '洗晒收纳/休闲空间',
    cover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/阳台.png',
  },
  {
    title: '墙面刷新',
    description: '环保耐用/颜色焕新',
    cover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/墙面.png',
  },
]

const goToSpaceRenewal = () => {
  uni.navigateTo({ url: '/pages/spaceRenewal/spaceRenewal' })
}

const goToCaseList = () => {
  uni.navigateTo({ url: '/pages/caseList/caseList' })
}

const selectedCaseList: SelectedCase[] = [
  {
    id: 2,
    title: '老旧厨房大变身',
    label: '厨房改造',
    isFavorite: false,
    beforeCover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/厨房改造前.png',
    afterCover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/厨房改造后.png',
    location: '武汉',
    roomType: '卫生间',
    area: '6㎡',
    tags: ['动线优化', '收纳升级', '颜值提升'],
    price: '1.8万',
    duration: '5天',
    receivedCount: 142,
  },
  {
    id: 1,
    title: '68㎡老房翻新焕新颜',
    label: '老房改造',
    isFavorite: false,
    beforeCover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/房屋改造前.png',
    afterCover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/房屋改造后.png',
    location: '武汉',
    roomType: '两居室',
    area: '68㎡',
    tags: ['奶油风', '收纳提升', '空间扩容'],
    price: '28.6万',
    duration: '151天',
    receivedCount: 327,
  },
]

const goToCaseDetail = (item: SelectedCase) => {
  uni.navigateTo({ url: `/pages/caseDetail/caseDetail?id=${item.id}` })
}
</script>

<template>
  <view class="homePage">
    <!-- 自定义头部 -->
    <custom-nav-home></custom-nav-home>
    <scroll-view class="home-content" scroll-y :show-scrollbar="false" @scroll="handleHomeScroll">
      <!-- 轮播图 -->
      <view class="banner">
        <wd-swiper
          radius="12"
          height="176"
          :list="swiperList"
          autoplay
          :indicator="{ type: 'dots-bar' }"
        >
        </wd-swiper>
      </view>
      <!-- 空间换新 -->
      <section-header
        title="空间换新"
        sub-title="按空间找方案，快速改善家"
        @more="goToSpaceRenewal"
      />
      <view class="list">
        <view
          v-for="item in spaceRenewalList"
          :key="item.title"
          class="card"
          @click="goToSpaceRenewal"
        >
          <view class="card-header">
            <text class="card-title">{{ item.title }}</text>
            <text class="card-description">{{ item.description }}</text>
          </view>
          <view class="card-body">
            <wd-img width="100%" height="100%" mode="aspectFill" :src="item.cover" />
            <image
              class="card-arrow"
              src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/jiantou-you.png"
              mode="aspectFit"
            />
          </view>
        </view>
      </view>
      <!-- 装修计算器 -->
      <renovation-calculator />
      <!-- 精选案例 -->
      <view class="selectedCase">
        <section-header
          title="精选案例"
          sub-title="真实改造案例，品质看得见"
          @more="goToCaseList"
        />
        <view class="case-list">
          <view
            v-for="item in selectedCaseList"
            :key="item.id"
            class="case-card"
            @click="goToCaseDetail(item)"
          >
            <view class="case-cover">
              <image class="cover-before" :src="item.beforeCover" mode="aspectFill" />
              <image class="cover-after" :src="item.afterCover" mode="aspectFill" />
              <text class="case-cover-label">{{ item.label }}</text>
              <image
                class="case-favorite-icon"
                src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/shoucang-kongxin.png"
                mode="aspectFit"
              />
              <image
                class="case-compare-icon"
                src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/jiantou.png"
                mode="aspectFit"
              />
            </view>
            <view class="case-content">
              <view class="case-summary">
                <view class="case-title">{{ item.title }}</view>
                <view class="case-meta">
                  <text>{{ item.location }}</text>
                  <text>{{ item.roomType }}</text>
                  <text>{{ item.area }}</text>
                </view>
                <view class="case-tags">
                  <text v-for="tag in item.tags" :key="tag" class="case-tag">{{ tag }}</text>
                </view>
              </view>
              <view class="case-quote">
                <view class="quote-main">
                  <view class="quote-cost">
                    <view class="quote-label">总花费</view>
                    <view class="quote-price"
                      ><text class="price-symbol">¥</text>{{ item.price }}</view
                    >
                  </view>
                  <button class="quote-button">获取同款报价</button>
                </view>
                <view class="quote-progress">
                  <text>工期 {{ item.duration }}</text>
                  <view class="received-info">
                    <image
                      class="received-avatars"
                      src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/avatar/touxiang-group.png"
                      mode="aspectFit"
                    />
                    <text>{{ item.receivedCount }}人已获取</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
    <!-- 底部悬浮咨询入口 -->
    <view v-if="showConsultFloat" class="consult-float">
      <view class="consult-main">
        <image
          class="consult-avatar"
          src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/avatar/kefutouxiang.png"
          mode="aspectFill"
        />
        <view class="consult-copy">
          <view class="consult-title">免费咨询装修方案</view>
          <view class="consult-subtitle">专业顾问1对1服务</view>
        </view>
      </view>
      <button class="consult-button" open-type="contact">
        <text class="iconfont icon-zixun consult-icon" />
        <text>立即咨询</text>
      </button>
    </view>
  </view>
</template>

<style lang="scss">
.homePage {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f7f5;

  .home-content {
    height: 0;
    min-height: 0;
    flex: 1;
  }

  // 距离原生 TabBar 顶部 40rpx 的悬浮咨询条
  .consult-float {
    position: fixed;
    top: calc(var(--status-bar-height) + 136rpx);
    right: 24rpx;
    left: 24rpx;
    z-index: 20;
    display: flex;
    height: 116rpx;
    padding: 16rpx 16rpx 16rpx 32rpx;
    justify-content: space-between;
    align-items: center;
    background-color: #fefdfd;
    border: 2rpx solid #f1d7d4;
    border-radius: 999rpx;
  }

  .consult-avatar {
    width: 82rpx;
    height: 82rpx;
    flex-shrink: 0;
    background-color: #f1efed;
    border-radius: 50%;
  }

  .consult-main {
    display: flex;
    min-width: 0;
    align-items: center;
  }

  .consult-copy {
    min-width: 0;
    margin-left: 18rpx;
  }

  .consult-title {
    color: #1d1d1f;
    font-size: 30rpx;
    font-weight: bold;
    line-height: 42rpx;
    white-space: nowrap;
  }

  .consult-subtitle {
    color: #777777;
    font-size: 24rpx;
    line-height: 34rpx;
    white-space: nowrap;
  }

  .consult-button {
    display: flex;
    width: 190rpx;
    height: 68rpx;
    margin: 0;
    padding: 0;
    flex-shrink: 0;
    justify-content: center;
    align-items: center;
    gap: 10rpx;
    color: #ffffff;
    font-size: 26rpx;
    font-weight: bold;
    line-height: 68rpx;
    background-color: #e72d23;
    border-radius: 20rpx;

    &::after {
      border: 0;
    }
  }

  .consult-icon {
    color: #ffffff;
    font-size: 32rpx;
    font-weight: normal;
  }

  .banner {
    padding: 24rpx;
  }

  // 空间换新卡片列表
  .list {
    display: flex;
    width: 100%;
    padding: 24rpx;

    // 单个换新卡片
    .card {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 308rpx;
      overflow: hidden;
      background-color: #ffffff;
      border-radius: 16rpx;

      &:not(:last-child) {
        margin-right: 16rpx;
      }

      // 卡片文字信息区
      .card-header {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4rpx;
        height: 96rpx;
        padding: 0 8rpx;
        flex-shrink: 0;
        text-align: center;
        background-color: #ece9e6;

        // 换新类型标题
        .card-title {
          color: #1d1d1f;
          font-size: 24rpx;
          font-weight: bold;
        }

        // 换新内容描述
        .card-description {
          color: #666666;
          font-size: 16rpx;
        }
      }

      // 卡片封面图区
      .card-body {
        position: relative;
        flex: 1;

        // 封面图左下角跳转箭头
        .card-arrow {
          position: absolute;
          left: 8rpx;
          bottom: 12rpx;
          width: 48rpx;
          height: 48rpx;
        }
      }
    }
  }

  .selectedCase {
    margin-top: 24rpx;

    .case-list {
      padding: 24rpx;
    }

    .case-card {
      @include jfx-shadow;
      overflow: hidden;
      background-color: #ffffff;
      border-radius: 20rpx;

      &:not(:last-child) {
        margin-bottom: 24rpx;
      }
    }

    .case-cover {
      position: relative;
      display: flex;
      height: 260rpx;

      .cover-before,
      .cover-after {
        width: 50%;
        height: 100%;
      }

      .cover-before {
        box-sizing: border-box;
        background-color: #f0eeeb;
        border-right: 2rpx solid #ffffff;
      }

      .cover-after {
        background-color: #e8e4df;
      }

      .case-cover-label {
        position: absolute;
        top: 8rpx;
        left: 8rpx;
        padding: 4rpx 10rpx;
        color: #ffffff;
        font-size: 16rpx;
        line-height: 24rpx;
        background-color: #d84013;
        border-radius: 8rpx;
      }

      .case-favorite-icon {
        position: absolute;
        top: 8rpx;
        right: 8rpx;
        width: 48rpx;
        height: 48rpx;
      }

      .case-compare-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 48rpx;
        height: 48rpx;
        transform: translate(-50%, -50%);
      }
    }

    .case-content {
      display: flex;
      min-height: 190rpx;
    }

    .case-summary {
      display: flex;
      width: 50%;
      min-width: 0;
      flex-shrink: 0;
      flex-direction: column;
      justify-content: center;
      padding: 20rpx 16rpx 20rpx 20rpx;
    }

    .case-title {
      overflow: hidden;
      color: #1d1d1f;
      font-size: 28rpx;
      font-weight: bold;
      line-height: 40rpx;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .case-meta {
      display: flex;
      gap: 12rpx;
      margin-top: 4rpx;
      color: #999999;
      font-size: 22rpx;
      line-height: 34rpx;
    }

    .case-tags {
      display: flex;
      gap: 8rpx;
      margin-top: 14rpx;
      white-space: nowrap;
    }

    .case-tag {
      padding: 4rpx 10rpx;
      color: #8b5e3c;
      font-size: 20rpx;
      line-height: 30rpx;
      background-color: #fbf4ec;
      border-radius: 6rpx;
    }

    .case-quote {
      position: relative;
      display: flex;
      width: 50%;
      flex-shrink: 0;
      flex-direction: column;
      justify-content: center;
      padding: 16rpx 16rpx 14rpx;

      &::before {
        position: absolute;
        top: 25%;
        left: 0;
        width: 2rpx;
        height: 50%;
        background-color: #f2f0ed;
        content: '';
      }
    }

    .quote-label {
      color: #666666;
      font-size: 22rpx;
      line-height: 32rpx;
    }

    .quote-price {
      color: #e43d30;
      font-size: 32rpx;
      line-height: 44rpx;
    }

    .price-symbol {
      margin-right: 4rpx;
      font-size: 22rpx;
    }

    .quote-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12rpx;
    }

    .quote-cost {
      flex-shrink: 0;
    }

    .quote-button {
      width: 178rpx;
      height: 56rpx;
      margin: 0;
      padding: 0;
      color: #ffffff;
      font-size: 22rpx;
      line-height: 56rpx;
      background-color: #e43d30;
      border-radius: 8rpx;

      &::after {
        border: 0;
      }
    }

    .quote-progress {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8rpx;
      color: #999999;
      font-size: 20rpx;
      white-space: nowrap;
    }

    .received-info {
      display: flex;
      align-items: center;
    }

    .received-avatars {
      width: 64rpx;
      height: 28rpx;
      margin-right: 8rpx;
      flex-shrink: 0;
    }
  }
}
</style>

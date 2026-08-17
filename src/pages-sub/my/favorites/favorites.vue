<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import { useMemberStore } from '@/stores'
import type { FavoriteCase } from '@/types/favorites'

// 会员状态仓库
const memberStore = useMemberStore()
// 是否为员工视图
const isEmployeeMode = ref(false)
// 已选分享案例
const selectedShareCase = ref<FavoriteCase>()
// 员工编号
const employeeId = computed(() => memberStore.profile?.employeeId)

// 收藏
const favoriteCases = ref<FavoriteCase[]>(
  Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    title: '68㎡老房翻新焕新颜',
    label: '老房改造',
    beforeCover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/房屋改造前.png',
    afterCover: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/房屋改造后.png',
    location: '武汉',
    roomType: '两居室',
    area: '68㎡',
    tags: ['奶油风', '收纳提升', '空间扩容'],
    price: '28.6万',
    duration: '151天',
    receivedCount: 327,
  })),
)

// 收藏数量
const favoriteCount = computed(() => favoriteCases.value.length)

onLoad((options) => {
  isEmployeeMode.value = options?.source === 'employee'
  if (isEmployeeMode.value) {
    uni.setNavigationBarTitle({ title: '我的案例' })
  }
})

// 查看案例详情
const viewCaseDetail = (item: FavoriteCase) => {
  // 数据来源
  const source = isEmployeeMode.value ? '&source=employee' : ''
  uni.navigateTo({ url: `/pages/caseDetail/caseDetail?id=${item.id === 2 ? 2 : 1}${source}` })
}
// 获取收藏案例的装修报价
const requestQuote = (item: FavoriteCase) => {
  uni.showToast({ title: `${item.title}报价咨询`, icon: 'none' })
}
// 移除收藏
const removeFavorite = (item: FavoriteCase) => {
  favoriteCases.value = favoriteCases.value.filter((caseItem) => caseItem.id !== item.id)
  uni.showToast({ title: '已取消收藏', icon: 'none' })
}

// 准备案例分享
const prepareCaseShare = (item: FavoriteCase) => {
  if (!employeeId.value) {
    uni.showToast({ title: '员工信息不完整，暂无法分享', icon: 'none' })
    return
  }
  selectedShareCase.value = item
}

onShareAppMessage(() => {
  // 当前处理项
  const item = selectedShareCase.value
  // 所属人编号
  const ownerId = employeeId.value
  if (!item || !ownerId) {
    return {
      title: '家翻新精选案例',
      path: '/pages/caseList/caseList',
    }
  }
  return {
    title: item.title,
    path: `/pages/caseDetail/caseDetail?id=${item.id === 2 ? 2 : 1}&employeeId=${encodeURIComponent(
      ownerId,
    )}`,
    imageUrl: item.afterCover,
  }
})
</script>

<template>
  <view class="favorites-page">
    <scroll-view class="favorites-scroll" scroll-y :show-scrollbar="false">
      <view class="favorites-content">
        <view class="favorites-intro">
          <view class="intro-title">已收藏{{ favoriteCount }}个案例</view>
          <view class="intro-description">可随时查看案例详情，获取同款改造报价</view>
        </view>

        <view v-if="favoriteCases.length" class="case-list">
          <view
            v-for="item in favoriteCases"
            :key="item.id"
            class="case-card"
            @click="viewCaseDetail(item)"
          >
            <view class="case-cover">
              <image class="cover-image" :src="item.beforeCover" mode="aspectFill" />
              <image class="cover-image" :src="item.afterCover" mode="aspectFill" />
              <text class="cover-label">{{ item.label }}</text>
              <image
                class="favorite-icon"
                src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/shoucang-shixin.png"
                mode="aspectFit"
                @click.stop="removeFavorite(item)"
              />
              <image
                class="compare-icon"
                src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/anli/jiantou.png"
                mode="aspectFit"
              />
              <text class="before-text">改造前</text>
              <text class="after-text">改造后</text>
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
                  <button
                    v-if="isEmployeeMode"
                    class="quote-button"
                    :open-type="employeeId ? 'share' : undefined"
                    @click.stop="prepareCaseShare(item)"
                  >
                    分享给客户
                  </button>
                  <button v-else class="quote-button" @click.stop="requestQuote(item)">
                    获取同款报价
                  </button>
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
          <view class="list-tip">继续下滑查看更多收藏案例</view>
        </view>

        <view v-else class="empty-state">
          <view class="empty-title">暂无收藏案例</view>
          <view class="empty-description">去精选案例看看喜欢的改造方案吧</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
.favorites-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

.favorites-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.favorites-content {
  padding: 24rpx 24rpx calc(40rpx + env(safe-area-inset-bottom));
}

.favorites-intro {
  margin-bottom: 30rpx;
}

.intro-title {
  color: $jfx-font-title;
  font-size: 27rpx;
  line-height: 40rpx;
}

.intro-description {
  margin-top: 2rpx;
  color: $jfx-font-dec2;
  font-size: 23rpx;
  font-weight: 400;
  line-height: 34rpx;
}

.case-card {
  @include jfx-shadow;
  overflow: hidden;
  background: #fff;
  border-radius: 20rpx;
}

.case-card + .case-card {
  margin-top: 24rpx;
}

.case-cover {
  position: relative;
  display: flex;
  height: 260rpx;
  overflow: hidden;
}

.cover-image {
  width: 50%;
  height: 100%;
}

.cover-image:first-child {
  border-right: 2rpx solid rgba(255, 255, 255, 0.9);
}

.cover-label {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  padding: 4rpx 10rpx;
  color: #fff;
  font-size: 18rpx;
  line-height: 26rpx;
  background: #d84013;
  border-radius: 8rpx;
}

.favorite-icon {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 48rpx;
  height: 48rpx;
}

.compare-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 48rpx;
  height: 48rpx;
  transform: translate(-50%, -50%);
}

.before-text,
.after-text {
  position: absolute;
  bottom: 10rpx;
  padding: 2rpx 7rpx;
  color: #fff;
  font-size: 18rpx;
  line-height: 28rpx;
  background: rgba(29, 29, 31, 0.48);
  border-radius: 4rpx;
}

.before-text {
  left: 10rpx;
}

.after-text {
  left: calc(50% + 10rpx);
}

.case-content {
  display: flex;
  min-height: 190rpx;
}

.case-summary {
  display: flex;
  width: 50%;
  min-width: 0;
  padding: 20rpx 16rpx 20rpx 20rpx;
  flex-shrink: 0;
  flex-direction: column;
  justify-content: center;
}

.case-title {
  overflow: hidden;
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.case-meta {
  display: flex;
  margin-top: 4rpx;
  gap: 12rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  font-weight: 400;
  line-height: 34rpx;
}

.case-tags {
  display: flex;
  margin-top: 14rpx;
  gap: 8rpx;
  white-space: nowrap;
}

.case-tag {
  padding: 4rpx 10rpx;
  color: #8b5e3c;
  font-size: 20rpx;
  line-height: 30rpx;
  background: #fbf4ec;
  border-radius: 6rpx;
}

.case-quote {
  position: relative;
  display: flex;
  width: 50%;
  min-width: 0;
  padding: 16rpx 16rpx 14rpx;
  flex-shrink: 0;
  flex-direction: column;
  justify-content: center;
}

.case-quote::before {
  position: absolute;
  top: 25%;
  bottom: 25%;
  left: 0;
  width: 2rpx;
  background: #f2f0ed;
  content: '';
}

.quote-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.quote-cost {
  flex-shrink: 0;
}

.quote-label {
  color: $jfx-font-dec;
  font-size: 22rpx;
  line-height: 32rpx;
}

.quote-price {
  color: #e43d30;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 44rpx;
}

.price-symbol {
  margin-right: 4rpx;
  font-size: 22rpx;
}

.quote-button {
  width: 178rpx;
  height: 56rpx;
  margin: 0;
  padding: 0;
  color: #fff;
  font-size: 22rpx;
  line-height: 56rpx;
  white-space: nowrap;
  background: #e43d30;
  border-radius: 8rpx;
}

.quote-button::after {
  border: 0;
}

.quote-progress {
  display: flex;
  margin-top: 8rpx;
  align-items: center;
  justify-content: space-between;
  color: $jfx-font-dec2;
  font-size: 20rpx;
  font-weight: 400;
  line-height: 30rpx;
  white-space: nowrap;
}

.received-info {
  display: flex;
  align-items: center;
}

.received-avatars {
  width: 56rpx;
  height: 24rpx;
  margin-right: 4rpx;
  flex-shrink: 0;
}

.list-tip {
  padding: 64rpx 0 24rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  font-weight: 400;
  text-align: center;
}

.empty-state {
  padding: 180rpx 0;
  text-align: center;
}

.empty-title {
  font-size: 28rpx;
}

.empty-description {
  margin-top: 12rpx;
  color: $jfx-font-dec2;
  font-size: 22rpx;
  font-weight: 400;
}
</style>

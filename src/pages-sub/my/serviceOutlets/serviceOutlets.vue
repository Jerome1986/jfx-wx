<script setup lang="ts">
import { useRenovationBusinessStore } from '@/stores/modules/renovation-business'
import type { ServiceOutlet } from '@/types/service-outlets'
// 装修业务状态
const renovationBusinessStore = useRenovationBusinessStore()

// 状态栏高度
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0
// 网点列表
const outlets: ServiceOutlet[] = [
  {
    id: 1,
    name: '家翻新洪山服务中心',
    distance: 1.8,
    time: '09:00-18:00',
    address: '湖北省武汉市洪山区珞喻路88号',
    categories: ['全部', '装修咨询'],
    image: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/beijingtu/wangdian.png',
  },
  {
    id: 2,
    name: '家翻新汉口售后服务站',
    distance: 1.8,
    time: '09:00-18:00',
    address: '湖北省武汉市洪山区珞喻路88号',
    categories: ['全部', '售后服务'],
    image: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/beijingtu/wangdian.png',
  },
]

// 返回上一页
const goBack = () => uni.navigateBack()

// 切换当前服务地区
const switchRegion = () => {
  uni.showActionSheet({
    itemList: ['武汉', '长沙', '南昌'],
    success: ({ tapIndex }) => {
      if (tapIndex !== 0) {
        uni.showToast({ title: '该城市网点正在建设中', icon: 'none' })
      }
    },
  })
}

// 拨打服务网点
const callOutlet = () => uni.makePhoneCall({ phoneNumber: '400-888-6688' })
// 导航到服务网点
const navigateOutlet = (outlet: ServiceOutlet) => {
  uni.openLocation({
    latitude: 30.515,
    longitude: 114.412,
    name: outlet.name,
    address: outlet.address,
  })
}
// 预约当前服务网点
const reserveOutlet = (outlet: ServiceOutlet) => {
  renovationBusinessStore.createAppointment({
    type: 'OUTLET',
    source: '服务网点',
    city: '武汉',
    demand: '预约到店咨询',
    snapshot: { title: outlet.name, address: outlet.address, contact: '400-888-6688' },
  })
  uni.showToast({ title: '网点咨询预约已提交', icon: 'success' })
  setTimeout(
    () => uni.navigateTo({ url: '/pages-sub/my/decorationOrder/decorationOrder?group=consult' }),
    400,
  )
}
// 联系在线客服
const contactService = () => uni.showToast({ title: '正在连接在线客服', icon: 'none' })
</script>

<template>
  <view class="outlet-page">
    <view class="custom-navigation" :style="{ paddingTop: `${statusBarHeight}px` }">
      <view class="back-button" @click="goBack">
        <text class="iconfont icon-youjiantou back-icon" />
      </view>
      <view class="navigation-title">服务网点</view>
      <view class="navigation-placeholder" />
    </view>

    <view class="page-content">
      <view class="city-card">
        <view class="city-row">
          <view class="city-copy">
            <view class="city-label">当前城市</view>
            <view class="city-line">
              <text class="city-name">武汉</text>
              <text class="city-tip">已为你定位附近服务网点</text>
            </view>
          </view>
          <view class="region-button" @click="switchRegion">
            <text class="iconfont icon-dizhiguanli region-icon" />
            <text>切换区域</text>
          </view>
        </view>
        <view class="city-divider" />
        <view class="search-tip">查找可咨询、可导航、可预约到店的家翻新服务网点</view>
      </view>

      <view class="list-title">推荐服务网点</view>
      <scroll-view class="outlet-list-scroll" scroll-y :show-scrollbar="false">
        <view v-for="outlet in outlets" :key="outlet.id" class="outlet-card">
          <view class="outlet-head">
            <image class="outlet-image" :src="outlet.image" mode="aspectFill" />
            <view class="outlet-summary">
              <view class="outlet-name">{{ outlet.name }}</view>
              <view class="outlet-distance">距你{{ outlet.distance }}KM</view>
            </view>
          </view>
          <view class="outlet-divider" />
          <view class="info-row">
            <image
              class="service-time-icon"
              src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/待确认 2.png"
              mode="aspectFit"
            />
            <text>服务时间：{{ outlet.time }}</text>
          </view>
          <view class="info-row address-row">
            <text class="iconfont icon-dizhiguanli address-icon" />
            <text>{{ outlet.address }}</text>
          </view>
          <view class="action-row">
            <button class="outline-button" @click="callOutlet">电话咨询</button>
            <button class="outline-button" @click="navigateOutlet(outlet)">导航前往</button>
            <button class="primary-button" @click="reserveOutlet(outlet)">预约咨询</button>
          </view>
        </view>
        <view class="scroll-bottom-space" />
      </scroll-view>
    </view>

    <view class="customer-bar">
      <view class="customer-copy">
        <view class="customer-title">没有找到合适网点？</view>
        <view class="customer-tip">在线客服可协助安排最近服务人员</view>
      </view>
      <button class="customer-button" @click="contactService">联系在线客服</button>
    </view>
  </view>
</template>

<style lang="scss">
.outlet-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: #1d1d1f;
  background: #f8f7f5;
}
.custom-navigation {
  position: relative;
  display: flex;
  box-sizing: content-box;
  height: 88rpx;
  padding-right: 24rpx;
  padding-left: 24rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  background: #f8f7f5;
}
.back-button {
  display: flex;
  width: 76rpx;
  height: 100%;
  align-items: center;
}
.back-icon {
  color: #aaaaaa;
  font-size: 32rpx;
  transform: rotate(180deg);
}
.navigation-title {
  position: absolute;
  right: 0;
  left: 0;
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
  pointer-events: none;
}
.navigation-placeholder {
  width: 76rpx;
}
.page-content {
  display: flex;
  min-height: 0;
  padding: 22rpx 24rpx 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}
.city-card,
.outlet-card {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 28rpx rgba(55, 42, 32, 0.045);
}
.city-card {
  padding: 22rpx 24rpx 20rpx;
}
.city-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.city-label {
  color: #777;
  font-size: 24rpx;
  line-height: 34rpx;
}
.city-line {
  display: flex;
  margin-top: 4rpx;
  align-items: baseline;
}
.city-name {
  font-size: 31rpx;
  font-weight: 600;
  line-height: 43rpx;
}
.city-tip {
  margin-left: 22rpx;
  color: #666;
  font-size: 23rpx;
  line-height: 34rpx;
}
.region-button {
  display: flex;
  height: 56rpx;
  padding: 0 20rpx;
  align-items: center;
  color: #ef3730;
  font-size: 24rpx;
  background: #fff0ef;
  border-radius: 10rpx;
}
.region-icon {
  margin-right: 10rpx;
  font-size: 32rpx;
}
.city-divider,
.outlet-divider {
  height: 2rpx;
  background: #eeeeee;
}
.city-divider {
  margin: 20rpx 0;
}
.search-tip {
  color: #999;
  font-size: 23rpx;
  line-height: 34rpx;
}
.list-title {
  margin: 24rpx 0 22rpx;
  font-size: 29rpx;
  font-weight: 600;
  line-height: 40rpx;
}
.outlet-list-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.outlet-card {
  margin-bottom: 24rpx;
  padding: 16rpx 24rpx 18rpx;
}
.outlet-head {
  display: flex;
  align-items: flex-start;
}
.outlet-image {
  width: 190rpx;
  height: 122rpx;
  flex-shrink: 0;
  background: #eee;
  border-radius: 16rpx;
}
.outlet-summary {
  min-width: 0;
  margin-left: 18rpx;
  padding-top: 5rpx;
}
.outlet-name {
  overflow: hidden;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 38rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.outlet-distance {
  margin-top: 10rpx;
  color: #666;
  font-size: 24rpx;
  line-height: 34rpx;
}
.outlet-divider {
  margin: 16rpx 0;
}
.info-row {
  display: flex;
  min-height: 38rpx;
  align-items: center;
  gap: 16rpx;
  color: #666;
  font-size: 23rpx;
  line-height: 34rpx;
}
.service-time-icon {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
}
.address-row {
  margin-top: 8rpx;
}
.address-icon {
  display: inline-flex;
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: #ef3730;
  font-size: 30rpx;
  line-height: 34rpx;
}
.action-row {
  display: flex;
  margin-top: 16rpx;
  justify-content: flex-end;
  gap: 20rpx;
}
.outline-button,
.primary-button {
  height: 44rpx;
  margin: 0;
  padding: 0 20rpx;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 42rpx;
  border-radius: 15rpx;
}
.outline-button {
  color: #666;
  background: #fff;
  border: 2rpx solid #eeeeee;
}
.primary-button {
  color: #fff;
  background: #e92f27;
  border: 2rpx solid #e92f27;
}
.scroll-bottom-space {
  height: 24rpx;
}
.customer-bar {
  display: flex;
  box-sizing: border-box;
  min-height: 122rpx;
  padding: 20rpx 40rpx calc(20rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-top: 2rpx solid #e8e5e1;
}
.customer-title {
  font-size: 24rpx;
  font-weight: 600;
  line-height: 34rpx;
}
.customer-tip {
  margin-top: 4rpx;
  color: #777;
  font-size: 21rpx;
  line-height: 30rpx;
  white-space: nowrap;
}
.customer-button {
  width: 202rpx;
  height: 54rpx;
  margin: 0 0 0 20rpx;
  flex-shrink: 0;
  color: #fff;
  font-size: 24rpx;
  line-height: 54rpx;
  background: #e92f27;
  border-radius: 16rpx;
}
button::after {
  border: 0;
}
</style>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getAddressListApi } from '@/api/address'
import { type ServiceAddress, useAddressStore } from '@/stores/modules/address'
import type { AddressItem } from '@/types/address-api'

// 自定义导航栏尺寸
const statusBarHeight = ref(0)
// 导航栏高度
const navigationHeight = ref(44)

// 持久化服务地址与当前选择
const addressStore = useAddressStore()
const { addresses, selectedId, selectedAddress } = storeToRefs(addressStore)

// 服务地址
const toServiceAddress = (item: AddressItem): ServiceAddress => ({
  id: item.id,
  name: item.contactName,
  phone: item.phone,
  locationName: item.locationName,
  address: item.address,
  doorplate: item.doorplate,
  latitude: item.latitude,
  longitude: item.longitude,
})

// 加载地址列表
const loadAddressList = async () => {
  try {
    const { data } = await getAddressListApi()
    addressStore.setAddresses(data.map(toServiceAddress))
  } catch (error) {
    console.error('获取地址列表失败：', error)
  }
}

onShow(loadAddressList)

// 读取状态栏和小程序胶囊尺寸
onMounted(() => {
  // 系统信息
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
  // 菜单按钮
  const menuButton = uni.getMenuButtonBoundingClientRect()
  if (menuButton?.height && menuButton?.top) {
    navigationHeight.value = (menuButton.top - statusBarHeight.value) * 2 + menuButton.height
  }
})

// 页面导航与地址操作
const goBack = () => uni.navigateBack()
// 选择地址
const selectAddress = (id: number) => addressStore.selectAddress(id)
// 获取编辑模式下的地址
const editAddress = (item: ServiceAddress) =>
  uni.navigateTo({ url: `/pages-sub/my/addressForm/addressForm?mode=edit&id=${item.id}` })
// 添加地址
const addAddress = () => uni.navigateTo({ url: '/pages-sub/my/addressForm/addressForm?mode=add' })
// 确认地址
const confirmAddress = () => uni.navigateBack()
</script>

<template>
  <view class="address-page">
    <!-- 自定义页面导航 -->
    <view
      class="custom-navigation"
      :style="{ paddingTop: `${statusBarHeight}px`, height: `${navigationHeight}px` }"
    >
      <view class="back-button" @click="goBack">
        <text class="iconfont icon-youjiantou back-icon" />
      </view>
      <view class="navigation-title">服务地址</view>
      <view class="navigation-placeholder" />
    </view>

    <!-- 地址列表与说明 -->
    <scroll-view class="address-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view
          v-for="item in addresses"
          :key="item.id"
          class="address-card"
          @click="selectAddress(item.id)"
        >
          <wd-checkbox :model-value="selectedId === item.id" checked-color="#D92D20" />
          <view class="address-content">
            <view class="contact-line">
              <text class="contact-name">{{ item.name }}</text>
              <text class="contact-phone">{{ item.phone }}</text>
            </view>
            <view class="address-line">{{ item.address }}</view>
          </view>
          <image
            class="edit-icon"
            src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/edit.png"
            mode="aspectFit"
            @click.stop="editAddress(item)"
          />
        </view>

        <view class="description-card">
          <view class="description-title">地址说明</view>
          <view class="description-text">选择服务地址后，师傅按该地址联系上门安装</view>
        </view>
      </view>
    </scroll-view>

    <!-- 新增服务地址 -->
    <view class="add-address-wrap">
      <button class="add-address-button" @click="addAddress">新增服务地址</button>
    </view>

    <!-- 当前选择与确认 -->
    <view class="confirm-bar">
      <view class="selected-summary">
        <view class="selected-label">已选择</view>
        <view class="selected-name">{{ selectedAddress?.name || '暂无地址' }}</view>
        <view class="selected-address">{{ selectedAddress?.address || '请新增服务地址' }}</view>
      </view>
      <button class="confirm-button" @click="confirmAddress">确认使用</button>
    </view>
  </view>
</template>

<style lang="scss">
/* 页面基础布局 */
.address-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: $jfx-font-title;
  background: $jfx-pageBackGroundColor;
}

/* 自定义导航栏 */
.custom-navigation {
  position: relative;
  display: flex;
  box-sizing: content-box;
  padding: 0 24rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
}
.back-button {
  display: flex;
  width: 76rpx;
  height: 100%;
  align-items: center;
}
.back-icon {
  color: $jfx-font-dec2;
  font-size: 32rpx;
  transform: rotate(180deg);
}
.navigation-title {
  position: absolute;
  right: 0;
  left: 0;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 44rpx;
  text-align: center;
  pointer-events: none;
}
.navigation-placeholder {
  width: 76rpx;
}

/* 地址列表 */
.address-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.page-content {
  padding: 28rpx 24rpx 32rpx;
}
.address-card {
  display: flex;
  min-height: 122rpx;
  margin-bottom: 24rpx;
  padding: 24rpx;
  align-items: center;
  background: #fff;
  border-radius: 18rpx;
}
.address-content {
  min-width: 0;
  margin-left: 20rpx;
  flex: 1;
}
.contact-line {
  display: flex;
  align-items: center;
  gap: 42rpx;
  color: $jfx-font-title;
  line-height: 38rpx;
}
.contact-name {
  font-size: 28rpx;
  font-weight: 600;
}
.contact-phone {
  font-size: 25rpx;
}
.address-line {
  margin-top: 7rpx;
  overflow: hidden;
  color: $jfx-font-dec;
  font-size: 24rpx;
  line-height: 34rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.edit-icon {
  width: 48rpx;
  height: 48rpx;
  margin-left: 20rpx;
  flex-shrink: 0;
}

/* 地址选择说明 */
.description-card {
  padding: 26rpx 24rpx;
  background: #fff;
  border-radius: 18rpx;
}
.description-title {
  color: $jfx-font-title;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 38rpx;
}
.description-text {
  margin-top: 8rpx;
  color: $jfx-font-dec2;
  font-size: 23rpx;
  line-height: 34rpx;
}

/* 新增地址按钮 */
.add-address-wrap {
  padding: 16rpx 24rpx;
  flex-shrink: 0;
  background: $jfx-pageBackGroundColor;
}
.add-address-button {
  height: 72rpx;
  margin: 0;
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 72rpx;
  background: $jfx-brandColor;
  border-radius: 16rpx;
}

/* 底部确认栏 */
.confirm-bar {
  display: flex;
  box-sizing: border-box;
  min-height: 138rpx;
  padding: 18rpx 40rpx calc(18rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  align-items: center;
  background: #fff;
  border-top: 2rpx solid $jfx-border2;
}
.selected-summary {
  min-width: 0;
  flex: 1;
}
.selected-label {
  color: $jfx-font-dec2;
  font-size: 22rpx;
  line-height: 30rpx;
}
.selected-name {
  margin-top: 3rpx;
  color: $jfx-font-title;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 34rpx;
}
.selected-address {
  margin-top: 3rpx;
  overflow: hidden;
  color: $jfx-font-dec;
  font-size: 21rpx;
  line-height: 30rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.confirm-button {
  width: 244rpx;
  height: 64rpx;
  margin: 0 0 0 24rpx;
  flex-shrink: 0;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 64rpx;
  background: $jfx-brandColor;
  border-radius: 16rpx;
}
button::after {
  border: 0;
}
</style>

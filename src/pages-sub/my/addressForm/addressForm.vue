<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createAddressApi,
  deleteAddressApi,
  getAddressDetailApi,
  updateAddressApi,
} from '@/api/address'
import { useAddressStore } from '@/stores/modules/address'
import { useMemberStore } from '@/stores/modules/member'
import type { AddressFormMode as FormMode } from '@/types/address-form'
import type { AddressItem, CreateAddressParams, UpdateAddressParams } from '@/types/address-api'

// 页面模式和自定义导航栏尺寸
const mode = ref<FormMode>('add')
// 编辑中编号
const editingId = ref(0)
// 状态栏高度
const statusBarHeight = ref(0)
// 导航栏高度
const navigationHeight = ref(44)
// 地址状态仓库
const addressStore = useAddressStore()
// 会员状态仓库
const memberStore = useMemberStore()
// 地址保存状态
const saving = ref(false)
// 删除中状态
const deleting = ref(false)

// 地址表单数据
const form = reactive({
  name: '',
  phone: '',
  locationName: '',
  address: '',
  doorplate: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
})

// 是否为编辑模式
const isEdit = computed(() => mode.value === 'edit')
// 页面标题
const pageTitle = computed(() => (isEdit.value ? '编辑服务地址' : '新增服务地址'))
// 标题
const searchTitle = computed(() => (isEdit.value ? '重新搜索服务位置' : '搜索并选择服务位置'))
// 说明
const searchDescription = computed(() =>
  isEdit.value ? '通过微信位置搜索重新选择小区、门店或街道' : '选择位置后自动填写',
)

// 读取路由模式并回填编辑数据
onLoad((options) => {
  mode.value = options?.mode === 'edit' ? 'edit' : 'add'
  editingId.value = Number(options?.id || 0)
  if (!isEdit.value) return

  loadAddressDetail()
})

// 判断是否为服务地址
const toServiceAddress = (item: AddressItem) => ({
  id: item.id,
  name: item.contactName,
  phone: item.phone,
  locationName: item.locationName,
  address: item.address,
  doorplate: item.doorplate,
  latitude: item.latitude,
  longitude: item.longitude,
})

// 加载地址详情
const loadAddressDetail = async () => {
  if (!editingId.value) {
    uni.showToast({ title: '地址参数错误', icon: 'none' })
    return
  }
  try {
    const { data } = await getAddressDetailApi(editingId.value)
    Object.assign(form, toServiceAddress(data))
  } catch (error) {
    console.error('获取地址详情失败：', error)
  }
}

// 读取设备状态栏和胶囊尺寸
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

// 调用微信位置选择并回填地址
const chooseLocation = () => {
  uni.chooseLocation({
    success: (result) => {
      form.locationName = result.name || result.address
      form.address = result.address || result.name
      form.latitude = result.latitude
      form.longitude = result.longitude
    },
    fail: (error) => {
      console.error('地址错误信息', error)
      if (error.errMsg?.includes('cancel')) return
      uni.showToast({ title: '位置选择失败，请重试', icon: 'none' })
    },
  })
}

// 校验地址表单
const validateForm = () => {
  if (!form.name.trim()) return '请输入联系人姓名'
  // 手机号
  const phone = form.phone.trim()
  // 手机号格式是否有效
  const isPhoneValid = /^1\d{10}$/.test(phone) || (isEdit.value && /^1\d{2}\*{4}\d{4}$/.test(phone))
  if (!isPhoneValid) return '请输入正确的手机号码'
  if (!form.locationName.trim()) return '请选择服务位置'
  if (!form.address.trim()) return '请填写详细地址'
  return ''
}

// 保存新增或编辑结果
const saveAddress = async () => {
  if (saving.value) return
  // 当前错误信息
  const error = validateForm()
  if (error) {
    uni.showToast({ title: error, icon: 'none' })
    return
  }
  // 用户编号
  const userId = Number(memberStore.profile?.id)
  if (!Number.isInteger(userId) || userId <= 0) {
    uni.showToast({ title: '用户信息异常，请重新登录', icon: 'none' })
    return
  }
  // 接口请求参数
  const payload: CreateAddressParams = {
    userId,
    contactName: form.name.trim(),
    phone: form.phone.trim(),
    locationName: form.locationName.trim(),
    province: '',
    city: '',
    district: '',
    address: form.address.trim(),
    doorplate: form.doorplate.trim(),
    latitude: form.latitude,
    longitude: form.longitude,
    isDefault: !addressStore.addresses.length,
    isEnabled: true,
  }
  saving.value = true
  try {
    if (isEdit.value) {
      // 更新接口请求参数
      const updatePayload: UpdateAddressParams = {
        contactName: payload.contactName,
        phone: payload.phone,
        locationName: payload.locationName,
        address: payload.address,
        doorplate: payload.doorplate,
        latitude: payload.latitude,
        longitude: payload.longitude,
      }
      const { data } = await updateAddressApi(editingId.value, updatePayload)
      addressStore.updateAddress(editingId.value, toServiceAddress(data))
      addressStore.selectAddress(editingId.value)
    } else {
      const { data } = await createAddressApi(payload)
      addressStore.addAddress(toServiceAddress(data))
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (error) {
    console.error('保存地址失败：', error)
  } finally {
    saving.value = false
  }
}

// 二次确认后删除当前地址
const deleteAddress = () => {
  if (deleting.value) return
  if (addressStore.addresses.length <= 1) {
    uni.showToast({ title: '至少保留一个服务地址', icon: 'none' })
    return
  }
  uni.showModal({
    title: '删除服务地址',
    content: '确定删除该服务地址吗？',
    confirmColor: '#D92D20',
    success: async (result) => {
      if (!result.confirm) return
      deleting.value = true
      try {
        await deleteAddressApi(editingId.value)
        addressStore.removeAddress(editingId.value)
        uni.showToast({ title: '删除成功', icon: 'success' })
        setTimeout(() => uni.navigateBack(), 500)
      } catch (error) {
        console.error('删除地址失败：', error)
      } finally {
        deleting.value = false
      }
    },
  })
}

// 返回上一页
const goBack = () => uni.navigateBack()
</script>

<template>
  <view class="form-page">
    <!-- 自定义页面导航 -->
    <view
      class="custom-navigation"
      :style="{ paddingTop: `${statusBarHeight}px`, height: `${navigationHeight}px` }"
    >
      <view class="back-button" @click="goBack"
        ><text class="iconfont icon-youjiantou back-icon"
      /></view>
      <view class="navigation-title">{{ pageTitle }}</view>
      <view class="navigation-placeholder" />
    </view>

    <scroll-view class="form-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <!-- 联系人信息 -->
        <view class="form-card contact-card">
          <view class="form-row">
            <text class="form-label">联系人</text>
            <input
              v-model="form.name"
              class="form-input"
              :maxlength="20"
              placeholder="请输入联系人姓名"
              placeholder-class="input-placeholder"
            />
          </view>
          <view class="form-row">
            <text class="form-label">手机号</text>
            <input
              v-model="form.phone"
              class="form-input"
              :maxlength="11"
              placeholder="请输入手机号码"
              placeholder-class="input-placeholder"
            />
          </view>
        </view>

        <!-- 服务位置和详细地址 -->
        <view class="form-card location-card">
          <view class="section-title">服务位置</view>
          <view class="search-location" @click="chooseLocation">
            <image
              class="search-icon"
              :src="
                isEdit
                  ? 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/search.png'
                  : 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/定位%201.png'
              "
              mode="aspectFit"
            />
            <view class="search-content">
              <view class="search-title">{{ searchTitle }}</view>
              <view class="search-description">{{ searchDescription }}</view>
            </view>
            <text class="iconfont icon-youjiantou right-arrow" />
          </view>

          <view v-if="form.locationName" class="selected-location">
            <image
              class="location-icon"
              src="https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/定位%201.png"
              mode="aspectFit"
            />
            <view>
              <view class="selected-label">已选位置</view>
              <view class="selected-name">{{ form.locationName }}</view>
            </view>
          </view>

          <view class="form-row address-row">
            <text class="form-label">详细地址</text>
            <input
              v-model="form.address"
              class="form-input"
              placeholder="如未自动填写，可手动补充或修改"
              placeholder-class="input-placeholder"
            />
          </view>
          <view class="form-row">
            <text class="form-label">门牌楼层</text>
            <input
              v-model="form.doorplate"
              class="form-input"
              placeholder="如：2栋1单元1203"
              placeholder-class="input-placeholder"
            />
          </view>
        </view>

        <!-- 地址填写说明 -->
        <view class="description-card">
          <view class="description-title">填写说明</view>
          <view class="description-text"
            >可直接通过微信位置搜索选择服务位置；详细地址可根据搜索结果自动填写或手动填写；门派楼层需用户手动填写</view
          >
        </view>

        <!-- 编辑模式删除入口 -->
        <button
          v-if="isEdit"
          class="delete-button"
          :loading="deleting"
          :disabled="deleting || saving"
          @click="deleteAddress"
        >
          删除服务地址
        </button>
      </view>
    </scroll-view>

    <!-- 固定保存按钮 -->
    <view class="save-bar">
      <button
        class="save-button"
        :loading="saving"
        :disabled="saving || deleting"
        @click="saveAddress"
      >
        {{ isEdit ? '保存修改' : '保存并使用' }}
      </button>
    </view>
  </view>
</template>

<style lang="scss">
/* 页面基础布局 */
.form-page {
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

/* 表单滚动区域 */
.form-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.page-content {
  padding: 28rpx 24rpx 32rpx;
}

.form-card,
.description-card {
  background: #fff;
  border-radius: 18rpx;
}

.contact-card {
  padding: 0 24rpx;
}

.form-row {
  display: flex;
  min-height: 76rpx;
  align-items: center;
  border-bottom: 2rpx solid $jfx-border;
}

.form-row:last-child {
  border-bottom: 0;
}

.form-label {
  width: 180rpx;
  flex-shrink: 0;
  color: $jfx-font-title;
  font-size: 26rpx;
  font-weight: 500;
}

.form-input {
  height: 76rpx;
  min-width: 0;
  flex: 1;
  color: $jfx-font-dec;
  font-size: 24rpx;
  line-height: 76rpx;
  text-align: right;
}

.input-placeholder {
  color: $jfx-font-dec2;
}

/* 服务位置区域 */
.location-card {
  margin-top: 24rpx;
  padding: 26rpx 24rpx 0;
}

.section-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.search-location {
  display: flex;
  min-height: 106rpx;
  margin-top: 18rpx;
  padding: 18rpx 22rpx;
  align-items: center;
  background: #fff0ef;
  border-radius: 16rpx;
}

.search-icon {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
}

.search-content {
  min-width: 0;
  margin-left: 22rpx;
  flex: 1;
}

.search-title {
  color: $jfx-brandColor;
  font-size: 27rpx;
  font-weight: 500;
  line-height: 38rpx;
}

.search-description {
  margin-top: 4rpx;
  color: #e26a63;
  font-size: 21rpx;
  line-height: 30rpx;
}

.right-arrow {
  flex-shrink: 0;
  color: $jfx-brandColor;
  font-size: 28rpx;
}

.selected-location {
  display: flex;
  min-height: 116rpx;
  padding: 22rpx 24rpx;
  align-items: center;
  gap: 22rpx;
  border-bottom: 2rpx solid $jfx-border;
}

.location-icon {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
}

.selected-label {
  color: $jfx-brandColor;
  font-size: 23rpx;
  line-height: 32rpx;
}

.selected-name {
  margin-top: 4rpx;
  color: $jfx-font-title;
  font-size: 25rpx;
  font-weight: 500;
  line-height: 36rpx;
}

.address-row {
  margin-top: 8rpx;
}

/* 填写说明和删除按钮 */
.description-card {
  margin-top: 24rpx;
  padding: 28rpx 24rpx;
}

.description-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}

.description-text {
  margin-top: 8rpx;
  color: $jfx-font-dec2;
  font-size: 23rpx;
  line-height: 36rpx;
}

.delete-button {
  height: 66rpx;
  margin: 42rpx 0 0;
  color: $jfx-brandColor;
  font-size: 25rpx;
  line-height: 66rpx;
  background: #fff;
  border: 2rpx solid $jfx-border2;
  border-radius: 16rpx;
}

/* 底部安全区保存栏 */
.save-bar {
  box-sizing: border-box;
  padding: 24rpx 40rpx calc(24rpx + constant(safe-area-inset-bottom));
  padding: 24rpx 40rpx calc(24rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  background: #fff;
  border-top: 2rpx solid $jfx-border2;
}

.save-button {
  height: 72rpx;
  margin: 0;
  color: #fff;
  font-size: 29rpx;
  font-weight: 500;
  line-height: 72rpx;
  background: $jfx-brandColor;
  border-radius: 16rpx;
}

button::after {
  border: 0;
}
</style>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { reactive, ref } from 'vue'
import { useMemberStore } from '@/stores'
import type { Gender } from '@/types/member'
import { userInfoUpdate } from '@/api/user'

// 会员状态仓库
const memberStore = useMemberStore()
// 默认头像
const fallbackAvatar =
  'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/avatar/kefutouxiang.png'
// 性别
const genderOptions = [
  { label: '男', value: 'MALE' },
  { label: '女', value: 'FEMALE' },
]
// 性别选择器可见
const genderPickerVisible = ref(false)
// 性别值
const genderValue = ref<Gender[]>([])
// 资料保存状态
const saving = ref(false)
// 表单
const form = reactive<{ avatar: string; nickname: string; gender: Gender | '' }>({
  avatar: '',
  nickname: '',
  gender: '',
})

// 填充表单
const fillForm = () => {
  // 用户资料
  const profile = memberStore.profile
  if (!profile) {
    uni.redirectTo({ url: '/pages/login/login' })
    return
  }
  form.avatar = profile.avatar || fallbackAvatar
  form.nickname = profile.nickname || profile.name || ''
  form.gender = profile.gender || ''
  genderValue.value = profile.gender ? [profile.gender] : []
}

onShow(fillForm)

// 选择头像
const chooseAvatar = (event: any) => {
  // 临时文件路径
  const tempFilePath = event.detail?.avatarUrl
  if (!tempFilePath) return

  uni.uploadFile({
    url: 'https://a9lhd8buo8.sealoshzh.site/upload/images',
    filePath: tempFilePath,
    name: 'avatar', // 需要与后端接收文件的字段名一致
    success: (response) => {
      console.log('头像上传返回', response)
      form.avatar = response.data
    },
  })
}

// 选择性别
const chooseGender = (event: { value: Array<string | number> }) => {
  form.gender = (event.value[0] as Gender) || ''
}

// 保存用户资料
const saveProfile = async () => {
  if (saving.value) return

  // 昵称
  const nickname = form.nickname.trim()
  if (!nickname) {
    uni.showToast({ title: '请输入姓名', icon: 'none' })
    return
  }
  if (!form.gender) {
    uni.showToast({ title: '请选择性别', icon: 'none' })
    return
  }

  // 当前用户资料
  const currentProfile = memberStore.profile
  if (!currentProfile) return

  // 用户编号
  const userId = Number(currentProfile.id)
  if (!Number.isInteger(userId) || userId <= 0) {
    uni.showToast({ title: '用户信息异常，请重新登录', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const { data: userInfo } = await userInfoUpdate(userId, nickname, form.avatar, form.gender)

    memberStore.setProfile({
      ...currentProfile,
      ...userInfo,
      role: userInfo.role,
      name: userInfo.realName,
    })
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (error) {
    console.error('更新用户资料失败：', error)
  } finally {
    saving.value = false
  }
}

// 退出当前账号
const logout = () => {
  uni.showModal({
    title: '退出登录',
    content: '确定退出当前账号吗？',
    confirmText: '退出',
    confirmColor: '#D92D20',
    success: (result) => {
      if (!result.confirm) return
      memberStore.clearProfile()
      uni.switchTab({ url: '/pages/my/my' })
    },
  })
}
</script>

<template>
  <view class="settings-page">
    <view class="profile-card">
      <view class="avatar-row">
        <view class="field-copy">
          <text class="field-title">头像</text>
          <text class="field-description">点击更换个人头像</text>
        </view>
        <button class="avatar-button" open-type="chooseAvatar" @chooseavatar="chooseAvatar">
          <image class="avatar-image" :src="form.avatar || fallbackAvatar" mode="aspectFill" />
          <text class="iconfont icon-youjiantou row-arrow" />
        </button>
      </view>

      <view class="form-row">
        <text class="form-label">昵称</text>
        <input
          v-model="form.nickname"
          class="form-input"
          type="nickname"
          :maxlength="20"
          placeholder="请输入姓名"
          placeholder-class="input-placeholder"
        />
      </view>
      <view class="form-row">
        <text class="form-label">性别</text>
        <view class="gender-picker" @click="genderPickerVisible = true">
          <view class="gender-value" :class="{ placeholder: !form.gender }">
            {{ form.gender === 'MALE' ? '男' : form.gender === 'FEMALE' ? '女' : '请选择' }}
            <text class="iconfont icon-youjiantou gender-arrow" />
          </view>
        </view>
      </view>
      <view class="form-row last-row">
        <text class="form-label">账号身份</text>
        <text class="readonly-value">
          {{ memberStore.profile?.role === 'EMPLOYEE' ? '员工账号' : '用户账号' }}
        </text>
      </view>
    </view>

    <view class="privacy-tip">个人信息仅用于账号展示和服务联系，我们会妥善保护您的信息。</view>
    <button class="save-button" :loading="saving" :disabled="saving" @click="saveProfile">
      保存修改
    </button>
    <button class="logout-button" @click="logout">退出登录</button>

    <wd-picker
      v-model="genderValue"
      v-model:visible="genderPickerVisible"
      title="选择性别"
      :columns="genderOptions"
      confirm-button-text="确定"
      custom-style="--wot-picker-action-color-confirm: #D92D20;"
      @confirm="chooseGender"
    />
  </view>
</template>

<style lang="scss">
page {
  min-height: 100%;
  background: #f8f7f5;
}

.settings-page {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 28rpx 24rpx calc(40rpx + env(safe-area-inset-bottom));
  color: #252525;
}

.profile-card {
  overflow: hidden;
  padding: 0 24rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 5rpx 24rpx rgba(55, 42, 32, 0.035);
}

.avatar-row,
.form-row {
  display: flex;
  box-sizing: border-box;
  align-items: center;
  border-bottom: 2rpx solid #f0efed;
}

.avatar-row {
  min-height: 146rpx;
  justify-content: space-between;
}

.field-copy {
  display: flex;
  flex-direction: column;
}

.field-title,
.form-label {
  color: #252525;
  font-size: 27rpx;
  font-weight: 500;
}

.field-description {
  margin-top: 8rpx;
  color: #999;
  font-size: 22rpx;
}

.avatar-button {
  display: flex;
  height: 112rpx;
  margin: 0;
  padding: 0;
  align-items: center;
  background: transparent;
}

.avatar-button::after,
.save-button::after,
.logout-button::after {
  border: 0;
}

.avatar-image {
  width: 92rpx;
  height: 92rpx;
  background: #eee;
  border-radius: 50%;
}

.row-arrow {
  margin-left: 18rpx;
  color: #bbb;
  font-size: 26rpx;
}

.form-row {
  min-height: 96rpx;
}

.last-row {
  border-bottom: 0;
}

.form-label {
  width: 180rpx;
  flex-shrink: 0;
}

.form-input {
  height: 96rpx;
  min-width: 0;
  flex: 1;
  color: #333;
  font-size: 25rpx;
  line-height: 96rpx;
  text-align: right;
}

.gender-picker {
  flex: 1;
}

.gender-value {
  display: flex;
  height: 96rpx;
  justify-content: flex-end;
  align-items: center;
  color: #333;
  font-size: 25rpx;
}

.gender-value.placeholder {
  color: #999;
}

.gender-arrow {
  margin-left: 14rpx;
  color: #bbb;
  font-size: 24rpx;
}

.input-placeholder,
.readonly-value {
  color: #999;
}

.readonly-value {
  flex: 1;
  font-size: 25rpx;
  text-align: right;
}

.privacy-tip {
  padding: 20rpx 12rpx 0;
  color: #999;
  font-size: 22rpx;
  line-height: 34rpx;
}

.save-button,
.logout-button {
  height: 82rpx;
  margin: 54rpx 16rpx 0;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 82rpx;
  border-radius: 16rpx;
}

.save-button {
  color: #fff;
  background: #d92d20;
  box-shadow: 0 8rpx 18rpx rgba(217, 45, 32, 0.16);
}

.logout-button {
  margin-top: 24rpx;
  color: #d92d20;
  background: #fff;
  border: 2rpx solid #f0d6d3;
}
</style>

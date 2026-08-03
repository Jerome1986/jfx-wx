<script setup lang="ts">
import { ref } from 'vue'
import { useMemberStore } from '@/stores'
import type { UserRole } from '@/types/member'

const brandImage = 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/logo2-1.png'
const wechatIcon =
  'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/%E5%BE%AE%E4%BF%A11.png'

const agreed = ref(false)
const authorizing = ref(false)
const memberStore = useMemberStore()

const enterTestRole = (role: UserRole) => {
  const isEmployee = role === 'employee'
  memberStore.setProfile({
    role,
    employeeId: isEmployee ? 'EMPLOYEE_TEST_001' : undefined,
    nickname: isEmployee ? '张经理' : '张先生',
    mobile: isEmployee ? '15822221111' : '13812345682',
  })
  uni.switchTab({ url: '/pages/my/my' })
}

const toggleAgreement = () => {
  agreed.value = !agreed.value
}

const showAgreement = (name: string) => {
  uni.showToast({ title: `${name}内容待配置`, icon: 'none' })
}

const handleLoginClick = () => {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
  }
}

const handlePhoneNumber = async (event: any) => {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
    return
  }

  const detail = event.detail
  if (detail?.errMsg !== 'getPhoneNumber:ok' || !detail.code) {
    uni.showToast({ title: '未获得手机号授权', icon: 'none' })
    return
  }

  authorizing.value = true
  try {
    // 将 detail.code 传给服务端，由服务端调用微信接口换取手机号并完成登录。
    // 当前项目尚未配置登录接口，接入后请在此处保存用户信息并跳转。
    console.info('微信手机号授权 code：', detail.code)
    uni.showToast({ title: '授权成功', icon: 'success' })
  } finally {
    authorizing.value = false
  }
}
</script>

<template>
  <view class="login-page">
    <view class="brand-area">
      <image class="brand-image" :src="brandImage" mode="widthFix" />
      <view class="slogan">
        <text class="slogan-title">旧房翻新一站式服务平台</text>
        <text class="slogan-subtitle">让家更美好</text>
      </view>
    </view>

    <view class="action-area">
      <button
        class="wechat-login"
        :open-type="agreed ? 'getPhoneNumber' : undefined"
        :loading="authorizing"
        @click="handleLoginClick"
        @getphonenumber="handlePhoneNumber"
      >
        <image class="wechat-icon" :src="wechatIcon" mode="aspectFit" />
        <text>微信手机号快捷登录</text>
      </button>

      <view class="test-login-group">
        <button class="test-login-button customer-button" @click="enterTestRole('customer')">
          用户端
        </button>
        <button class="test-login-button employee-button" @click="enterTestRole('employee')">
          员工端
        </button>
      </view>

      <view class="agreement-row">
        <view
          class="agreement-check"
          :class="{ checked: agreed }"
          role="checkbox"
          :aria-checked="agreed"
          @click="toggleAgreement"
        >
          <text v-if="agreed" class="check-mark">✓</text>
        </view>
        <view class="agreement-text">
          <text @click="toggleAgreement">勾选即代表同意</text>
          <text class="agreement-link" @click.stop="showAgreement('用户协议')">《用户协议》</text>
          <text>和</text>
          <text class="agreement-link" @click.stop="showAgreement('隐私政策')">《隐私政策》</text>
        </view>
      </view>
    </view>

    <view class="footer-brand">
      <view class="footer-line" />
      <text>JIAFANXIN DECORATION</text>
    </view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background: #fff;
}

.login-page {
  box-sizing: border-box;
  display: flex;
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 116rpx) 64rpx calc(env(safe-area-inset-bottom) + 78rpx);
  flex-direction: column;
  align-items: center;
  background: #fff;
}

.brand-area {
  display: flex;
  width: 100%;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.brand-image {
  display: block;
  width: 430rpx;
}

.slogan {
  display: flex;
  margin-top: 64rpx;
  flex-direction: column;
  align-items: center;
}

.slogan-title {
  color: #252525;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 46rpx;
  letter-spacing: 1rpx;
}

.slogan-subtitle {
  margin-top: 14rpx;
  color: #777;
  font-size: 27rpx;
  line-height: 40rpx;
}

.action-area {
  width: 100%;
}

.wechat-login {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 88rpx;
  margin: 0;
  padding: 0 36rpx;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 30rpx;
  font-weight: 500;
  line-height: 88rpx;
  background: #e52b20;
  border: 0;
  border-radius: 18rpx;
}

.wechat-login::after {
  border: 0;
}

.wechat-icon {
  width: 48rpx;
  height: 48rpx;
  margin-right: 22rpx;
  flex-shrink: 0;
}

.test-login-group {
  display: flex;
  margin-top: 24rpx;
  gap: 20rpx;
}

.test-login-button {
  box-sizing: border-box;
  height: 76rpx;
  margin: 0;
  flex: 1;
  font-size: 27rpx;
  font-weight: 500;
  line-height: 74rpx;
  border-radius: 16rpx;
}

.test-login-button::after {
  border: 0;
}

.customer-button {
  color: #e52b20;
  background: #fff;
  border: 2rpx solid #e52b20;
}

.employee-button {
  color: #fff;
  background: #333;
  border: 2rpx solid #333;
}

.agreement-row {
  display: flex;
  margin-top: 26rpx;
  justify-content: center;
  align-items: flex-start;
}

.agreement-check {
  box-sizing: border-box;
  display: flex;
  width: 30rpx;
  height: 30rpx;
  margin: 1rpx 16rpx 0 0;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  border: 2rpx solid #e52b20;
  border-radius: 50%;
}

.agreement-check.checked {
  background: #e52b20;
}

.check-mark {
  color: #fff;
  font-size: 21rpx;
  font-weight: 700;
  line-height: 28rpx;
}

.agreement-text {
  color: #999;
  font-size: 23rpx;
  line-height: 32rpx;
  white-space: nowrap;
}

.agreement-link {
  color: #e52b20;
}

.footer-brand {
  display: flex;
  margin-top: 150rpx;
  flex-direction: column;
  align-items: center;
  color: #777;
  font-size: 28rpx;
  line-height: 40rpx;
}

.footer-line {
  width: 240rpx;
  height: 2rpx;
  margin-bottom: 18rpx;
  background: #999;
}

@media screen and (max-height: 700px) {
  .login-page {
    padding-top: calc(env(safe-area-inset-top) + 60rpx);
  }

  .slogan {
    margin-top: 38rpx;
  }

  .footer-brand {
    margin-top: 72rpx;
  }
}
</style>

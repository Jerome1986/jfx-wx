<script setup lang="ts">
import { computed } from 'vue'
import { useMemberStore } from '@/stores'

// 用户信息与安全区配置
const memberStore = useMemberStore()
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0

// 页面图片资源
const avatar = 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/avatar/kefutouxiang.png'
const memberIcon = 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/钻石 1.png'

// 用户展示信息
const userName = computed(
  () => memberStore.profile?.nickname || memberStore.profile?.name || '张先生',
)
const userMobile = computed(() => {
  const mobile = memberStore.profile?.mobile
  if (!mobile) return '138****5628'
  return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
})

// 账户数据
const accountStats = [
  { value: '2', label: '预约', path: '/pages-sub/my/decorationOrder/decorationOrder' },
  { value: '18', label: '收藏', path: '/pages-sub/my/favorites/favorites' },
  { value: '811', label: '积分', path: '/pages-sub/my/points/points' },
  { value: '3', label: '优惠券', path: '/pages-sub/my/coupons/coupons' },
]

// 商品订单入口
const productOrders = [
  {
    label: '待付款',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/待付款.png',
    path: '/pages-sub/my/productOrder/productOrder?status=pending-payment',
  },
  {
    label: '待安装',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/待安装 1.png',
    path: '/pages-sub/my/productOrder/productOrder?status=pending-installation',
  },
  {
    label: '服务中',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/服务中 2.png',
    path: '/pages-sub/my/productOrder/productOrder?status=servicing',
  },
  {
    label: '已完成',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/完成.png',
    path: '/pages-sub/my/productOrder/productOrder?status=completed',
  },
]

const productOrderPath = '/pages-sub/my/productOrder/productOrder'

// 装修订单入口
const decorationOrders = [
  {
    label: '待确认',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/待确认 1.png',
    path: '/pages-sub/my/renovationOrder/renovationOrder?status=pending',
  },
  {
    label: '待上门',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/待上门 1.png',
    path: '/pages-sub/my/renovationOrder/renovationOrder?status=servicing',
  },
  {
    label: '服务中',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/服务中 1.png',
    path: '/pages-sub/my/renovationOrder/renovationOrder?status=servicing',
  },
  {
    label: '已完成',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/完成.png',
    path: '/pages-sub/my/renovationOrder/renovationOrder?status=completed',
  },
]

const renovationOrderPath = '/pages-sub/my/renovationOrder/renovationOrder'

// 常用功能入口
const commonServices = [
  {
    label: '地址管理',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/地址管理1.png',
    path: '/pages-sub/my/address/address',
  },
  {
    label: '在线客服',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/在线客服1.png',
  },
  {
    label: '意见反馈',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/意见反馈1.png',
    path: '/pages-sub/my/feedback/feedback',
  },
  {
    label: '服务网点',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/服务网点1.png',
    path: '/pages-sub/my/serviceOutlets/serviceOutlets',
  },
]

// 安心保障入口
const guarantees = [
  {
    title: '质保服务',
    description: '30填售后无忧',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/质保服务2.png',
    tone: 'red',
  },
  {
    title: '报价透明',
    description: '明细清晰可查',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/报价透明2.png',
    tone: 'orange',
  },
  {
    title: '快速响应',
    description: '客服即时跟进',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/快速响应2.png',
    tone: 'green',
  },
  {
    title: '专业上门',
    description: '师傅认证服务',
    icon: 'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/tubiao/专业上门2.png',
    tone: 'brown',
  },
]

// 统一处理页面入口点击
const openEntry = (label: string, path?: string) => {
  if (path) {
    uni.navigateTo({ url: path })
    return
  }
  uni.showToast({ title: `${label}功能建设中`, icon: 'none' })
}
</script>

<template>
  <!-- 我的页面结构 -->
  <view class="my-page">
    <scroll-view class="my-scroll" scroll-y :show-scrollbar="false">
      <!-- 用户信息头部 -->
      <view class="profile-hero">
        <!-- 系统安全区域占位 -->
        <view class="safe-area" :style="{ height: `${statusBarHeight}px` }" />
        <view class="page-title"><text>我</text><text class="brand-text">的</text></view>
        <view class="profile-row">
          <image class="avatar" :src="avatar" mode="aspectFill" />
          <view class="profile-copy">
            <view class="profile-name">{{ userName }}</view>
            <view class="profile-mobile">{{ userMobile }}</view>
            <view class="member-badge">
              <image class="member-icon" :src="memberIcon" mode="aspectFit" />
              <text>家翻新会员</text>
            </view>
          </view>
        </view>
      </view>

      <view class="page-content">
        <!-- 账户数据 -->
        <view class="stats-card">
          <view
            v-for="item in accountStats"
            :key="item.label"
            class="stat-item"
            @click="openEntry(item.label, item.path)"
          >
            <text class="stat-value">{{ item.value }}</text>
            <text class="stat-label">{{ item.label }}</text>
          </view>
        </view>

        <!-- 商品订单 -->
        <view class="order-card">
          <view class="card-heading">
            <text class="card-title">我的商品订单</text>
            <view class="all-link" @click="openEntry('全部商品订单', productOrderPath)">
              <text>全部订单</text><text class="iconfont icon-youjiantou arrow" />
            </view>
          </view>
          <view class="order-list">
            <view
              v-for="item in productOrders"
              :key="item.label"
              class="order-item"
              @click="openEntry(item.label, item.path)"
            >
              <image class="order-icon" :src="item.icon" mode="aspectFit" />
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <!-- 装修订单 -->
        <view class="order-card decoration-card">
          <view class="card-heading">
            <text class="card-title">我的装修订单</text>
            <view class="all-link" @click="openEntry('全部装修订单', renovationOrderPath)">
              <text>全部订单</text><text class="iconfont icon-youjiantou arrow" />
            </view>
          </view>
          <view class="order-list">
            <view
              v-for="item in decorationOrders"
              :key="item.label"
              class="order-item"
              @click="openEntry(`装修订单${item.label}`, item.path)"
            >
              <image class="order-icon" :src="item.icon" mode="aspectFit" />
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <!-- 常用功能 -->
        <view class="service-card">
          <view class="section-title">常用功能</view>
          <view class="service-list">
            <view
              v-for="item in commonServices"
              :key="item.label"
              class="service-item"
              @click="openEntry(item.label, item.path)"
            >
              <image class="service-icon" :src="item.icon" mode="aspectFit" />
              <text>{{ item.label }}</text>
            </view>
          </view>
        </view>

        <!-- 安心保障 -->
        <view class="guarantee-card">
          <view class="section-title">安心保障</view>
          <view class="guarantee-grid">
            <view
              v-for="item in guarantees"
              :key="item.title"
              :class="['guarantee-item', `guarantee-${item.tone}`]"
              @click="openEntry(item.title)"
            >
              <image class="guarantee-icon" :src="item.icon" mode="aspectFit" />
              <view class="guarantee-copy">
                <view class="guarantee-title">{{ item.title }}</view>
                <view class="guarantee-description">{{ item.description }}</view>
              </view>
            </view>
          </view>
        </view>

        <view class="bottom-space" />
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
// 页面基础布局
.my-page {
  height: 100vh;
  overflow: hidden;
  background-color: #f8f7f5;
}

.my-scroll {
  height: 100%;
}

// 用户信息头部
.profile-hero {
  padding: 0 48rpx 24rpx;
  box-sizing: border-box;
  background: #fff
    url('https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/beijingtu/my-beijing.png')
    center bottom / cover no-repeat;
}

// 系统安全区域占位
.safe-area {
  width: 100%;
  flex-shrink: 0;
}

// 用户资料
.page-title {
  padding-top: 19rpx;
  color: #1d1d1f;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 54rpx;
}

.brand-text {
  color: #ed342e;
}

.profile-row {
  display: flex;
  margin-top: 12rpx;
  align-items: center;
}

.avatar {
  width: 116rpx;
  height: 116rpx;
  flex-shrink: 0;
  background-color: #eeeeee;
  border-radius: 50%;
}

.profile-copy {
  margin-left: 28rpx;
}

.profile-name {
  color: #222222;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 40rpx;
}

.profile-mobile {
  margin-top: 2rpx;
  color: #333333;
  font-size: 24rpx;
  line-height: 32rpx;
}

.member-badge {
  display: flex;
  width: fit-content;
  height: 38rpx;
  margin-top: 8rpx;
  padding: 0 16rpx;
  align-items: center;
  color: #f34a43;
  font-size: 24rpx;
  line-height: 38rpx;
  background-color: #fff0ef;
  border-radius: 20rpx;
}

.member-icon {
  width: 30rpx;
  height: 30rpx;
  margin-right: 8rpx;
  flex-shrink: 0;
}

// 页面主体内容
.page-content {
  padding: 0 24rpx;
}

// 通用卡片
.stats-card,
.order-card,
.service-card,
.guarantee-card {
  background-color: #ffffff;
  border-radius: 18rpx;
  box-shadow: 0 5rpx 24rpx rgba(55, 42, 32, 0.035);
}

// 账户数据卡片
.stats-card {
  display: flex;
  height: 110rpx;
  align-items: center;
}

.stat-item {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.stat-item:not(:last-child)::after {
  position: absolute;
  top: 12rpx;
  right: 0;
  width: 1rpx;
  height: 54rpx;
  background-color: #eeeeee;
  content: '';
}

.stat-value {
  color: #222222;
  font-size: 24rpx;
  line-height: 34rpx;
}

.stat-label {
  margin-top: 3rpx;
  color: #222222;
  font-size: 24rpx;
  line-height: 32rpx;
}

// 订单卡片
.order-card {
  height: 176rpx;
  margin-top: 24rpx;
  padding: 20rpx 24rpx 16rpx;
  box-sizing: border-box;
}

.decoration-card {
  margin-top: 22rpx;
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title,
.section-title {
  color: #252525;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 38rpx;
}

.all-link {
  display: flex;
  align-items: center;
  color: #999999;
  font-size: 24rpx;
}

.arrow {
  margin-left: 4rpx;
  font-size: 24rpx;
  line-height: 1;
}

.order-list {
  display: flex;
  margin-top: 16rpx;
}

.order-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  color: #222222;
  font-size: 24rpx;
  line-height: 32rpx;
}

.order-icon {
  width: 40rpx;
  height: 40rpx;
  margin-bottom: 6rpx;
}

// 常用功能卡片
.service-card {
  height: 184rpx;
  margin-top: 24rpx;
  padding: 24rpx;
  box-sizing: border-box;
}

.service-list {
  display: flex;
  margin-top: 22rpx;
}

.service-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  color: #252525;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 32rpx;
}

.service-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 8rpx;
}

// 安心保障卡片
.guarantee-card {
  margin-top: 24rpx;
  padding: 24rpx;
}

.guarantee-grid {
  display: grid;
  margin-top: 22rpx;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx 20rpx;
}

.guarantee-item {
  display: flex;
  height: 110rpx;
  padding: 16rpx 24rpx;
  box-sizing: border-box;
  align-items: center;
  border-radius: 14rpx;
}

.guarantee-red {
  background-color: #fff5f3;
}

.guarantee-orange {
  background-color: #fff8f2;
}

.guarantee-green {
  background-color: #f5faf4;
}

.guarantee-brown {
  background-color: #fdf8f1;
}

.guarantee-icon {
  width: 48rpx;
  height: 48rpx;
  margin-right: 22rpx;
  flex-shrink: 0;
}

.guarantee-title {
  color: #292929;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 36rpx;
}

.guarantee-description {
  color: #777777;
  font-size: 24rpx;
  line-height: 30rpx;
  white-space: nowrap;
}

// 页面底部安全间距
.bottom-space {
  height: calc(32rpx + env(safe-area-inset-bottom));
}
</style>

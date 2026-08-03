<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, reactive, ref } from 'vue'
import type { FeeTab, ServiceItem } from '@/types/space-renewal-detail'

const activeTab = ref<FeeTab>('人工+辅材')
const feeTabs: FeeTab[] = ['全部', '主材', '人工+辅材']
const planDetail = reactive({
  title: '厨房动线优化',
  description: '台面收纳一起升级，适合老旧厨房、台面拥挤',
  cover: '',
})

onLoad((options) => {
  if (options?.cover) planDetail.cover = decodeURIComponent(options.cover)
})
const items = ref<ServiceItem[]>([
  {
    id: 1,
    title: '家具遮蔽保护',
    description: '地面、门窗、家具、家电、柜体遮蔽保护',
    price: 10,
    quantity: 20,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/Rectangle 66.png',
    selected: true,
  },
  {
    id: 2,
    title: '阳台水电局改',
    description: '水管、电线、底盒等基础改造',
    price: 10,
    quantity: 20,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/Rectangle 66 (1).png',
    selected: true,
  },
  {
    id: 3,
    title: '开荒保洁',
    description: '地面、门窗、家具、家电、柜体深度清洁',
    price: 10,
    quantity: 20,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/Rectangle 66 (2).png',
    selected: true,
  },
  {
    id: 4,
    title: '防水涂刷',
    description: '墙地面基层处理与防水涂层施工',
    price: 10,
    quantity: 20,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/Rectangle 66 (3).png',
    selected: true,
  },
  {
    id: 5,
    title: '瓷砖拆除',
    description: '墙地面瓷砖拆除、余料放置与垃圾下楼',
    price: 10,
    quantity: 20,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/kongjianhuanxin/Rectangle 66 (4).png',
    selected: true,
  },
])

const selectedAmount = computed(() =>
  items.value
    .filter((item) => item.selected)
    .reduce((total, item) => total + item.price * item.quantity, 0),
)

const replaceItem = (item: ServiceItem) =>
  uni.showToast({ title: `替换${item.title}`, icon: 'none' })
const reserve = () => uni.showToast({ title: '预约申请已提交', icon: 'success' })
</script>

<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="scheme-card">
          <image
            v-if="planDetail.cover"
            class="scheme-cover"
            :src="planDetail.cover"
            mode="aspectFill"
          />
          <view v-else class="scheme-cover image-placeholder" />
          <view class="scheme-info">
            <view class="scheme-title">{{ planDetail.title }}</view>
            <view class="scheme-summary-row">
              <text class="scheme-description">{{ planDetail.description }}</text>
              <button class="reserve-small" @click="reserve">免费预约</button>
            </view>
          </view>
        </view>

        <view class="fee-card">
          <view class="section-title-row">
            <text class="section-title">方案费用</text>
            <text class="current-detail">当前显示明细</text>
          </view>
          <view class="fee-tabs">
            <button
              v-for="tab in feeTabs"
              :key="tab"
              class="fee-tab"
              :class="{ active: activeTab === tab }"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </view>
          <view class="fee-summary">
            <view class="fee-summary-title">人工+辅材清单为准</view>
            <view class="fee-summary-price"
              ><text class="money">¥10275</text
              ><text>拆除、水电、搬运、保洁和项目管理等可调整明细</text></view
            >
          </view>
        </view>

        <view class="guarantee-card">
          <view class="section-title-row">
            <text class="section-title">服务保障</text>
            <text class="guarantee-note">商品价格包含基础安装服务</text>
          </view>
          <view class="guarantee-list">
            <view class="guarantee-item">
              <wd-icon name="orders" custom-style="font-size: 34rpx; color: #ff7a45;" />
              <view>
                <view class="guarantee-title">报价透明</view>
                <view class="guarantee-desc">明细清晰可查</view>
              </view>
            </view>
            <view class="guarantee-item pink">
              <wd-icon name="shield-check" custom-style="font-size: 34rpx; color: #f04438;" />
              <view>
                <view class="guarantee-title">质保服务</view>
                <view class="guarantee-desc">30天售后无忧</view>
              </view>
            </view>
            <view class="guarantee-item gold">
              <wd-icon name="user-circle" custom-style="font-size: 34rpx; color: #b97725;" />
              <view>
                <view class="guarantee-title">专业上门</view>
                <view class="guarantee-desc">师傅认证服务</view>
              </view>
            </view>
          </view>
        </view>

        <view class="detail-heading">人工+辅材明细</view>
        <view class="service-list">
          <view v-for="item in items" :key="item.id" class="service-card">
            <image v-if="item.image" class="service-image" :src="item.image" mode="aspectFill" />
            <view v-else class="service-image image-placeholder" />
            <view class="service-content">
              <view class="service-title">{{ item.title }}</view>
              <view class="service-description">{{ item.description }}</view>
              <view class="service-price"
                ><text class="price-number">¥ {{ item.price }}</text
                ><text>/m² * {{ item.quantity }}</text></view
              >
            </view>
            <wd-checkbox
              v-model="item.selected"
              type="square"
              checked-color="#e83228"
              unchecked-color="#d9d9d9"
              custom-style="position: absolute; top: 20rpx; right: 20rpx;"
            />
            <button class="replace-button" @click="replaceItem(item)">替换</button>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-bar">
      <view class="total-wrap">
        <view class="total-label">总金额</view>
        <view class="total-price">¥ {{ (13333.5 + selectedAmount).toFixed(1) }}</view>
      </view>
      <button class="reserve-button" @click="reserve">免费预约</button>
    </view>
  </view>
</template>

<style lang="scss">
.detail-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  background: $jfx-pageBackGroundColor;
}

.detail-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}

.page-content {
  padding: 20rpx 24rpx 32rpx;
}

.scheme-card,
.fee-card,
.guarantee-card {
  @include jfx-shadow;
  background: #fff;
  border-radius: 18rpx;
}

.scheme-card {
  overflow: hidden;
}

.scheme-cover {
  display: block;
  width: 100%;
  height: 230rpx;
}

.image-placeholder {
  background: #f0efed;
}

.scheme-info {
  padding: 14rpx 20rpx 20rpx;
}

.scheme-title {
  color: $jfx-font-title;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 42rpx;
}

.scheme-summary-row {
  display: flex;
  margin-top: 4rpx;
  gap: 20rpx;
  align-items: flex-end;
}

.scheme-description {
  min-width: 0;
  flex: 1;
  color: $jfx-font-dec;
  font-size: 24rpx;
  line-height: 34rpx;
}

.reserve-small {
  height: 50rpx;
  margin: 0;
  padding: 0 20rpx;
  flex-shrink: 0;
  color: #fff;
  font-size: 22rpx;
  line-height: 50rpx;
  background: $jfx-brandColor;
  border-radius: 26rpx;
}

.fee-card {
  margin-top: 22rpx;
  padding: 22rpx 20rpx;
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  color: $jfx-font-title;
  font-size: 28rpx;
  font-weight: 600;
}

.current-detail {
  color: #f04438;
  font-size: 22rpx;
}

.fee-tabs {
  display: flex;
  margin-top: 16rpx;
  gap: 12rpx;
}

.fee-tab {
  height: 48rpx;
  margin: 0;
  padding: 0 16rpx;
  color: $jfx-font-title;
  font-size: 22rpx;
  line-height: 44rpx;
  background: #fff;
  border: 2rpx solid $jfx-border2;
  border-radius: 24rpx;
}

.fee-tab.active {
  color: #f04438;
  background: #fff4f2;
  border-color: #f04438;
}

.fee-summary {
  margin-top: 16rpx;
  padding: 14rpx 16rpx;
  background: #faf9f7;
  border-radius: 8rpx;
}

.fee-summary-title {
  color: $jfx-font-dec;
  font-size: 23rpx;
  font-weight: 600;
}

.fee-summary-price {
  margin-top: 6rpx;
  color: $jfx-font-dec;
  font-size: 21rpx;
  line-height: 30rpx;
}

.money {
  margin-right: 6rpx;
  color: #f04438;
  font-size: 25rpx;
}

.guarantee-card {
  margin-top: 22rpx;
  padding: 20rpx;
}

.guarantee-note {
  color: $jfx-font-dec;
  font-size: 21rpx;
}

.guarantee-list {
  display: flex;
  margin-top: 16rpx;
  gap: 10rpx;
}

.guarantee-item {
  display: flex;
  min-width: 0;
  padding: 12rpx 10rpx;
  flex: 1;
  gap: 10rpx;
  align-items: center;
  background: #fff7f0;
  border-radius: 14rpx;
}

.guarantee-item.pink {
  background: #fff4f3;
}

.guarantee-item.gold {
  background: #fff9ee;
}

.guarantee-title {
  color: $jfx-font-title;
  font-size: 22rpx;
  font-weight: 600;
  white-space: nowrap;
}

.guarantee-desc {
  margin-top: 2rpx;
  color: $jfx-font-dec;
  font-size: 18rpx;
  white-space: nowrap;
}

.detail-heading {
  margin: 26rpx 0 16rpx;
  color: $jfx-font-title;
  font-size: 29rpx;
  font-weight: 600;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.service-card {
  @include jfx-shadow;
  position: relative;
  display: flex;
  min-height: 150rpx;
  padding: 20rpx;
  background: #fff;
  border-radius: 16rpx;
}

.service-image {
  width: 170rpx;
  height: 138rpx;
  flex-shrink: 0;
  border-radius: 8rpx;
}

.service-content {
  min-width: 0;
  margin-left: 16rpx;
  padding-right: 42rpx;
  flex: 1;
}

.service-title {
  color: $jfx-font-title;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 38rpx;
}

.service-description {
  @include ellipsis(2);
  margin-top: 5rpx;
  color: $jfx-font-dec;
  font-size: 21rpx;
  line-height: 30rpx;
}

.service-price {
  margin-top: 10rpx;
  color: $jfx-font-dec;
  font-size: 21rpx;
}

.price-number {
  margin-right: 10rpx;
  color: #f04438;
  font-size: 27rpx;
}

.replace-button {
  position: absolute;
  right: 20rpx;
  bottom: 18rpx;
  height: 44rpx;
  margin: 0;
  padding: 0 16rpx;
  color: #f04438;
  font-size: 21rpx;
  line-height: 40rpx;
  background: #fff;
  border: 2rpx solid #f04438;
  border-radius: 22rpx;
}

.bottom-bar {
  display: flex;
  padding: 20rpx 40rpx calc(20rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-top: 2rpx solid #eeeae6;
}

.total-label {
  color: $jfx-font-dec2;
  font-size: 21rpx;
}

.total-price {
  margin-top: 5rpx;
  color: #e83228;
  font-size: 27rpx;
}

.reserve-button {
  width: 240rpx;
  height: 64rpx;
  margin: 0;
  color: #fff;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 64rpx;
  background: #e83228;
  border-radius: 16rpx;
}

button::after {
  border: 0;
}
</style>

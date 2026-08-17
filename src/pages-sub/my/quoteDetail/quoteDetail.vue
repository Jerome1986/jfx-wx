<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import type { QuoteCategory as Category, QuoteItem } from '@/types/quote-detail'

// 当前分类
const activeCategory = ref<Category>('main')
// 订单状态
const orderStatus = ref('pending')
// 页面模式
const pageMode = ref<'default' | 'readonly'>('default')
// 当前项是否已完成
const isCompleted = computed(() => orderStatus.value === 'completed')
// 订单是否正在服务中
const isServicing = computed(() => orderStatus.value === 'servicing')
// 页面是否为只读状态
const isReadOnly = computed(
  () => pageMode.value === 'readonly' || isCompleted.value || isServicing.value,
)
// 项目列表
const items = ref<QuoteItem[]>([
  {
    id: 1,
    category: 'main',
    title: '星辉水槽手工盆单槽',
    description: '进口不锈钢板川 纳米尺寸 大单盆使用方便',
    price: 380,
    unit: '套',
    quantity: 1,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
    selected: true,
  },
  {
    id: 2,
    category: 'main',
    title: '星辉水槽手工盆单槽',
    description: '进口不锈钢板川 纳米尺寸 大单盆使用方便',
    price: 380,
    unit: '套',
    quantity: 1,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
    selected: true,
  },
  {
    id: 3,
    category: 'main',
    title: '星辉水槽手工盆单槽',
    description: '进口不锈钢板川 纳米尺寸 大单盆使用方便',
    price: 380,
    unit: '套',
    quantity: 1,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
    selected: true,
  },
  {
    id: 4,
    category: 'main',
    title: '星辉水槽手工盆单槽',
    description: '进口不锈钢板川 纳米尺寸 大单盆使用方便',
    price: 380,
    unit: '套',
    quantity: 1,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
    selected: true,
  },
  {
    id: 5,
    category: 'main',
    title: '星辉水槽手工盆单槽',
    description: '进口不锈钢板川 纳米尺寸 大单盆使用方便',
    price: 380,
    unit: '套',
    quantity: 1,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-basin-faucet.png',
    selected: true,
  },
  {
    id: 6,
    category: 'labor',
    title: '厨房墙地砖拆除',
    description: '墙地砖拆除、垃圾装袋及搬运下楼',
    price: 68,
    unit: '㎡',
    quantity: 20,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-gooseneck-faucet.png',
    selected: true,
  },
  {
    id: 7,
    category: 'labor',
    title: '厨房水电局部改造',
    description: '水管、电线及底盒等基础改造施工',
    price: 180,
    unit: '项',
    quantity: 1,
    image:
      'https://objectstorageapi.hzh.sealos.run/pyaqb5pe-jfx/images/product/product-gooseneck-faucet.png',
    selected: true,
  },
])

// 可见项目列表
const visibleItems = computed(() =>
  activeCategory.value === 'all'
    ? items.value
    : items.value.filter((item) => item.category === activeCategory.value),
)
// 小计
const subtotal = computed(() =>
  items.value
    .filter((item) => item.selected)
    .reduce((total, item) => total + item.price * item.quantity, 0),
)
// 显示小计
const displayedSubtotal = computed(() => (isReadOnly.value ? 10275 : subtotal.value))

onLoad((query) => {
  orderStatus.value = query?.status || 'pending'
  pageMode.value = query?.mode === 'readonly' ? 'readonly' : 'default'
})

// 设置分类
const setCategory = (category: Category) => {
  activeCategory.value = category
}
// 切换当前处理项
const toggleItem = (item: QuoteItem) => {
  if (isReadOnly.value) return
  item.selected = !item.selected
}
// 替换当前处理项
const replaceItem = (item: QuoteItem) => {
  if (isReadOnly.value) return
  uni.navigateTo({
    url: `/pages-sub/my/quoteProductList/quoteProductList?quoteItemId=${item.id}`,
    success: (result) => {
      result.eventChannel.on(
        'selectProduct',
        (product: Pick<QuoteItem, 'title' | 'description' | 'price' | 'image'>) => {
          Object.assign(item, product, { selected: true })
        },
      )
    },
  })
}
// 保存报价单修改
const save = () => {
  if (isReadOnly.value) return
  uni.showToast({ title: '报价明细已保存', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 500)
}
</script>

<template>
  <view :class="['quote-page', { readonly: isReadOnly }]">
    <scroll-view class="quote-scroll" scroll-y :show-scrollbar="false">
      <view class="page-content">
        <view class="summary-card">
          <view class="summary-heading">
            <view class="summary-title">报价费用清单</view>
            <view
              :class="[
                'status-badge',
                { 'status-completed': isCompleted, 'status-servicing': isServicing },
              ]"
            >
              {{ isCompleted ? '已完成' : isServicing ? '服务中' : '待确认' }}
            </view>
          </view>
          <view class="summary-tip">
            {{ isReadOnly ? '报价明细仅供查看' : '可替换或删除单项后重新发送报价' }}
          </view>
          <view class="summary-total"
            >当前小计 <text>¥{{ displayedSubtotal }}</text></view
          >
        </view>

        <view class="tabs">
          <view :class="['tab', { active: activeCategory === 'all' }]" @click="setCategory('all')"
            >全部</view
          >
          <view :class="['tab', { active: activeCategory === 'main' }]" @click="setCategory('main')"
            >主材</view
          >
          <view
            :class="['tab', { active: activeCategory === 'labor' }]"
            @click="setCategory('labor')"
            >人工+辅材</view
          >
        </view>

        <view v-if="!isReadOnly" class="list-heading">
          <text>可调整的报价单项</text>
          <text>取消勾选或替换</text>
        </view>

        <view class="item-list">
          <view v-for="item in visibleItems" :key="item.id" class="quote-item">
            <image class="item-image" :src="item.image" mode="aspectFill" />
            <view class="item-main">
              <view class="item-title">{{ item.title }}</view>
              <view class="item-description">{{ item.description }}</view>
              <view class="item-price"
                ><text>¥{{ item.price }}</text
                >/{{ item.unit }}*{{ item.quantity }}</view
              >
            </view>
            <view v-if="!isReadOnly" class="item-actions">
              <view :class="['checkbox', { checked: item.selected }]" @click="toggleItem(item)">
                <text v-if="item.selected">✓</text>
              </view>
              <view class="replace" @click="replaceItem(item)">替换</view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="!isReadOnly" class="bottom-bar">
      <button class="save-button" @click="save">保存</button>
    </view>
  </view>
</template>

<style lang="scss">
.quote-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  color: #222;
  background: #f8f7f5;
}
.quote-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.page-content {
  padding: 24rpx 24rpx 40rpx;
}
.summary-card {
  padding: 24rpx;
  background: #fff;
  border-left: 2rpx solid #b67c55;
  border-radius: 18rpx;
  box-shadow: 0 7rpx 25rpx rgba(55, 42, 32, 0.04);
}
.summary-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.summary-title {
  font-size: 28rpx;
  font-weight: 600;
  line-height: 40rpx;
}
.status-badge {
  padding: 8rpx 20rpx;
  color: #e42b22;
  font-size: 22rpx;
  background: #fff0ef;
  border-radius: 28rpx;
}
.status-badge.status-completed {
  color: #777;
  background: #f1f0ee;
}
.status-badge.status-servicing {
  color: #55a35d;
  background: #eef8ef;
}
.summary-tip {
  margin-top: 12rpx;
  font-size: 23rpx;
  line-height: 34rpx;
}
.summary-total {
  margin-top: 16rpx;
  color: #777;
  font-size: 23rpx;
  line-height: 34rpx;
}
.summary-total text {
  margin-left: 8rpx;
  color: #e42b22;
  font-size: 25rpx;
}
.tabs {
  display: flex;
  margin-top: 24rpx;
  gap: 24rpx;
}
.tab {
  padding: 10rpx 20rpx;
  font-size: 24rpx;
  line-height: 32rpx;
  background: #fff;
  border: 2rpx solid transparent;
  border-radius: 8rpx;
}
.tab.active {
  color: #e42b22;
  border-color: #e42b22;
  background: #fff5f4;
}
.list-heading {
  display: flex;
  padding: 26rpx 2rpx 22rpx;
  justify-content: space-between;
  color: #aaa;
  font-size: 22rpx;
}
.readonly .item-list {
  margin-top: 30rpx;
}
.item-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.quote-item {
  display: flex;
  min-height: 120rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 18rpx;
}
.item-image {
  width: 104rpx;
  height: 104rpx;
  flex-shrink: 0;
  border-radius: 8rpx;
}
.item-main {
  min-width: 0;
  margin-left: 24rpx;
  flex: 1;
}
.item-title {
  overflow: hidden;
  font-size: 23rpx;
  font-weight: 600;
  line-height: 32rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-description {
  overflow: hidden;
  margin-top: 4rpx;
  color: #aaa;
  font-size: 21rpx;
  line-height: 30rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.item-price {
  margin-top: 8rpx;
  color: #777;
  font-size: 21rpx;
  line-height: 30rpx;
}
.item-price text {
  color: #e42b22;
  font-size: 24rpx;
}
.item-actions {
  display: flex;
  width: 72rpx;
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
}
.checkbox {
  display: flex;
  width: 28rpx;
  height: 28rpx;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  color: #fff;
  border: 2rpx solid #ccc;
  border-radius: 4rpx;
}
.checkbox.checked {
  background: #e42b22;
  border-color: #e42b22;
}
.checkbox text {
  font-size: 23rpx;
  line-height: 28rpx;
}
.replace {
  color: #e42b22;
  font-size: 22rpx;
  line-height: 30rpx;
}
.bottom-bar {
  padding: 22rpx 40rpx calc(22rpx + env(safe-area-inset-bottom));
  flex-shrink: 0;
  background: #fff;
  border-top: 2rpx solid #eeeae6;
}
.save-button {
  width: 100%;
  height: 72rpx;
  margin: 0;
  color: #fff;
  font-size: 26rpx;
  line-height: 72rpx;
  background: #e42b22;
  border-radius: 16rpx;
}
.save-button::after {
  border: 0;
}
</style>

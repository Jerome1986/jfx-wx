<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRenovationBusinessStore } from '@/stores/modules/renovation-business'
import type { ProjectQuoteLine } from '@/types/project-quote'
import type { RenewalReplacementCandidate } from '@/types/renewal-replacement'
import {
  applyReplacement,
  hasDuplicateReplacement,
  lineCents,
  moneyText,
} from '@/utils/project-quote'
import ProjectQuoteSummary from '@/components/project/ProjectQuoteSummary.vue'
import ProjectQuoteLineCard from '@/components/project/ProjectQuoteLineCard.vue'
import ProjectQuoteLineEditor from '@/components/project/ProjectQuoteLineEditor.vue'

type FeeTab = '全部' | '主材' | '人工+辅材'
const store = useRenovationBusinessStore()
const id = ref(0)
const target = ref<'draft' | 'project'>('draft')
const activeTab = ref<FeeTab>('全部')
const tabs: FeeTab[] = ['全部', '主材', '人工+辅材']
const project = computed(() =>
  target.value === 'project' ? store.getProject(id.value) : undefined,
)
const draft = computed(() => (target.value === 'draft' ? store.projectDrafts[id.value] : undefined))
const quote = computed(() => project.value?.quote || draft.value?.quote)
const valid = computed(() => !!project.value || !!draft.value)
const editable = computed(
  () =>
    target.value === 'draft' &&
    !!draft.value &&
    store.projectSources[id.value]?.status === 'COMPLETED',
)
const groupedItems = computed(() =>
  [...(quote.value?.items || [])].sort(
    (a, b) => (a.category === 'product' ? 0 : 1) - (b.category === 'product' ? 0 : 1),
  ),
)
const visibleItems = computed(() => {
  if (activeTab.value === '全部') return groupedItems.value
  if (activeTab.value === '主材')
    return groupedItems.value.filter((item) => item.category === 'product')
  return groupedItems.value.filter((item) => item.category === 'service')
})
const visibleAmount = computed(() =>
  visibleItems.value.reduce(
    (total, item) => total + (Number.isFinite(lineCents(item)) ? lineCents(item) : 0),
    0,
  ),
)
const canReplace = (item: ProjectQuoteLine) =>
  editable.value && !!item.businessCategory && !!item.sourceItemId
const replaceItem = (item: ProjectQuoteLine) => {
  if (!canReplace(item)) {
    uni.showToast({
      title: editable.value ? '该历史明细缺少分类，暂不可替换' : '项目报价已确认，仅可查看',
      icon: 'none',
    })
    return
  }
  const type = item.category === 'product' ? 'PRODUCT' : 'SERVICE'
  const query = [
    `type=${type}`,
    `category=${encodeURIComponent(item.businessCategory!)}`,
    `itemId=${item.sourceItemId}`,
    `unit=${encodeURIComponent(item.unit)}`,
    `quantity=${item.quantity}`,
  ].join('&')
  uni.navigateTo({
    url: `/pages/renewalReplacement/renewalReplacement?${query}`,
    success: (result) => {
      result.eventChannel.on('selectReplacement', (candidate: RenewalReplacementCandidate) => {
        if (!editable.value || !draft.value || !quote.value) {
          result.eventChannel.emit('replacementResult', {
            accepted: false,
            message: '建项草稿已失效',
          })
          return
        }
        if (hasDuplicateReplacement(quote.value.items, item, candidate)) {
          result.eventChannel.emit('replacementResult', {
            accepted: false,
            message: '该项目已在方案中，请选择其他项目',
          })
          return
        }
        applyReplacement(item, candidate)
        result.eventChannel.emit('replacementResult', { accepted: true })
      })
    },
  })
}
// 删除不再需要的报价明细。
const removeItem = (item: ProjectQuoteLine) => {
  if (!editable.value || !quote.value) return
  const index = quote.value.items.findIndex(({ id }) => id === item.id)
  if (index >= 0) quote.value.items.splice(index, 1)
}
// 由父页面更新报价明细，避免子组件直接修改 prop。
const changeQuantity = (item: ProjectQuoteLine, quantity: string) => {
  if (!editable.value) return
  item.quantity = quantity
}
onLoad((query) => {
  id.value = Number(query?.id) || 0
  target.value = query?.target === 'project' ? 'project' : 'draft'
})
</script>
<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view v-if="valid" class="page-content">
        <view class="fee-card">
          <view class="section-title-row"
            ><text class="section-title">方案费用</text
            ><text class="current-detail">{{
              editable ? '可调整数量、替换或删除' : '项目报价已确认'
            }}</text></view
          >
          <view class="fee-tabs"
            ><view
              v-for="tab in tabs"
              :key="tab"
              class="fee-tab"
              :class="{ active: activeTab === tab }"
              @click="activeTab = tab"
              >{{ tab }}</view
            ></view
          >
          <view class="fee-summary"
            ><view
              ><view class="fee-summary-title"
                >{{ activeTab === '全部' ? '全部方案' : activeTab }}清单</view
              ><view class="fee-summary-count">共 {{ visibleItems.length }} 项</view></view
            ><view class="fee-summary-price"
              ><text class="money">¥{{ moneyText(visibleAmount) }}</text
              ><text>{{ editable ? '替换后自动重新计算' : '方案明细只读' }}</text></view
            ></view
          >
          <ProjectQuoteSummary v-if="quote" :quote="quote" />
          <view v-else class="legacy-price"
            >历史报价 ¥{{ Number(project?.quotedAmount || 0).toFixed(2) }}</view
          >
        </view>
        <view class="detail-heading">{{ activeTab === '全部' ? '全部方案' : activeTab }}明细</view>
        <view class="service-list"
          ><template v-if="editable"
            ><ProjectQuoteLineEditor
              v-for="item in visibleItems"
              :key="item.id"
              :item="item"
              :replaceable="canReplace(item)"
              @quantity-change="changeQuantity(item, $event)"
              @replace="replaceItem(item)"
              @remove="removeItem(item)" /></template
          ><template v-else
            ><ProjectQuoteLineCard
              v-for="item in visibleItems"
              :key="item.id"
              :item="item"
              :replaceable="canReplace(item)"
              @replace="replaceItem(item)" /></template
          ><view v-if="!visibleItems.length" class="empty-items">该分类暂无明细</view></view
        >
      </view>
      <view v-else class="page-state">项目或建项草稿不存在，请返回重新进入</view>
    </scroll-view>
  </view>
</template>
<style scoped lang="scss">
.detail-page {
  display: flex;
  height: 100%;
  flex-direction: column;
  background: #f8f7f5;
}
.detail-scroll {
  height: 0;
  min-height: 0;
  flex: 1;
}
.page-content {
  padding: 20rpx 24rpx calc(32rpx + env(safe-area-inset-bottom));
}
.fee-card {
  padding: 26rpx;
  background: #fff;
  border-radius: 18rpx;
}
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-title {
  color: #333;
  font-size: 30rpx;
}
.current-detail {
  color: #999;
  font-size: 22rpx;
  font-weight: 400;
}
.fee-tabs {
  display: flex;
  padding: 7rpx;
  margin-top: 24rpx;
  background: #f0efed;
  border-radius: 12rpx;
}
.fee-tab {
  display: flex;
  height: 60rpx;
  flex: 1;
  align-items: center;
  justify-content: center;
  color: #777;
  border-radius: 9rpx;
  font-size: 23rpx;
}
.fee-tab.active {
  color: #d92d20;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(40, 30, 25, 0.06);
}
.fee-summary {
  display: flex;
  padding: 24rpx 0 18rpx;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #eee;
}
.fee-summary-title {
  color: #333;
  font-size: 27rpx;
}
.fee-summary-count {
  margin-top: 7rpx;
  color: #999;
  font-size: 21rpx;
  font-weight: 400;
}
.fee-summary-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  color: #999;
  font-size: 20rpx;
  font-weight: 400;
}
.money {
  margin-bottom: 5rpx;
  color: #e83228;
  font-size: 32rpx;
  font-weight: 600;
}
.legacy-price {
  margin-top: 22rpx;
  color: #d92d20;
  font-size: 30rpx;
}
.detail-heading {
  padding: 28rpx 4rpx 16rpx;
  color: #333;
  font-size: 29rpx;
}
.service-list {
  min-height: 200rpx;
}
.empty-items,
.page-state {
  padding: 100rpx 24rpx;
  color: #999;
  font-size: 24rpx;
  text-align: center;
}
</style>

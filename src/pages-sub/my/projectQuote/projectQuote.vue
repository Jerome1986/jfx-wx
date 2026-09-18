<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRenovationBusinessStore } from '@/stores/modules/renovation-business'
import type { ProjectQuoteLine, ProjectQuote } from '@/types/project-quote'
import { getEmployeeProjectDetailApi, updateEmployeeProjectQuoteApi } from '@/api/project'
import { normalizeProject } from '@/utils/project'
import type { RenewalReplacementCandidate } from '@/types/renewal-replacement'
import {
  applyReplacement,
  hasDuplicateReplacement,
  moneyText,
  buildQuoteUpdate,
  copyQuoteData,
  newQuoteLineId,
  quoteTotals,
} from '@/utils/project-quote'
import ProjectQuoteSummary from '@/components/project/ProjectQuoteSummary.vue'
import ProjectQuoteLineCard from '@/components/project/ProjectQuoteLineCard.vue'
import ProjectQuoteLineEditor from '@/components/project/ProjectQuoteLineEditor.vue'

type FeeTab = '全部' | '主材' | '人工+辅材'
const store = useRenovationBusinessStore()
const id = ref(0)
const target = ref<'draft' | 'project' | 'edit'>('draft')
const editQuote = ref<ProjectQuote>()
const planId = ref(0)
const planName = ref('')
const quoteVersion = ref(0)
const quoteRemark = ref('')
const loading = ref(false)
const loadFailed = ref(false)
const submitting = ref(false)
const conflicted = ref(false)
const saved = ref(false)

// 仅显式进入或刷新编辑时读取版本，保存前不自动换成最新版本。
const loadEditor = async () => {
  if (loading.value || submitting.value) return
  loading.value = true
  loadFailed.value = false
  try {
    if (!Number.isSafeInteger(id.value) || id.value <= 0) throw new Error('项目ID无效')
    const { data } = await getEmployeeProjectDetailApi(id.value)
    if (data.id !== id.value || data.status !== 'PENDING_CONFIRM')
      throw new Error('当前项目状态不允许修改报价')
    if (!Number.isSafeInteger(data.quoteVersion) || !data.quoteVersion || data.quoteVersion < 1)
      throw new Error('项目缺少报价版本，请联系管理员')
    const detail = normalizeProject(data)
    editQuote.value = copyQuoteData(detail.quote || { items: [], discount: '0' })
    planId.value = detail.planId || 0
    planName.value = detail.planName || ''
    quoteVersion.value = data.quoteVersion
    quoteRemark.value = ''
    conflicted.value = false
  } catch (error) {
    loadFailed.value = true
    if (error instanceof Error) uni.showToast({ title: error.message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 冲突后由员工主动确认丢弃草稿，再读取最新项目。
const refreshEditor = () =>
  uni.showModal({
    title: '重新加载报价',
    content: '将放弃当前未保存的修改，并加载最新报价。',
    confirmColor: '#d92d20',
    success: (result) => {
      if (result.confirm) loadEditor()
    },
  })

// 保存后返回详情，由详情页重新请求服务端数据。
const returnToDetail = () =>
  uni.navigateBack({
    fail: () =>
      uni.redirectTo({
        url: `/pages-sub/my/employeeRenovationOrderDetail/employeeRenovationOrderDetail?id=${id.value}`,
      }),
  })
const saveQuote = async () => {
  if (!editable.value || !editQuote.value) return
  submitting.value = true
  try {
    const payload = buildQuoteUpdate(
      planId.value,
      quoteVersion.value,
      quoteRemark.value,
      editQuote.value.items,
    )
    const confirmed = await new Promise<boolean>((resolve) =>
      uni.showModal({
        title: '修改报价',
        content: '确定要修改吗？',
        confirmText: '确定',
        cancelText: '取消',
        confirmColor: '#d92d20',
        success: (result) => resolve(result.confirm),
        fail: () => resolve(false),
      }),
    )
    if (!confirmed) return
    const result = await updateEmployeeProjectQuoteApi(id.value, payload)
    if (result.code !== 200) throw { statusCode: result.code }
    saved.value = true
    uni.showToast({ title: '报价已更新', icon: 'success' })
    returnToDetail()
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 409) {
      conflicted.value = true
      uni.showModal({
        title: '报价已变化',
        content: '项目状态或报价已变化，请刷新后重新编辑。当前输入暂时保留。',
        showCancel: false,
        confirmColor: '#d92d20',
      })
    } else if (error instanceof Error) {
      uni.showToast({ title: error.message, icon: 'none' })
    }
  } finally {
    submitting.value = false
  }
}

// 从标准方案目录添加单条明细，保持项目原方案不变。
const addItem = () => {
  if (!editable.value) return
  uni.navigateTo({
    url: `/pages-sub/my/projectPlanSelect/projectPlanSelect?mode=pickItem&planId=${planId.value}`,
    events: {
      selectQuoteItem: (item: ProjectQuoteLine) => {
        if (!editable.value || !editQuote.value) return
        editQuote.value.items.push({ ...copyQuoteData(item), id: newQuoteLineId() })
      },
    },
  })
}
const activeTab = ref<FeeTab>('全部')
const tabs: FeeTab[] = ['全部', '主材', '人工+辅材']
const project = computed(() =>
  target.value === 'project' ? store.getProject(id.value) : undefined,
)
const draft = computed(() => (target.value === 'draft' ? store.projectDrafts[id.value] : undefined))
const quote = computed(() =>
  target.value === 'edit' ? editQuote.value : project.value?.quote || draft.value?.quote,
)
const valid = computed(() =>
  target.value === 'edit'
    ? !!editQuote.value && !loadFailed.value && !loading.value
    : !!project.value || !!draft.value,
)
const editable = computed(() =>
  target.value === 'edit'
    ? !!editQuote.value &&
      !loading.value &&
      !loadFailed.value &&
      !submitting.value &&
      !conflicted.value &&
      !saved.value
    : target.value === 'draft' &&
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
const visibleAmount = computed(
  () => quoteTotals({ items: visibleItems.value, discount: '0' }).total,
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
        if (!editable.value || !quote.value) {
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
  if (query?.target === 'edit') {
    target.value = 'edit'
    loadEditor()
  }
})
</script>
<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view v-if="valid" class="page-content">
        <view class="fee-card">
          <view v-if="target === 'edit'">{{ planName || '关联方案未提供' }}</view>
          <view v-if="target === 'project' && project">
            {{ project.planName }}
          </view>
          <view class="section-title-row"
            ><text class="section-title">方案费用</text
            ><text class="current-detail">{{
              editable ? '可调整数量、替换或删除' : '报价明细只读'
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
              ><text class="money"
                >¥{{
                  target === 'project'
                    ? Number(project?.quotedAmount || 0).toFixed(2)
                    : moneyText(visibleAmount)
                }}</text
              ><text>{{ target === 'project' ? '项目总报价' : '编辑预览金额' }}</text></view
            ></view
          >
          <ProjectQuoteSummary
            v-if="quote"
            :quote="quote"
            :amount="target === 'project' ? project?.quotedAmount : undefined"
          />
          <view v-else class="legacy-price"
            >历史报价 ¥{{ Number(project?.quotedAmount || 0).toFixed(2) }}</view
          >
        </view>
        <view class="detail-toolbar">
          <view class="detail-heading"
            >{{ activeTab === '全部' ? '全部方案' : activeTab }}明细</view
          >
          <button v-if="target === 'edit'" class="add-item" :disabled="!editable" @click="addItem">
            添加明细
          </button>
        </view>
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
        <view v-if="target === 'edit'" class="fee-card edit-controls">
          <view>修改说明</view>
          <textarea
            v-model="quoteRemark"
            :disabled="!editable"
            :maxlength="500"
            placeholder="本次修改说明（选填，最多500字）"
          />
          <view v-if="conflicted">报价或项目状态已变化，请刷新后重新编辑。</view>
          <button v-if="conflicted" @click="refreshEditor">刷新后重新编辑</button>
          <view>调整金额仅供预览，保存后以项目报价清单为准。</view>
        </view>
      </view>
      <view v-else-if="target === 'edit'" class="page-state">
        {{ loading ? '正在加载报价…' : '报价加载失败或项目已不可编辑' }}
        <button v-if="!loading" @click="loadEditor">重新加载</button>
      </view>
      <view v-else class="page-state">项目或建项草稿不存在，请返回重新进入</view>
    </scroll-view>
    <view v-if="target === 'edit' && valid" class="save-bar">
      <button v-if="saved" class="save-quote" @click="returnToDetail">已保存，返回项目详情</button>
      <button
        v-else
        class="save-quote"
        :disabled="!editable"
        :loading="submitting"
        @click="saveQuote"
      >
        {{ submitting ? '提交中' : '保存明细调整' }}
      </button>
    </view>
  </view>
</template>
<style scoped lang="scss">
.edit-controls {
  margin-bottom: 24rpx;
  font-size: 25rpx;
  line-height: 1.8;
}
.edit-controls button {
  margin: 18rpx 0;
  font-size: 26rpx;
}
.edit-controls textarea {
  box-sizing: border-box;
  width: 100%;
  height: 160rpx;
  padding: 18rpx;
  background: #f8f7f5;
}
.save-quote {
  color: white;
  background: #d92d20;
}
.save-quote[disabled] {
  opacity: 0.5;
}
.save-bar {
  flex-shrink: 0;
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #eee;
}
.save-quote {
  font-size: 28rpx;
  border-radius: 14rpx;
}
.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.add-item {
  margin: 0;
  padding: 0 22rpx;
  color: #d92d20;
  background: #fff0ef;
  font-size: 24rpx;
  border-radius: 24rpx;
}
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

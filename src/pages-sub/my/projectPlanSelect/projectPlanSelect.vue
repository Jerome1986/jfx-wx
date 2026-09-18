<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRenovationBusinessStore } from '@/stores/modules/renovation-business'
import { getRenewalPlanListApi } from '@/api/renewal-plan'
import type { ProjectPlanCandidate, ProjectQuoteLine } from '@/types/project-quote'
import ProjectPlanCard from '@/components/project/ProjectPlanCard.vue'
// 装修业务 Store，用于更新建项草稿。
const store = useRenovationBusinessStore()
// 当前建项关联的预约 ID。
const id = ref(0)
const mode = ref<'draft' | 'pickItem'>('draft')
const selectedPlanId = ref(0)
let eventChannel: UniApp.EventChannel | undefined
// 方案搜索关键词。
const keyword = ref('')
// 当前展开明细的方案 ID。
const expanded = ref<number>()
// 方案选择提交状态。
const selecting = ref(false)
// 方案列表加载状态。
const loading = ref(false)
// 方案列表加载失败状态。
const loadFailed = ref(false)
// 接口返回并转换后的装修方案列表。
const projectPlans = ref<ProjectPlanCandidate[]>([])
// 当前建项草稿是否仍然有效。
const valid = computed(() =>
  mode.value !== 'draft'
    ? !!eventChannel
    : !!store.projectDrafts[id.value] && store.projectSources[id.value]?.status === 'COMPLETED',
)
// 草稿当前关联的方案 ID。
const currentPlanId = computed(() =>
  mode.value === 'draft' ? store.projectDrafts[id.value]?.planId : selectedPlanId.value,
)
// 根据搜索词过滤可见方案。
const plans = computed(() =>
  projectPlans.value.filter((plan) =>
    `${plan.name}${plan.description}`.includes(keyword.value.trim()),
  ),
)
onLoad((query) => {
  // 1. 读取建项预约 ID。
  id.value = Number(query?.appointmentId) || 0
  mode.value = query?.mode === 'pickItem' ? 'pickItem' : 'draft'
  selectedPlanId.value = Number(query?.planId) || 0
  const pages = getCurrentPages()
  eventChannel = (
    pages[pages.length - 1] as unknown as { getOpenerEventChannel?: () => UniApp.EventChannel }
  )?.getOpenerEventChannel?.()
  // 2. 加载后端装修方案。
  loadPlans()
})

// 加载已发布方案并转换为建项报价结构。
const loadPlans = async () => {
  // 1. 重置本次加载状态。
  loading.value = true
  loadFailed.value = false
  try {
    // 2. 请求后端装修方案列表。
    const { data } = await getRenewalPlanListApi()
    // 3. 过滤已发布方案并转换方案与报价明细字段。
    projectPlans.value = data
      .filter((plan) => plan.status === 'PUBLISHED')
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.summary,
        cover: plan.cover,
        items: plan.items.map((item) => ({
          id: `plan-${plan.id}-${item.id}`,
          source: 'api',
          sourceItemId: item.id,
          productId: item.productId,
          category: item.productId === null ? 'service' : 'product',
          businessCategory: item.category,
          name: item.name,
          description: item.description || '',
          image: item.image || item.product?.mainImage || '',
          unit: item.unit,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      }))
  } catch (error) {
    // 4. 记录异常并展示重新加载入口。
    console.error('获取装修方案失败：', error)
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}
// 返回建项页，失败时回到“我的”页面。
const back = () => uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/my/my' }) })
// 选择方案并用方案明细覆盖当前报价草稿。
const select = async (plan: ProjectPlanCandidate) => {
  // 1. 拦截无效草稿、重复选择和重复点击。
  if (mode.value !== 'draft' || !valid.value || selecting.value || currentPlanId.value === plan.id)
    return
  selecting.value = true
  // 2. 已有明细时先确认是否覆盖当前报价。
  if (store.projectDrafts[id.value]?.quote.items.length) {
    const confirmed = await new Promise<boolean>((resolve) =>
      uni.showModal({
        title: '更换方案',
        content: '当前报价明细将被替换，优惠将清零。客户和项目资料保留。',
        confirmText: '确认替换',
        confirmColor: '#d92d20',
        success: (result) => resolve(result.confirm),
        fail: () => resolve(false),
      }),
    )
    if (!confirmed) {
      selecting.value = false
      return
    }
  }
  // 3. 写入所选方案及报价明细，成功后返回建项页。
  if (store.selectProjectPlan(id.value, plan)) back()
  // 4. 恢复方案选择状态。
  selecting.value = false
}

// 添加明细仅允许选用标准方案中的既有项目。
const selectItem = (item: ProjectQuoteLine) => {
  if (!valid.value || selecting.value) return
  selecting.value = true
  eventChannel?.emit('selectQuoteItem', item)
  back()
}
</script>
<template>
  <view class="workflow">
    <view class="search-area"
      ><view class="search-box"
        ><text class="search-icon">⌕</text
        ><input v-model="keyword" class="search-input" placeholder="搜索方案名称或内容" /></view
    ></view>
    <view v-if="valid" class="list-heading"
      ><text>装修方案</text><text>共 {{ plans.length }} 个方案</text></view
    >
    <scroll-view class="workflow-scroll" scroll-y :show-scrollbar="false"
      ><view class="plan-list">
        <template v-if="valid">
          <template v-if="mode === 'pickItem'">
            <view v-for="plan in plans" :key="plan.id" class="standard-items">
              <view>{{ plan.name }}</view>
              <button
                v-for="item in plan.items"
                :key="item.id"
                :disabled="selecting"
                @click="selectItem(item)"
              >
                {{ item.name }} · ¥{{ item.unitPrice }}/{{ item.unit }} · 添加
              </button>
            </view>
          </template>
          <template v-else
            ><ProjectPlanCard
              v-for="plan in plans"
              :key="plan.id"
              :plan="plan"
              :active="currentPlanId === plan.id"
              :expanded="expanded === plan.id"
              :selecting="selecting"
              @toggle="expanded = expanded === plan.id ? undefined : plan.id"
              @select="select(plan)" /></template
          ><view v-if="loading" class="empty">正在加载装修方案...</view
          ><view v-else-if="loadFailed" class="empty"
            ><view>装修方案加载失败</view
            ><button class="retry" @click="loadPlans">重新加载</button></view
          ><view v-else-if="!plans.length" class="empty">没有找到相关装修方案</view></template
        >
        <view v-else class="empty">建项草稿不存在或已失效</view>
      </view></scroll-view
    >
  </view>
</template>
<style scoped lang="scss">
@use '@/styles/project-workflow.scss';
.standard-items {
  margin-bottom: 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 18rpx;
  font-size: 28rpx;
}
.standard-items button {
  margin-top: 16rpx;
  color: #d92d20;
  font-size: 24rpx;
}
.search-area {
  flex-shrink: 0;
  padding: 20rpx 24rpx 12rpx;
}
.search-box {
  display: flex;
  height: 68rpx;
  padding: 0 22rpx;
  align-items: center;
  gap: 12rpx;
  background: #fff;
  border: 1rpx solid #ece9e6;
  border-radius: 34rpx;
}
.search-icon {
  color: #aaa;
  font-size: 31rpx;
  font-weight: 400;
}
.search-input {
  height: 66rpx;
  min-width: 0;
  padding: 0;
  flex: 1;
  background: transparent;
  font-size: 25rpx;
  line-height: 66rpx;
}
.list-heading {
  display: flex;
  padding: 15rpx 28rpx;
  align-items: center;
  justify-content: space-between;
  color: #333;
  font-size: 28rpx;
}
.list-heading text:last-child {
  color: #999;
  font-size: 23rpx;
  font-weight: 400;
}
.plan-list {
  padding: 0 24rpx 32rpx;
}
.retry {
  width: auto;
  height: 54rpx;
  margin: 20rpx auto 0;
  padding: 0 24rpx;
  color: #d92d20;
  font-size: 22rpx;
  line-height: 54rpx;
  background: #fff1ef;
  border-radius: 27rpx;
}
.retry::after {
  border: 0;
}
</style>

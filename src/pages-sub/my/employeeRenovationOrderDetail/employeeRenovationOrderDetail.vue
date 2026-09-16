<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRenovationBusinessStore } from '@/stores/modules/renovation-business'
import { completeEmployeeProjectApi, getEmployeeProjectDetailApi } from '@/api/project'
import ProjectQuoteSummary from '@/components/project/ProjectQuoteSummary.vue'
import EmployeeProjectStatus from '@/components/project/EmployeeProjectStatus.vue'
import { normalizeProject } from '@/utils/project'

// 当前路由中的后端项目 ID。
const id = ref(0)
// 项目详情加载状态。
const loading = ref(false)
// 是否已经完成首次详情加载，避免页面初始化时误显示项目不存在。
const loaded = ref(false)
// 项目详情加载失败状态。
const loadFailed = ref(false)
// 完成项目请求提交状态。
const completing = ref(false)
// 装修业务 Store，暂用于状态操作和跨页面共享详情。
const store = useRenovationBusinessStore()
// 当前员工装修项目详情。
const project = computed(() => store.getProject(id.value))
// 根据路由 ID 加载员工项目详情。
const loadProject = async () => {
  if (loading.value) return
  // 1. 校验项目 ID，避免发出无效请求。
  if (!Number.isSafeInteger(id.value) || id.value <= 0) {
    loadFailed.value = true
    loaded.value = true
    return
  }
  // 2. 重置加载状态并请求详情接口。
  loading.value = true
  loadFailed.value = false
  try {
    const { data } = await getEmployeeProjectDetailApi(id.value)
    console.log('项目详情', data)

    if (data?.id !== id.value) throw new Error('项目详情 ID 不匹配')

    // 3. 转换并缓存接口详情供页面展示。
    store.cacheCreatedProject(normalizeProject(data))
  } catch (error) {
    // 4. 请求失败时展示重试入口。
    console.error('获取员工项目详情失败：', error)
    loadFailed.value = true
  } finally {
    loading.value = false
    loaded.value = true
  }
}

// 将服务中的项目标记为完成。
const completeProject = async () => {
  if (project.value?.status !== 'IN_SERVICE' || completing.value) return
  const confirmed = await new Promise<boolean>((resolve) =>
    uni.showModal({
      title: '完成项目',
      content: '确认该项目已完成全部服务？',
      confirmText: '确认完成',
      confirmColor: '#d92d20',
      success: (result) => resolve(result.confirm),
      fail: () => resolve(false),
    }),
  )
  if (!confirmed) return
  completing.value = true
  try {
    await completeEmployeeProjectApi(id.value)
    store.completeProject(id.value)
    uni.showToast({ title: '项目已完成', icon: 'success' })
  } catch (error) {
    console.error('完成项目失败：', error)
    uni.showToast({ title: '操作失败，请重试', icon: 'none' })
  } finally {
    completing.value = false
  }
}

// 打开当前项目的只读报价明细。
const openQuote = () =>
  uni.navigateTo({ url: `/pages-sub/my/projectQuote/projectQuote?target=project&id=${id.value}` })

onLoad((query) => {
  // 1. 读取后端项目 ID。
  id.value = Number(query?.id) || 0
  // 2. 请求员工项目详情。
  loadProject()
})
</script>

<template>
  <scroll-view class="project-scroll" scroll-y :show-scrollbar="false">
    <view class="page">
      <view v-if="loading || !loaded" class="empty">正在加载项目详情...</view>
      <view v-else-if="loadFailed" class="empty">
        <view>项目详情加载失败</view>
        <button class="retry-button" @click="loadProject">重新加载</button>
      </view>
      <view v-else-if="project">
        <view class="card hero">
          <view class="hero-main">
            <view class="title">{{ project.name }}</view>
            <view class="sub">{{ project.projectNo }}</view>
          </view>
          <EmployeeProjectStatus :status="project.status" />
        </view>

        <view class="card detail-card">
          <view class="section">客户与项目</view>
          <view class="detail-list">
            <view class="row">
              <text>客户</text>
              <text>{{ project.customerName }} {{ project.mobile }}</text>
            </view>
            <view class="row">
              <text>服务地址</text>
              <text>{{ project.serviceAddress }}</text>
            </view>
            <view class="row">
              <text>装修范围</text>
              <text>{{ project.renovationScope || '未填写' }}</text>
            </view>
            <view class="row">
              <text>负责员工</text>
              <text>{{ project.employeeName || '未填写' }}</text>
            </view>
            <view class="row">
              <text>关联方案</text>
              <text>{{ project.planName || '未关联' }}</text>
            </view>
            <view v-if="project.remark" class="row">
              <text>项目备注</text>
              <text>{{ project.remark }}</text>
            </view>
          </view>
        </view>

        <view class="card quote-card">
          <view class="section-header">
            <view class="section">项目报价</view>
            <button class="detail-button" hover-class="button-hover" @click="openQuote">
              查看明细
            </button>
          </view>
          <ProjectQuoteSummary v-if="project.quote" :quote="project.quote" />
          <view v-else class="legacy-quote">
            <text>历史报价</text>
            <text class="legacy-price">¥{{ Number(project.quotedAmount).toFixed(2) }}</text>
            <text class="legacy-tip">暂无报价明细</text>
          </view>
        </view>

        <view v-if="project.status === 'PENDING_CONFIRM'" class="status-note">
          报价已提交，等待客户确认后开始服务
        </view>

        <view v-if="project.status === 'IN_SERVICE'" class="action-wrap">
          <button
            class="primary"
            hover-class="primary-hover"
            :disabled="completing"
            @click="completeProject"
          >
            {{ completing ? '提交中...' : '完成项目' }}
          </button>
        </view>
      </view>
      <view v-else class="empty">项目不存在</view>
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
.project-scroll {
  height: 100%;
  background: #f8f7f5;
}

.page {
  box-sizing: border-box;
  min-height: 100%;
  padding: 22rpx 24rpx calc(30rpx + env(safe-area-inset-bottom));
}

.card {
  margin-bottom: 18rpx;
  padding: 28rpx;
  background: #fff;
  border: 1rpx solid rgba(31, 26, 23, 0.04);
  border-radius: 20rpx;
  box-shadow: 0 8rpx 28rpx rgba(45, 36, 31, 0.035);
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  padding-top: 30rpx;
  padding-bottom: 30rpx;
}

.hero-main {
  min-width: 0;
}

.title {
  overflow: hidden;
  color: #24201e;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub {
  margin-top: 8rpx;
  color: #a39b96;
  font-size: 21rpx;
  line-height: 1.4;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section {
  color: #2a2522;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 1.4;
}

.detail-list {
  margin-top: 10rpx;
}

.row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 36rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f2efed;
  color: #8b837e;
  font-size: 23rpx;
  line-height: 1.55;
}

.row:last-child {
  padding-bottom: 2rpx;
  border-bottom: 0;
}

.row text:first-child {
  flex-shrink: 0;
}

.row text:last-child {
  max-width: 70%;
  color: #38322f;
  text-align: right;
  overflow-wrap: anywhere;
}

.detail-button {
  width: auto;
  height: 50rpx;
  margin: 0;
  padding: 0 20rpx;
  color: #c83b31;
  font-size: 21rpx;
  line-height: 50rpx;
  background: #fff5f3;
  border-radius: 999rpx;
}

.detail-button::after,
.primary::after {
  border: 0;
}

.button-hover {
  opacity: 0.72;
}

.quote-card :deep(.quote-summary) {
  margin-top: 20rpx;
}

.legacy-quote {
  display: flex;
  align-items: baseline;
  margin-top: 22rpx;
  color: #8b837e;
  font-size: 22rpx;
}

.legacy-price {
  margin-left: auto;
  color: #d23b30;
  font-size: 28rpx;
  font-weight: 600;
}

.legacy-tip {
  margin-left: 12rpx;
  color: #aaa39f;
  font-size: 20rpx;
}

.action-wrap {
  padding: 12rpx 0 6rpx;
}

.status-note {
  margin: 6rpx 4rpx 18rpx;
  color: #9b6c21;
  font-size: 22rpx;
  line-height: 1.5;
  text-align: center;
}

.primary {
  width: 320rpx;
  height: 68rpx;
  margin: 0 auto;
  color: #fff;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 68rpx;
  background: #d43b30;
  border-radius: 999rpx;
  box-shadow: 0 8rpx 20rpx rgba(212, 59, 48, 0.16);
}

.primary-hover {
  opacity: 0.84;
}

.empty {
  padding-top: 200rpx;
  color: #99918c;
  font-size: 24rpx;
  text-align: center;
}

.retry-button {
  width: auto;
  height: 54rpx;
  margin: 22rpx auto 0;
  padding: 0 24rpx;
  color: #c83b31;
  font-size: 22rpx;
  line-height: 54rpx;
  background: #fff2f0;
  border-radius: 27rpx;
}

.retry-button::after {
  border: 0;
}
</style>

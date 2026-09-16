<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getEmployeeProjectListApi } from '@/api/project'
import EmployeeProjectStatus from '@/components/project/EmployeeProjectStatus.vue'
import type { RenovationProject } from '@/types/renovation-business'
import type { EmployeeProjectListParams } from '@/types/project'
import { formatDateTime } from '@/utils/format'

type Filter = EmployeeProjectListParams['status']
const filters: Array<{ label: string; value: Filter }> = [
  { label: '全部', value: 'ALL' },
  { label: '待确认', value: 'PENDING_CONFIRM' },
  { label: '服务中', value: 'IN_SERVICE' },
  { label: '已完成', value: 'COMPLETED' },
]
const active = ref<Filter>('ALL')
const list = ref<RenovationProject[]>([])
const total = ref(0)
const pageNum = ref(0)
const totalPage = ref(0)
const loading = ref(false)
const loadFailed = ref(false)
const loaded = ref(false)
const hasMore = computed(() => pageNum.value < totalPage.value)

const loadProjects = async (reset = false) => {
  if (loading.value || (!reset && !hasMore.value)) return
  const nextPage = reset ? 1 : pageNum.value + 1
  loading.value = true
  loadFailed.value = false
  if (reset) {
    list.value = []
    total.value = 0
    pageNum.value = 0
    totalPage.value = 0
  }
  try {
    const { data } = await getEmployeeProjectListApi({
      status: active.value,
      pageNum: nextPage,
      pageSize: 10,
    })
    if (!data || !Array.isArray(data.list)) throw new Error('项目列表数据不完整')
    list.value = reset ? data.list : [...list.value, ...data.list]
    total.value = data.total
    pageNum.value = data.pageNum
    totalPage.value = data.totalPage
  } catch (error) {
    console.error('获取员工装修项目列表失败：', error)
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

const selectStatus = (status: Filter) => {
  if (loading.value || active.value === status) return
  active.value = status
  loadProjects(true)
}
const open = (id: number) =>
  uni.navigateTo({
    url: `/pages-sub/my/employeeRenovationOrderDetail/employeeRenovationOrderDetail?id=${id}`,
  })

onLoad((query) => {
  const status = query?.status as Filter
  if (filters.some((item) => item.value === status)) active.value = status
  loadProjects(true).finally(() => {
    loaded.value = true
  })
})
onShow(() => {
  if (loaded.value) loadProjects(true)
})
</script>
<template>
  <view class="page">
    <scroll-view class="scroll" scroll-y lower-threshold="120" @scrolltolower="loadProjects()">
      <view class="content">
        <view class="overview">
          <view class="title">我的项目</view>
        </view>
        <view class="tabs">
          <view
            v-for="item in filters"
            :key="item.value"
            :class="{ active: active === item.value }"
            @click="selectStatus(item.value)"
          >
            {{ item.label }}
          </view>
        </view>
        <view v-if="pageNum > 0" class="count">共 {{ total }} 个项目</view>
        <view v-for="item in list" :key="item.id" class="card" @click="open(item.id)">
          <view class="head">
            <text class="card-title">{{ item.name }}</text>
            <EmployeeProjectStatus :status="item.status" />
          </view>
          <view class="line">
            <text>客户</text><text>{{ item.customerName }} {{ item.mobile }}</text>
          </view>
          <view class="line">
            <text>地址</text><text>{{ item.serviceAddress }}</text>
          </view>
          <view class="line">
            <text>最近更新</text><text>{{ formatDateTime(item.updatedAt) }}</text>
          </view>
        </view>
        <view v-if="loading" class="list-state">正在加载项目...</view>
        <view v-else-if="loadFailed" class="list-state">
          <view>项目列表加载失败</view>
          <button class="retry-button" @click="loadProjects(pageNum === 0)">重新加载</button>
        </view>
        <view v-else-if="!list.length" class="list-state">暂无装修项目</view>
        <view v-else-if="!hasMore" class="list-state">没有更多项目了</view>
      </view>
    </scroll-view>
  </view>
</template>
<style lang="scss">
.page,
.scroll {
  height: 100vh;
  min-height: 100vh;
  background: #f8f7f5;
}
.content {
  padding: 24rpx;
}
.overview,
.card {
  background: #fff;
  border-radius: 18rpx;
}
.overview {
  padding: 28rpx;
}
.title {
  font-size: 34rpx;
  font-weight: 700;
}
.tabs {
  display: flex;
  margin-top: 20rpx;
  padding: 12rpx;
  background: #fff;
  border-radius: 18rpx;
}
.tabs view {
  flex: 1;
  padding: 12rpx 0;
  text-align: center;
  font-size: 23rpx;
}
.tabs .active {
  color: #fff;
  background: #d92d20;
  border-radius: 26rpx;
}
.count {
  margin: 20rpx 4rpx;
  color: #888;
  font-size: 24rpx;
}
.card {
  margin-bottom: 18rpx;
  padding: 24rpx;
}
.head,
.line {
  display: flex;
  justify-content: space-between;
}
.head {
  align-items: flex-start;
  gap: 24rpx;
}
.card-title {
  min-width: 0;
  overflow-wrap: break-word;
  font-size: 29rpx;
  font-weight: 650;
}
.line {
  margin-top: 18rpx;
  color: #777;
  font-size: 24rpx;
}
.line text:last-child {
  max-width: 70%;
  color: #333;
  text-align: right;
}
.list-state {
  padding: 32rpx 0;
  color: #888;
  font-size: 24rpx;
  text-align: center;
}
.retry-button {
  width: 220rpx;
  margin-top: 20rpx;
  color: #d92d20;
  font-size: 24rpx;
  background: #fff;
  border-radius: 32rpx;
}
</style>

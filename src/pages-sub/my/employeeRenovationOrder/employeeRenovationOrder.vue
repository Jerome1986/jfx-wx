<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { projectStatusText, useRenovationBusinessStore } from '@/stores/modules/renovation-business'
import type { RenovationProjectStatus } from '@/types/renovation-business'

type Filter = 'all' | RenovationProjectStatus
// 员工项目筛选项
const filters: Array<{ label: string; value: Filter }> = [
  { label: '全部', value: 'all' },
  { label: '待确认', value: 'PENDING_CONFIRM' },
  { label: '服务中', value: 'IN_SERVICE' },
  { label: '已完成', value: 'COMPLETED' },
]
// 当前项目筛选状态
const active = ref<Filter>('all')
// 装修业务状态
const store = useRenovationBusinessStore()
// 当前筛选后的员工项目列表
const list = computed(() =>
  store.projects.filter((item) => active.value === 'all' || item.status === active.value),
)
// 统计指定状态的项目数量
const count = (status: RenovationProjectStatus) =>
  store.projects.filter((item) => item.status === status).length
// 打开员工项目详情
const open = (id: number) =>
  uni.navigateTo({
    url: `/pages-sub/my/employeeRenovationOrderDetail/employeeRenovationOrderDetail?id=${id}`,
  })

onLoad((query) => {
  // 页面参数指定的初始筛选状态
  const status = query?.status as Filter
  if (filters.some((item) => item.value === status)) active.value = status
})
</script>
<template>
  <view class="page"
    ><scroll-view class="scroll" scroll-y
      ><view class="content"
        ><view class="overview"
          ><view class="title">我的项目</view
          ><view class="stats"
            ><view
              ><text class="stats-value">{{ count('PENDING_CONFIRM') }}</text
              ><text>待确认</text></view
            ><view
              ><text class="stats-value">{{ count('IN_SERVICE') }}</text
              ><text>服务中</text></view
            ><view
              ><text class="stats-value">{{ count('COMPLETED') }}</text
              ><text>已完成</text></view
            ></view
          ></view
        ><view class="tabs"
          ><view
            v-for="i in filters"
            :key="i.value"
            :class="{ active: active === i.value }"
            @click="active = i.value"
            >{{ i.label }}</view
          ></view
        ><view class="count">共 {{ list.length }} 个项目</view
        ><view v-for="item in list" :key="item.id" class="card" @click="open(item.id)"
          ><view class="head"
            ><text class="card-title">{{ item.name }}</text
            ><text class="status">{{ projectStatusText[item.status] }}</text></view
          ><view class="line"
            ><text>客户</text><text>{{ item.customerName }} {{ item.mobile }}</text></view
          ><view class="line"
            ><text>地址</text><text>{{ item.serviceAddress }}</text></view
          ><view class="line"
            ><text>最近更新</text><text>{{ item.updatedAt }}</text></view
          ></view
        ></view
      ></scroll-view
    ></view
  >
</template>
<style lang="scss">
.page,
.scroll {
  height: 100%;
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
.stats {
  display: flex;
  margin-top: 24rpx;
}
.stats view {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
}
.stats .stats-value {
  color: #d92d20;
  font-size: 36rpx;
  font-weight: 700;
}
.stats text {
  color: #777;
  font-size: 22rpx;
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
.card-title {
  font-size: 29rpx;
  font-weight: 650;
}
.status {
  color: #d92d20;
  font-size: 23rpx;
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
</style>

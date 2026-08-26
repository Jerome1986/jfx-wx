<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { projectStatusText, useRenovationBusinessStore } from '@/stores/modules/renovation-business'

// 当前装修项目 ID
const id = ref(0)
// 待提交的跟进内容
const text = ref('')
// 装修业务状态
const store = useRenovationBusinessStore()
// 当前装修项目详情
const project = computed(() => store.getProject(id.value))
// 当前项目的跟进记录
const records = computed(() =>
  store.followUps.filter((item) => item.projectId === id.value).sort((a, b) => b.id - a.id),
)
// 新增项目跟进记录
const add = () => {
  if (store.addFollowUp({ projectId: id.value, employeeId: 1, content: text.value })) {
    text.value = ''
    uni.showToast({ title: '项目跟进已记录', icon: 'success' })
  }
}
// 推进当前项目状态
const advance = () => {
  if (!project.value) return
  if (project.value.status === 'PENDING_CONFIRM') project.value.status = 'IN_SERVICE'
  else if (project.value.status === 'IN_SERVICE') project.value.status = 'COMPLETED'
  project.value.updatedAt = new Date().toLocaleString()
}

onLoad((query) => {
  id.value = Number(query?.id) || 0
})
</script>
<template>
  <view class="page"
    ><view v-if="project"
      ><view class="card hero"
        ><view
          ><view class="title">{{ project.name }}</view
          ><view class="sub">{{ project.projectNo }}</view></view
        ><text>{{ projectStatusText[project.status] }}</text></view
      ><view class="card"
        ><view class="section">客户与项目</view
        ><view class="row"
          ><text>客户</text><text>{{ project.customerName }} {{ project.mobile }}</text></view
        ><view class="row"
          ><text>地址</text><text>{{ project.serviceAddress }}</text></view
        ><view class="row"
          ><text>预估金额</text><text>¥{{ project.quotedAmount.toFixed(2) }}</text></view
        ></view
      ><view class="card"
        ><view class="section">项目跟进</view
        ><textarea v-model="text" placeholder="记录项目沟通或履约进展" /><button
          class="secondary"
          @click="add"
        >
          保存跟进</button
        ><view v-for="r in records" :key="r.id" class="record"
          >{{ r.content }}<text>{{ r.createdAt }}</text></view
        ></view
      ><button
        v-if="project.status === 'PENDING_CONFIRM' || project.status === 'IN_SERVICE'"
        class="primary"
        @click="advance"
      >
        {{ project.status === 'PENDING_CONFIRM' ? '确认项目并开始服务' : '标记项目完成' }}
      </button></view
    ><view v-else class="empty">项目不存在</view></view
  >
</template>
<style lang="scss">
.page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
  background: #f8f7f5;
}
.card {
  margin-bottom: 20rpx;
  padding: 26rpx;
  background: #fff;
  border-radius: 18rpx;
}
.hero {
  display: flex;
  justify-content: space-between;
  border-left: 4rpx solid #d92d20;
}
.title,
.section {
  font-size: 30rpx;
  font-weight: 700;
}
.sub {
  margin-top: 8rpx;
  color: #999;
  font-size: 22rpx;
}
.hero > text {
  color: #d92d20;
}
.row {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
  color: #777;
  font-size: 24rpx;
}
.row text:last-child {
  max-width: 70%;
  color: #333;
  text-align: right;
}
textarea {
  box-sizing: border-box;
  width: 100%;
  height: 130rpx;
  margin-top: 18rpx;
  padding: 18rpx;
  background: #f7f7f7;
  border-radius: 10rpx;
}
.primary,
.secondary {
  margin-top: 20rpx;
  border-radius: 40rpx;
}
.primary {
  color: #fff;
  background: #d92d20;
}
.secondary {
  color: #d92d20;
  background: #fff4f3;
}
.primary::after,
.secondary::after {
  border: 0;
}
.record {
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #eee;
}
.record text {
  display: block;
  color: #999;
  font-size: 21rpx;
}
.empty {
  padding-top: 200rpx;
  text-align: center;
}
</style>

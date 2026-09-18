<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRenovationBusinessStore } from '@/stores/modules/renovation-business'
import { createEmployeeProjectApi } from '@/api/project'
import ProjectQuoteSummary from '@/components/project/ProjectQuoteSummary.vue'
import { validateQuote } from '@/utils/project-quote'
import type { CreateProjectInput } from '@/types/project'

// 装修业务 Store，用于跨页面保存未提交的建项草稿。
const store = useRenovationBusinessStore()
// 当前建项关联的预约 ID。
const appointmentId = ref(0)
// 创建项目接口的提交状态。
const submitting = ref(false)
// 成功状态独立于草稿，清理草稿后继续展示跳转状态。
const createdProjectId = ref(0)
const navigating = ref(false)
// 当前预约的来源快照。
const source = computed(() => store.projectSources[appointmentId.value])
// 当前预约对应的建项草稿。
const draft = computed(() => store.projectDrafts[appointmentId.value])
// 仅允许已完成且草稿存在的预约创建项目。
const canCreate = computed(
  () => !createdProjectId.value && source.value?.status === 'COMPLETED' && !!draft.value,
)
// 当前项目的负责员工名称。
const employeeName = computed(
  () =>
    source.value?.employee?.user?.realName ||
    (source.value?.employeeId ? `员工 ${source.value.employeeId}` : '未填写'),
)
onLoad((query) => {
  // 1. 读取预约 ID。
  appointmentId.value = Number(query?.appointmentId) || 0
  // 2. 根据预约快照初始化或恢复建项草稿。
  const currentDraft = store.ensureProjectDraft(appointmentId.value)
  // 3. 后端暂不接收优惠字段，统一按无优惠提交。
  if (currentDraft) currentDraft.quote.discount = '0'
})
// 返回上一页，失败时回到“我的”页面。
const goBack = () => uni.navigateBack({ fail: () => uni.switchTab({ url: '/pages/my/my' }) })
// 打开装修方案选择页。
const openPlan = () =>
  uni.navigateTo({
    url: `/pages-sub/my/projectPlanSelect/projectPlanSelect?appointmentId=${appointmentId.value}`,
  })
// 打开当前建项草稿的报价明细页。
const openQuote = () =>
  uni.navigateTo({
    url: `/pages-sub/my/projectQuote/projectQuote?target=draft&id=${appointmentId.value}`,
  })
// 校验表单并组装创建项目接口参数。
const buildPayload = (): CreateProjectInput => {
  // 1. 校验来源预约和建项草稿是否仍然有效。
  if (!source.value || !draft.value) throw new Error('预约信息已失效，请返回重试')
  // 2. 清理基础表单字段两端的空格。
  const customerName = draft.value.customerName.trim()
  const mobile = draft.value.mobile.trim()
  const serviceAddress = draft.value.serviceAddress.trim()
  const name = draft.value.name.trim()
  // 3. 按后端 DTO 校验必填项、手机号和字段长度。
  if (![customerName, mobile, serviceAddress, name].every(Boolean))
    throw new Error('请完善所有必填信息')
  if (!/^1[3-9]\d{9}$/.test(mobile)) throw new Error('请输入正确的手机号码')
  if (customerName.length > 191 || serviceAddress.length > 191 || name.length > 191)
    throw new Error('客户姓名、服务地址和项目名称不能超过191个字符')
  if (!draft.value.planId) throw new Error('请先选择标准方案')
  // 4. 校验报价明细和金额格式。
  const quoteError = validateQuote(draft.value.quote)
  if (quoteError) throw new Error(quoteError)
  // 5. 将页面报价快照转换为后端 quoteItems。
  const quoteItems = draft.value.quote.items.map((item) => {
    const category = (item.businessCategory || '').trim()
    const itemName = item.name.trim()
    const description = item.description.trim()
    const image = item.image.trim()
    const unit = item.unit.trim()
    if (!category) throw new Error(`${itemName || '报价明细'}：业务分类不能为空`)
    if ([category, itemName, description, image, unit].some((value) => value.length > 191))
      throw new Error(`${itemName || '报价明细'}：文本内容不能超过191个字符`)
    return {
      productId: item.productId ?? null,
      category,
      name: itemName,
      description: description || null,
      image: image || null,
      unit,
      unitPrice: item.unitPrice.trim(),
      quantity: item.quantity.trim(),
    }
  })
  // 6. 返回与 CreateProjectDto 完全对应的请求参数。
  return {
    appointmentId: appointmentId.value,
    customerName,
    mobile,
    serviceAddress,
    planId: draft.value.planId,
    name,
    quoteItems,
  }
}

// 跳转失败后只重试打开已创建的项目，不重复提交创建请求。
const openCreatedProject = () => {
  if (!createdProjectId.value || navigating.value) return
  navigating.value = true
  uni.redirectTo({
    url: `/pages-sub/my/employeeRenovationOrderDetail/employeeRenovationOrderDetail?id=${createdProjectId.value}`,
    fail: () => {
      navigating.value = false
      uni.showToast({ title: '项目已创建，请点击查看项目', icon: 'none' })
    },
  })
}

// 调用员工创建项目接口并进入项目详情页。
const submit = async () => {
  // 1. 阻止无效草稿或重复点击提交。
  if (submitting.value || !canCreate.value) return
  submitting.value = true
  try {
    // 2. 完成前端校验并生成接口参数。
    const payload = buildPayload()
    // 3. 请求后端创建装修项目。
    const { data } = await createEmployeeProjectApi(payload)
    if (!Number.isInteger(data?.id) || data.id <= 0) throw new Error('创建结果缺少项目ID')
    // 4. 先记录成功状态，再清理草稿，避免触发不存在提示。
    createdProjectId.value = data.id
    store.clearProjectDraft(appointmentId.value)
    // 5. 使用后端项目 ID 跳转员工项目详情。
    openCreatedProject()
  } catch (error) {
    // 6. 提交失败时恢复按钮并展示具体错误。
    submitting.value = false
    uni.showToast({
      title: error instanceof Error ? error.message : '创建失败，请重试',
      icon: 'none',
    })
  }
}
</script>
<template>
  <view class="workflow">
    <scroll-view class="workflow-scroll" scroll-y>
      <view class="content">
        <view v-if="createdProjectId" class="empty">
          <view>{{ navigating ? '项目已创建，正在进入详情…' : '项目已创建成功' }}</view>
          <button v-if="!navigating" class="secondary" @click="openCreatedProject">查看项目</button>
        </view>
        <template v-else-if="canCreate">
          <view class="page-heading">
            <view class="title">编制方案与报价</view>
            <view class="tip">根据现场勘察结果确认实施内容，编制项目实际报价</view>
            <view class="required-hint"
              ><text class="required-dot" />请完整填写项目信息并确认报价明细</view
            >
          </view>

          <view v-if="source.type === 'CASE'" class="case-reference">
            <view class="case-reference-label">客户参考案例</view>
            <view class="case-reference-title">{{ source.case?.title || '同款案例咨询' }}</view>
            <view class="case-reference-tip">
              参考案例仅用于了解客户偏好，请根据现场情况重新选择模板并调整报价明细。
            </view>
          </view>

          <view v-if="source.estimatedAmount" class="estimate-reference">
            <view class="estimate-reference-head">
              <text>预约预估报价</text><text>建项参考</text>
            </view>
            <view class="estimate-reference-amount">¥{{ source.estimatedAmount }}</view>
            <view v-if="source.estimateDescription" class="estimate-reference-description">
              {{ source.estimateDescription }}
            </view>
            <view class="estimate-reference-tip">
              此金额仅为上门测量后的预估结果，项目实际报价以方案明细汇总为准。
            </view>
          </view>

          <view class="section-heading">
            <view class="section-title">客户信息</view>
            <view class="section-note">请核对预约客户资料</view>
          </view>
          <view class="card">
            <view class="field-pair">
              <view class="field">
                <view class="label">客户姓名</view>
                <input v-model="draft.customerName" :maxlength="50" placeholder="请输入姓名" />
              </view>
              <view class="field">
                <view class="label">联系电话</view>
                <input
                  v-model="draft.mobile"
                  type="number"
                  :maxlength="11"
                  placeholder="请输入手机号"
                />
              </view>
            </view>
            <view class="field"
              ><view class="label">服务地址</view
              ><textarea
                v-model="draft.serviceAddress"
                :maxlength="191"
                placeholder="请填写详细服务地址"
              />
            </view>
            <view class="row"
              ><text>负责员工</text><text>{{ employeeName }}</text></view
            >
          </view>

          <view class="section-heading">
            <view class="section-title">项目内容</view>
            <view class="section-note">选择后台已发布的标准方案</view>
          </view>
          <view class="card">
            <view class="field"
              ><view class="label">项目名称</view
              ><input v-model="draft.name" :maxlength="100" placeholder="请输入项目名称"
            /></view>
            <view class="row" @click="openPlan"
              ><text>标准方案</text
              ><text class="link">{{ draft.planName || '选择标准方案' }} ›</text></view
            >
            <view class="tip">方案由后台统一维护，选择后可调整数量、删除或同类替换明细</view>
          </view>

          <view class="section-heading">
            <view class="section-title">项目报价</view>
            <view class="section-note">创建前请确认报价明细及金额</view>
          </view>
          <view class="card">
            <view v-if="!draft.quote.items.length" class="tip">选择标准方案后自动生成报价明细</view>
            <ProjectQuoteSummary :quote="draft.quote" />
            <button class="secondary" :disabled="!draft.quote.items.length" @click="openQuote">
              调整报价明细
            </button>
          </view>
        </template>
        <view v-else class="empty"
          ><view>预约信息不存在或尚未完成</view
          ><button class="secondary" @click="goBack">返回</button></view
        >
      </view>
    </scroll-view>
    <view v-if="canCreate" class="footer"
      ><button class="primary" :loading="submitting" :disabled="submitting" @click="submit">
        {{ submitting ? '提交中...' : '创建并提交报价' }}
      </button></view
    >
  </view>
</template>
<style scoped lang="scss">
@use '@/styles/project-workflow.scss';

.page-heading {
  margin-bottom: 34rpx;
  padding: 8rpx 4rpx 0;
}

.page-heading .title {
  margin-bottom: 8rpx;
  color: #282321;
  font-size: 34rpx;
  font-weight: 600;
}

.page-heading .tip {
  margin-top: 0;
  color: #918984;
  font-size: 23rpx;
}

.required-hint {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  color: #a29a95;
  font-size: 21rpx;
  line-height: 1.5;
}

.required-dot {
  width: 8rpx;
  height: 8rpx;
  margin-right: 10rpx;
  background: #d94a40;
  border-radius: 50%;
}

.estimate-reference {
  margin-bottom: 30rpx;
  padding: 24rpx 28rpx;
  background: #fff8f6;
  border: 1rpx solid rgba(217, 45, 32, 0.1);
  border-radius: 20rpx;
}

.case-reference {
  margin-bottom: 30rpx;
  padding: 24rpx 28rpx;
  background: #fff;
  border-left: 4rpx solid #d92d20;
  border-radius: 18rpx;
}

.case-reference-label {
  color: #99918c;
  font-size: 21rpx;
}

.case-reference-title {
  margin-top: 8rpx;
  color: #302a27;
  font-size: 28rpx;
  font-weight: 600;
}

.case-reference-tip {
  margin-top: 12rpx;
  color: #8c827d;
  font-size: 22rpx;
  line-height: 34rpx;
}

.estimate-reference-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #5b514c;
  font-size: 24rpx;
  font-weight: 600;
}

.estimate-reference-head text:last-child {
  color: #a49a95;
  font-size: 21rpx;
  font-weight: 400;
}

.estimate-reference-amount {
  margin-top: 12rpx;
  color: #d92d20;
  font-size: 40rpx;
  font-weight: 650;
}

.estimate-reference-description,
.estimate-reference-tip {
  margin-top: 12rpx;
  color: #655c57;
  font-size: 22rpx;
  line-height: 34rpx;
}

.estimate-reference-tip {
  color: #9a918c;
}

.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24rpx;
  margin: 0 6rpx 14rpx;
}

.section-title {
  color: #302a27;
  font-size: 27rpx;
  font-weight: 600;
}

.section-note {
  color: #a39c97;
  font-size: 21rpx;
  text-align: right;
}

.card {
  margin-bottom: 30rpx;
  padding: 26rpx 28rpx;
  border: 1rpx solid rgba(45, 36, 31, 0.04);
  border-radius: 20rpx;
  box-shadow: 0 8rpx 26rpx rgba(45, 36, 31, 0.03);
}

.field-pair {
  display: flex;
  gap: 18rpx;
}

.field-pair .field {
  flex: 1;
  min-width: 0;
}

.field:first-child,
.field-pair .field {
  margin-top: 0;
}

.label {
  color: #514a46;
  font-size: 24rpx;
}

input,
textarea {
  color: #302b28;
  font-size: 26rpx;
  background: #f8f7f5;
}

input {
  height: 76rpx;
  padding: 0 18rpx;
  line-height: 76rpx;
}

textarea {
  height: 144rpx;
  padding: 18rpx;
}

.row {
  margin: 22rpx 0 0;
  padding-top: 22rpx;
  border-top: 1rpx solid #f1eeec;
  color: #77706c;
  font-size: 24rpx;
}

.row > text:last-child {
  color: #332e2b;
}
</style>

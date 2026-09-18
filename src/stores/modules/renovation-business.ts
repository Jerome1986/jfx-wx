import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  FollowUp,
  RenovationProject,
  RenovationProjectStatus,
} from '@/types/renovation-business'
import type { ProjectDraft, ProjectPlanCandidate } from '@/types/project-quote'
import { copyQuoteData, newQuoteLineId } from '@/utils/project-quote'

export const appointmentTypeText: Record<AppointmentType, string> = {
  BUDGET: '装修预算',
  MEASURE: '免费量房',
  QUOTE: '房屋报价',
  PLAN: '焕新服务',
  CASE: '案例咨询',
  OUTLET: '网点咨询',
}

export const appointmentStatusText: Record<AppointmentStatus, string> = {
  PENDING_CONTACT: '待联系',
  PENDING_VISIT: '待上门',
  COMPLETED: '已完成',
  CANCELED: '已取消',
}

export const projectStatusText: Record<RenovationProjectStatus, string> = {
  PENDING_CONFIRM: '待客户确认',
  IN_SERVICE: '服务中',
  COMPLETED: '已完成',
  CANCELED: '已取消',
}

export const useRenovationBusinessStore = defineStore(
  'renovation-business',
  () => {
    const appointments = ref<Appointment[]>([])
    const followUps = ref<FollowUp[]>([])
    const projects = ref<RenovationProject[]>([])
    // 保留从真实预约详情进入建项时的快照。
    const projectSources = ref<Record<number, Appointment>>({})
    // 按预约 ID 保存跨页面使用的建项草稿。
    const projectDrafts = ref<Record<number, ProjectDraft>>({})
    // 根据已完成预约初始化或恢复建项草稿。
    const ensureProjectDraft = (id: number) => {
      // 1. 只接受已完成预约作为建项来源。
      const appointment = projectSources.value[id]
      if (!appointment || appointment.status !== 'COMPLETED') return undefined
      // 2. 已有草稿时直接复用，避免覆盖员工修改。
      if (projectDrafts.value[id]) return projectDrafts.value[id]
      // 3. 报价需求的预估价不作为项目报价明细，项目报价需重新选择方案。
      const initialItems = ['BUDGET', 'QUOTE'].includes(appointment.type)
        ? []
        : appointment.snapshot?.items || []
      // 4. 从预约基础信息和业务快照生成初始草稿。
      projectDrafts.value[id] = {
        customerName: appointment.customerName || '',
        mobile: appointment.mobile || '',
        serviceAddress:
          appointment.visitAddress ||
          appointment.serviceAddress ||
          appointment.snapshot?.address ||
          '',
        name: appointment.snapshot?.title || `${appointmentTypeText[appointment.type]}装修项目`,
        renovationScope: appointment.demand || '',
        planId: appointment.planId,
        planName: appointment.planId
          ? String(
              appointment.plan?.name || appointment.snapshot?.title || `方案 ${appointment.planId}`,
            )
          : undefined,
        planSource: appointment.planId ? 'appointment' : undefined,
        quote: {
          discount: '0',
          items: initialItems.map((item) => ({
            id: newQuoteLineId(),
            source: 'appointment',
            productId: item.productId ?? undefined,
            sourceItemId: item.sourceItemId,
            candidateId: item.candidateId,
            businessCategory: item.category,
            category:
              item.productId !== null && item.productId !== undefined ? 'product' : 'service',
            name: item.name,
            description: item.description || '',
            image: item.image || '',
            unit: item.unit || '',
            unitPrice: item.unitPrice || '',
            quantity: item.quantity || '',
          })),
        },
        remark: '',
      }
      // 5. 返回新建草稿供页面立即使用。
      return projectDrafts.value[id]
    }
    // 将员工选择的真实方案写入建项草稿。
    const selectProjectPlan = (id: number, plan?: ProjectPlanCandidate) => {
      // 1. 校验草稿和来源预约状态。
      const draft = projectDrafts.value[id]
      if (!draft || projectSources.value[id]?.status !== 'COMPLETED') return false
      // 2. 更新方案关联信息。
      draft.planId = plan?.id
      draft.planName = plan?.name
      draft.planSource = plan ? 'api' : undefined
      // 3. 选择方案时用方案明细覆盖报价草稿。
      if (plan)
        draft.quote = {
          discount: '0',
          items: plan.items.map((item) => ({ ...copyQuoteData(item), id: newQuoteLineId() })),
        }
      // 4. 返回写入结果。
      return true
    }
    // 缓存进入建项流程时的预约快照。
    const cacheProjectSource = (appointment: Appointment) => {
      // 深拷贝预约，避免详情页后续更新影响建项草稿。
      projectSources.value[appointment.id] = JSON.parse(JSON.stringify(appointment))
    }
    const getProject = (id: number) => projects.value.find((item) => item.id === id)

    // 缓存真实详情接口返回的项目，供跨页面查看报价。
    const cacheCreatedProject = (project: RenovationProject) => {
      // 1. 查找相同后端项目 ID 的缓存位置。
      const index = projects.value.findIndex((item) => item.id === project.id)
      // 2. 已存在时更新，否则追加项目。
      if (index >= 0) projects.value[index] = project
      else projects.value.push(project)
    }

    // 清理指定预约已经提交的建项草稿。
    const clearProjectDraft = (id: number) => {
      delete projectDrafts.value[id]
    }

    return {
      appointments,
      followUps,
      projects,
      projectSources,
      projectDrafts,
      ensureProjectDraft,
      selectProjectPlan,
      cacheProjectSource,
      getProject,
      cacheCreatedProject,
      clearProjectDraft,
    }
  },
  {
    persist: {
      // 仅持久化未提交草稿；旧版演示预约和项目缓存不再恢复。
      paths: ['projectSources', 'projectDrafts'],
      afterRestore: ({ store }) => {
        store.$patch((state) => {
          state.appointments = []
          state.followUps = []
          state.projects = []
        })
      },
    },
  },
)

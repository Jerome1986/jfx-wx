import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  ConfirmVisitInput,
  CreateAppointmentInput,
  FollowUp,
  RenovationProject,
  RenovationProjectStatus,
} from '@/types/renovation-business'
import type { ProjectDraft, ProjectPlanCandidate } from '@/types/project-quote'
import { copyQuoteData, newQuoteLineId } from '@/utils/project-quote'

const nowText = () => {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

const seedAppointments: Appointment[] = [
  ['BUDGET', '装修预算计算器', '想了解两居室整体翻新的预算范围'],
  ['MEASURE', '首页免费量房', '厨房和卫生间需要上门测量'],
  ['QUOTE', '房屋报价', '希望顾问提供局部翻新报价'],
  ['PLAN', '空间焕新', '预约厨房焕新方案', { title: '95㎡老房厨房焕新', referencePrice: '116000' }],
  [
    'CASE',
    '精选案例',
    '获取同款案例报价',
    { title: '68㎡老房翻新焕新颜', referencePrice: '286000' },
  ],
  [
    'OUTLET',
    '服务网点',
    '预约到店咨询',
    { title: '家翻新洪山服务中心', address: '武汉市洪山区珞瑜路' },
  ],
].map(([type, source, demand, snapshot], index) => ({
  id: index + 1,
  appointmentNo: `APT202608${String(index + 1).padStart(4, '0')}`,
  userId: 1,
  employeeId: 1,
  type: type as AppointmentType,
  source: source as string,
  customerName: index % 2 ? '李女士' : '张先生',
  mobile: index % 2 ? '13700006819' : '13800005628',
  city: '武汉',
  area: index < 3 ? '95' : undefined,
  roomLayout: index < 3 ? '两室一厅' : undefined,
  demand: demand as string,
  focus: '请尽快联系并确认下一步安排',
  status: index === 1 ? 'PENDING_VISIT' : index === 2 ? 'COMPLETED' : 'PENDING_CONTACT',
  visitDate: index === 1 ? '2026-08-22' : undefined,
  timeSlot: index === 1 ? '10:00-12:00' : undefined,
  visitAddress: index === 1 ? '武汉市洪山区珞瑜路88号' : undefined,
  snapshot: snapshot as Appointment['snapshot'],
  createdAt: `2026-08-${String(18 - index).padStart(2, '0')} 14:30`,
  updatedAt: `2026-08-${String(18 - index).padStart(2, '0')} 14:30`,
}))

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
    const appointments = ref<Appointment[]>(seedAppointments)
    const followUps = ref<FollowUp[]>([])
    const projects = ref<RenovationProject[]>([])
    // 与演示预约隔离，保留从真实预约详情进入建项时的快照。
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
    // 根据来源预约 ID 查找已转换项目。
    const getConvertedProject = (appointmentId: number) =>
      projects.value.find(
        (item) => item.sourceKind === 'appointment' && item.appointmentId === appointmentId,
      )

    // 清理已下线的列表快捷入口曾产生的重复模拟记录
    const removeLegacyQuickAppointments = () => {
      appointments.value = appointments.value.filter(
        (item) => item.source !== '预约管理快捷入口' && item.source !== '房屋报价快捷入口',
      )
    }
    removeLegacyQuickAppointments()

    const removeLegacyProjectTestData = () => {
      projects.value = projects.value.filter(
        (item) => !(item.id === 1 && item.projectNo === 'PRJ2026080001' && !item.sourceKind),
      )
    }
    removeLegacyProjectTestData()

    const appointmentCount = computed(() => appointments.value.length)
    const listAppointments = (types?: AppointmentType[], status?: AppointmentStatus) =>
      appointments.value
        .filter((item) => !types?.length || types.includes(item.type))
        .filter((item) => !status || item.status === status)
        .slice()
        .sort((a, b) => b.id - a.id)
    const getAppointment = (id: number) => appointments.value.find((item) => item.id === id)
    const getProject = (id: number) => projects.value.find((item) => item.id === id)

    const createAppointment = (input: CreateAppointmentInput) => {
      const id = Math.max(0, ...appointments.value.map((item) => item.id)) + 1
      const createdAt = nowText()
      const appointment: Appointment = {
        ...input,
        id,
        appointmentNo: `APT${createdAt.replace(/[- :]/g, '').slice(0, 12)}${String(id).padStart(
          3,
          '0',
        )}`,
        userId: input.userId ?? 1,
        customerName: input.customerName || '当前用户',
        mobile: input.mobile || '13800000000',
        status: 'PENDING_CONTACT',
        createdAt,
        updatedAt: createdAt,
      }
      appointments.value.push(appointment)
      return appointment
    }

    const cancelAppointment = (id: number) => {
      const item = getAppointment(id)
      if (!item || !['PENDING_CONTACT', 'PENDING_VISIT'].includes(item.status)) return false
      item.status = 'CANCELED'
      item.canceledAt = nowText()
      item.updatedAt = item.canceledAt
      return true
    }

    const addFollowUp = (input: Omit<FollowUp, 'id' | 'createdAt'>) => {
      if (!input.content.trim() || (!input.appointmentId && !input.projectId)) return undefined
      const followUp: FollowUp = {
        ...input,
        id: Math.max(0, ...followUps.value.map((item) => item.id)) + 1,
        content: input.content.trim(),
        createdAt: nowText(),
      }
      followUps.value.push(followUp)
      return followUp
    }

    const confirmVisit = (id: number, input: ConfirmVisitInput) => {
      const item = getAppointment(id)
      if (!item || item.status !== 'PENDING_CONTACT') return false
      item.visitDate = input.visitDate
      item.timeSlot = input.timeSlot
      item.visitAddress = input.visitAddress
      item.status = 'PENDING_VISIT'
      item.updatedAt = nowText()
      if (input.followUp) addFollowUp({ appointmentId: id, employeeId: 1, content: input.followUp })
      return true
    }

    const completeAppointment = (id: number) => {
      const item = getAppointment(id)
      if (!item || item.status !== 'PENDING_VISIT') return false
      item.status = 'COMPLETED'
      item.completedAt = nowText()
      item.updatedAt = item.completedAt
      return true
    }

    // 临时缓存接口创建成功的项目，供详情接口接入前展示。
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

    const confirmProjectQuote = (id: number) => {
      const project = getProject(id)
      if (!project || project.status !== 'PENDING_CONFIRM') return false
      project.status = 'IN_SERVICE'
      project.customerConfirmedAt = nowText()
      project.updatedAt = project.customerConfirmedAt
      return true
    }

    const completeProject = (id: number) => {
      const project = getProject(id)
      if (!project || project.status !== 'IN_SERVICE') return false
      project.status = 'COMPLETED'
      project.completedAt = nowText()
      project.updatedAt = project.completedAt
      return true
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
      getConvertedProject,
      confirmProjectQuote,
      completeProject,
      appointmentCount,
      listAppointments,
      getAppointment,
      getProject,
      createAppointment,
      cancelAppointment,
      confirmVisit,
      completeAppointment,
      addFollowUp,
      cacheCreatedProject,
      clearProjectDraft,
      removeLegacyQuickAppointments,
      removeLegacyProjectTestData,
    }
  },
  {
    persist: {
      afterRestore: ({ store }) => {
        store.removeLegacyQuickAppointments()
        store.removeLegacyProjectTestData()
      },
    },
  },
)

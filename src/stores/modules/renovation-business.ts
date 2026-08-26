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

const seedProjects: RenovationProject[] = [
  {
    id: 1,
    projectNo: 'PRJ2026080001',
    appointmentId: 3,
    userId: 1,
    employeeId: 1,
    name: '95㎡老房厨房改造',
    customerName: '张先生',
    mobile: '13800005628',
    serviceAddress: '武汉市洪山区珞瑜路88号',
    quotedAmount: 14163,
    status: 'PENDING_CONFIRM',
    createdAt: '2026-08-18 15:00',
    updatedAt: '2026-08-18 15:00',
  },
]

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
  PENDING_CONFIRM: '待确认',
  IN_SERVICE: '服务中',
  COMPLETED: '已完成',
  CANCELED: '已取消',
}

export const useRenovationBusinessStore = defineStore(
  'renovation-business',
  () => {
    const appointments = ref<Appointment[]>(seedAppointments)
    const followUps = ref<FollowUp[]>([])
    const projects = ref<RenovationProject[]>(seedProjects)

    // 清理已下线的列表快捷入口曾产生的重复模拟记录
    const removeLegacyQuickAppointments = () => {
      appointments.value = appointments.value.filter(
        (item) => item.source !== '预约管理快捷入口' && item.source !== '房屋报价快捷入口',
      )
    }
    removeLegacyQuickAppointments()

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

    const convertToRenovationProject = (id: number) => {
      const appointment = getAppointment(id)
      if (!appointment || appointment.status !== 'COMPLETED') return undefined
      const existing = projects.value.find((item) => item.appointmentId === id)
      if (existing) return existing
      const projectId = Math.max(0, ...projects.value.map((item) => item.id)) + 1
      const createdAt = nowText()
      const amount = Number(appointment.snapshot?.referencePrice || 0)
      const project: RenovationProject = {
        id: projectId,
        projectNo: `PRJ${createdAt.replace(/[- :]/g, '').slice(0, 12)}${String(projectId).padStart(
          3,
          '0',
        )}`,
        appointmentId: id,
        userId: appointment.userId || 1,
        employeeId: appointment.employeeId || 1,
        planId: appointment.planId,
        name: appointment.snapshot?.title || `${appointmentTypeText[appointment.type]}装修项目`,
        customerName: appointment.customerName,
        mobile: appointment.mobile,
        serviceAddress:
          appointment.visitAddress || appointment.snapshot?.address || '待确认服务地址',
        quotedAmount: Number.isFinite(amount) ? amount : 0,
        status: 'PENDING_CONFIRM',
        createdAt,
        updatedAt: createdAt,
      }
      projects.value.push(project)
      return project
    }

    return {
      appointments,
      followUps,
      projects,
      appointmentCount,
      listAppointments,
      getAppointment,
      getProject,
      createAppointment,
      cancelAppointment,
      confirmVisit,
      completeAppointment,
      addFollowUp,
      convertToRenovationProject,
      removeLegacyQuickAppointments,
    }
  },
  {
    persist: {
      afterRestore: ({ store }) => store.removeLegacyQuickAppointments(),
    },
  },
)

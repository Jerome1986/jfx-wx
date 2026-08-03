import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppointmentSchedule, AppointmentServiceItem } from '@/types/appointment-service'

const initialAppointments: AppointmentServiceItem[] = [
  {
    id: 1,
    type: 'quote',
    status: 'contact',
    title: '房屋报价服务',
    source: '预算测算留资',
    submitTime: '06月18日 14:32',
    customer: '张先生',
    mobile: '138****5628',
    phoneNumber: '13800005628',
    demand: '厨房改造，想先了解预算范围',
    focus: '先确认户型、面积和是否需要安排上门复核',
    city: '武汉',
    info: [
      { label: '服务类型', value: '房屋报价' },
      { label: '所在城市', value: '武汉' },
      { label: '房屋信息', value: '两室一厅 · 89㎡' },
      { label: '客户备注', value: '厨房改造，想先了解预算范围' },
    ],
    serviceContent: '上门勘察，核对户型和改造需求',
    visitDate: '2026-06-24',
    visitTime: '14:00-16:00',
    address: '',
    communicationRecord: '客户希望先了解厨房翻新的预算区间，联系时确认房屋面积及上门勘察时间',
  },
  {
    id: 2,
    type: 'measure',
    status: 'contact',
    title: '免费量房服务',
    source: '首页量房预约',
    submitTime: '06月18日 16:20',
    customer: '李女士',
    mobile: '137****6819',
    phoneNumber: '13700006819',
    demand: '卫生间是局部翻新，需要上门量房',
    focus: '确认可上门时间、服务地址和现场接待人',
    city: '武汉',
    info: [
      { label: '服务类型', value: '免费量房' },
      { label: '所在城市', value: '武汉' },
      { label: '量房空间', value: '卫生间局部翻新' },
      { label: '客户备注', value: '老房卫生间想重做防水和收纳' },
    ],
    serviceContent: '上门量房，记录尺寸和现场情况',
    visitDate: '2026-06-24',
    visitTime: '14:00-16:00',
    address: '',
    communicationRecord: '客户下午在家，重点测量卫生间尺寸，并记录防水和收纳改造条件',
  },
  {
    id: 3,
    type: 'measure',
    status: 'service',
    title: '免费量房服务',
    source: '首页量房预约',
    submitTime: '06月18日 14:32',
    customer: '张先生',
    mobile: '138****5628',
    phoneNumber: '13800005628',
    demand: '武昌区中南路',
    focus: '复核厨房尺寸，沟通材料和预算范围',
    city: '武汉',
    info: [
      { label: '服务类型', value: '免费量房' },
      { label: '所在城市', value: '武汉' },
      { label: '量房空间', value: '卫生间局部翻新' },
      { label: '客户备注', value: '老房卫生间想重做防水和收纳' },
    ],
    serviceContent: '免费上门量房',
    visitDate: '2026-06-24',
    visitTime: '14:00-16:00',
    address: '江汉区青年路126号',
    communicationRecord: '客户希望上门前先准备预算范围，现场确认面积、户型和改造条件',
  },
]

export const useAppointmentServiceStore = defineStore(
  'appointment-service',
  () => {
    const appointments = ref<AppointmentServiceItem[]>(initialAppointments)

    const getAppointment = (id: number) => appointments.value.find((item) => item.id === id)

    const confirmService = (id: number, schedule: AppointmentSchedule) => {
      const appointment = getAppointment(id)
      if (!appointment || appointment.status !== 'contact') return false
      appointment.visitDate = schedule.visitDate
      appointment.visitTime = schedule.visitTime
      appointment.address = schedule.address
      appointment.communicationRecord = schedule.communicationRecord
      appointment.status = 'service'
      return true
    }

    const completeService = (id: number) => {
      const appointment = getAppointment(id)
      if (!appointment || appointment.status !== 'service') return false
      appointment.status = 'completed'
      return true
    }

    const completeQuote = (id: number) => {
      const appointment = getAppointment(id)
      if (!appointment || appointment.type !== 'quote' || appointment.status !== 'contact')
        return false
      appointment.status = 'completed'
      return true
    }

    const normalizeStatuses = () => {
      appointments.value.forEach((appointment) => {
        if (appointment.type === 'quote' && appointment.status === 'service') {
          appointment.status = 'contact'
        }
      })
    }

    return {
      appointments,
      getAppointment,
      confirmService,
      completeService,
      completeQuote,
      normalizeStatuses,
    }
  },
  { persist: true },
)

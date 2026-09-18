import { useMemberStore } from '@/stores'

// 预约仅向客户开放，按实际账号身份判断，不依赖页面来源参数。
export const canSubmitAppointment = (): boolean => {
  if (useMemberStore().profile?.role !== 'EMPLOYEE') return true
  uni.showToast({ title: '员工账号暂不支持提交预约', icon: 'none' })
  return false
}

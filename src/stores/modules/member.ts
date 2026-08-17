import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MemberProfile } from '@/types/member'

export type { MemberProfile, UserRole } from '@/types/member'

// 定义 Store
export const useMemberStore = defineStore(
  'member',
  () => {
    // 会员信息
    const profile = ref<MemberProfile>()
    // 登录凭证
    const token = ref('')

    // 保存会员信息，登录时使用
    const setProfile = (val: MemberProfile) => {
      profile.value = {
        ...val,
        role: val.role || 'CUSTOMER',
        points: val.points ?? 0,
        appointmentCount: val.appointmentCount ?? 0,
        favoriteCount: val.favoriteCount ?? 0,
        couponCount: val.couponCount ?? 0,
      }
    }

    // 保存登录凭证
    const setToken = (val: string) => {
      token.value = val
    }

    // 清理会员信息，退出时使用
    const clearProfile = () => {
      profile.value = undefined
      token.value = ''
    }

    // 记得 return
    return {
      profile,
      token,
      setProfile,
      setToken,
      clearProfile,
    }
  },
  // TODO: 持久化
  {
    persist: true,
  },
)

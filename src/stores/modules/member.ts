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

    // 保存会员信息，登录时使用
    const setProfile = (val: MemberProfile) => {
      profile.value = { ...val, role: val.role || 'customer' }
    }

    // 清理会员信息，退出时使用
    const clearProfile = () => {
      profile.value = undefined
    }

    // 记得 return
    return {
      profile,
      setProfile,
      clearProfile,
    }
  },
  // TODO: 持久化
  {
    persist: true,
  },
)

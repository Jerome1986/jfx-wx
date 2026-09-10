import type { LoginResult, UserRole } from '@/types/UserItem'
import { request } from '@/utils/http'

/** 开发专用：后端根据角色登录预设测试账号，返回结构与微信登录一致。 */
export const devLoginApi = (role: UserRole) => {
  if (!import.meta.env.DEV) return Promise.reject(new Error('开发登录仅在开发环境可用'))
  return request<LoginResult>({
    method: 'POST',
    url: '/user/dev-login',
    data: { role },
  })
}

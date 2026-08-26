import type { Gender, LoginResult, UserItem } from '@/types/UserItem'
import { request } from '@/utils/http'

/** 用户顶部数据汇总 */
export interface UserSummary {
  /** 当前可用积分 */
  points: number
  /** 预约数量 */
  appointmentCount: number
  /** 收藏数量 */
  favoriteCount: number
  /** 可用优惠券数量 */
  couponCount: number
}

/**
 * 微信手机号登录接口
 * POST /wx/login
 * @param {string} code - 微信小程序调用 wx.login 后返回的临时登录凭证，用于获取 sessionKey
 * @param phoneCode 微信手机号授权码
 */
export const wxLoginApi = (code: string, phoneCode: string) => {
  return request<LoginResult>({
    method: 'POST',
    url: '/user/wx-phone-login',
    data: {
      code,
      phoneCode,
    },
  })
}

/**
 * 更新用户资料
 * @param id
 * @param nickname
 * @param avatar
 * @param gender
 * @returns
 */
export const userInfoUpdate = (id: number, nickname: string, avatar: string, gender: Gender) => {
  return request<UserItem>({
    method: 'PUT',
    url: `/user/${id}`,
    data: { nickname, avatar, gender },
  })
}

/**
 * 获取用户详情
 * @param id
 * @returns
 */
export const userInfoFindOne = (id: number) => {
  return request<UserItem>({
    method: 'GET',
    url: `/user/${id}`,
  })
}

/**
 * 获取用户当前积分、预约、收藏和可用优惠券数量
 */
export const getUserSummary = (userId: number) => {
  return request<UserSummary>({
    method: 'GET',
    url: `/user/summary/${userId}`,
  })
}

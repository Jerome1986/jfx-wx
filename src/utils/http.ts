// 注意：这里不要静态依赖 Pinia store（会导致 chunk 循环依赖告警）
// token 从 persistedstate 的存储中读取即可。

/**
 * 添加拦截器:
 *   拦截 request 请求
 *   拦截 uploadFile 文件上传
 *
 * TODO:
 *   1. 非 http 开头需拼接地址
 *   2. 请求超时
 *   3. 添加小程序端请求头标识
 *   4. 添加 token 请求头标识
 */

// 基地址
const baseUrl = 'http://localhost:3000/api'
// const baseUrl = 'https://3fd5cb3c.r29.cpolar.top/api'

/**
 * 从 pinia-plugin-persistedstate 读取 member store token
 * - member store 的 defineStore id 为 'member'
 * - persistedstate 默认 key 即为 store id
 */
function getMemberTokenFromStorage(): string {
  try {
    const raw = uni.getStorageSync('member')
    if (!raw) return ''
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    return (state?.token as string) || ''
  } catch {
    return ''
  }
}

// 添加拦截器
const httpInterceptor = {
  // 拦截前触发
  invoke(options: UniApp.RequestOptions) {
    // 1. 非 http 开头需拼接地址
    if (!options.url.startsWith('http')) {
      options.url = baseUrl + options.url
    }
    // 2. 请求超时, 默认 60s
    options.timeout = 10000
    // 3. 添加小程序端请求头标识
    options.header = {
      ...options.header,
      'source-client': 'minimap',
    }
    // 4. 添加 token 请求头标识
    const token = getMemberTokenFromStorage()
    if (token) {
      // 兼容本地存储的纯 token 和已带 Bearer 前缀的 token。
      options.header.Authorization = /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`
    }
  },
}
uni.addInterceptor('request', httpInterceptor)
uni.addInterceptor('uploadFile', httpInterceptor)

/**
 * 请求函数
 * @param  UniApp.RequestOptions
 * @returns Promise
 *  1. 返回 Promise 对象
 *  2. 获取数据成功
 *    2.1 提取核心数据 res.data
 *    2.2 添加类型，支持泛型
 *  3. 获取数据失败
 *    3.1 401错误  -> 清理用户信息，跳转到登录页
 *    3.2 其他错误 -> 根据后端错误信息轻提示
 *    3.3 网络错误 -> 提示用户换网络
 */
export type Data<T> = {
  code: number
  message: string
  data: T
}

function safeShowToast(msg: string) {
  if (typeof msg === 'string') {
    uni.showToast({ title: msg, icon: 'none', duration: 2000, mask: true })
  } else {
    console.warn('toast msg is not string:', msg)
    uni.showToast({ title: '请求失败', icon: 'none', duration: 2000, mask: true })
  }
}

// 2.2 添加类型，支持泛型
export const request = <T>(options: UniApp.RequestOptions) => {
  // 1. 返回 Promise 对象
  return new Promise<Data<T>>((resolve, reject) => {
    uni.request({
      ...options,
      // 响应成功
      success(res) {
        const body = res.data as Data<T> | null
        const code = body?.code
        const httpSuccess = res.statusCode >= 200 && res.statusCode < 300
        // 搜索接口允许直接返回分页对象；带业务码时必须明确成功。
        if (httpSuccess && (code === undefined || code === 200)) {
          resolve(res.data as Data<T>)
          return
        }
        const rawMessage = body?.message
        const message = Array.isArray(rawMessage) ? rawMessage.join(',') : rawMessage || '请求失败'
        if (res.statusCode === 401 || code === 401) {
          uni.removeStorageSync('member')
          void import('@/stores/modules/member').then(({ useMemberStore }) => {
            useMemberStore().clearProfile()
          })
          uni.navigateTo({ url: '/pages/login/login' })
        }
        safeShowToast(message)
        // HTTP 状态与业务码分开保存，避免业务失败被误判为可以重新下单。
        reject({ ...res, code, message, notified: true })
      },
      // 响应失败
      fail(err) {
        uni.showToast({
          icon: 'none',
          title: '网络错误，换个网络试试',
        })
        reject({ ...err, notified: true })
      },
    })
  })
}

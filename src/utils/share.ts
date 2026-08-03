import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'
import type { ShareOptions } from '@/types/share'

const getQueryFromPath = (path = '') => {
  const queryIndex = path.indexOf('?')
  return queryIndex >= 0 ? path.slice(queryIndex + 1) : ''
}
/**
 * 注册页面分享能力。
 *
 * 页面调用一次后，同时支持：
 * 1. 微信右上角“转发给朋友”和“分享到朋友圈”
 * 2. open-type="share" 按钮分享
 */
export const useShare = (options: ShareOptions) => {
  onShow(() => {
    // #ifdef MP-WEIXIN
    uni.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    })
    // #endif
  })

  onShareAppMessage(() => {
    return {
      title: options.title,
      path: options.path || '/pages/home/home',
      imageUrl: options.imageUrl,
    }
  })

  onShareTimeline(() => {
    return {
      title: options.title,
      query: options.query ?? getQueryFromPath(options.path),
      imageUrl: options.imageUrl,
    }
  })
}

import { useCartStore } from '@/stores/modules/cart'
import { request } from '@/utils/http'

/** 创建订单所需信息，价格与用户身份由服务端确定。 */
export interface ConfirmOrderInput {
  appointmentDate: string
  timeSlot: string
  source?: string
  contactName: string
  contactPhone: string
  serviceAddress: string
  remark?: string
  items: { productId: number; quantity: number; skuDescription?: string }[]
  userCouponId?: number
  pointsUsed?: number
}

/** 服务端签名后的微信支付参数。 */
export interface WechatPaymentParams {
  timeStamp: string
  nonceStr: string
  packageValue: string
  signType: 'RSA' | 'MD5' | 'HMAC-SHA256'
  paySign: string
}

export interface ConfirmOrderResult extends WechatPaymentParams {
  orderId: number
}

// 创建订单并获取微信支付参数，接口路径保持服务端现有拼写。
export const confirmOrder = (data: ConfirmOrderInput) =>
  request<ConfirmOrderResult>({ method: 'POST', url: '/order/confrimOrder', data })

// 调用微信收银台，不在前端修改订单支付状态。
export const requestWechatPayment = (params: WechatPaymentParams) =>
  new Promise<void>((resolve, reject) => {
    const cart = useCartStore()
    const ownerId = cart.userId
    // 1. 原样传入服务端签名，将 packageValue 映射为微信要求的 package。
    wx.requestPayment({
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.packageValue,
      signType: params.signType,
      paySign: params.paySign,
      // 2. 支付成功后交由页面刷新服务端数据。
      success: () => {
        cart.clearCart(ownerId)
        resolve()
      },
      // 3. 将取消或失败信息交由页面统一提示。
      fail: reject,
    })
  })

export const getUserOrders = (data: {
  status: import('@/types/product-order').ProductOrderApiStatus | 'ALL'
  pageNum: number
  pageSize: number
}) =>
  request<import('@/types/product-order').UserProductOrderPage>({
    method: 'GET',
    url: '/order/user',
    data,
  })

/** 取消待付款订单，无请求体。 */
export const cancelOrder = (id: number) =>
  request<unknown>({
    method: 'PATCH' as UniApp.RequestOptions['method'],
    url: `/order/${id}/cancel`,
  })
/** 获取已有待付款订单的微信支付参数，不创建新订单。 */
export const payOrder = (id: number) =>
  request<ConfirmOrderResult>({
    method: 'POST',
    url: `/order/${id}/pay`,
  })
export const getUserOrderDetail = (id: number) =>
  request<import('@/types/product-order-detail').ProductOrderDetail>({
    method: 'GET',
    url: '/order/detail/' + id,
  })

/** 客户确认安装完成，无请求体。 */
export const confirmOrderCompletion = (id: number) =>
  request<null>({
    method: 'PATCH' as UniApp.RequestOptions['method'],
    url: '/order/' + id + '/confirm-completion',
  })

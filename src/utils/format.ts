/**
 * 隐藏手机号中间四位。
 */
export const maskMobile = (mobile?: string, fallback = '') => {
  if (!mobile) return fallback
  return mobile.length >= 7 ? `${mobile.slice(0, 3)}****${mobile.slice(-4)}` : mobile
}

/**
 * 将接口日期时间格式化为“YYYY-MM-DD HH:mm”。
 */
export const formatDateTime = (value?: string, fallback = '') => {
  if (!value) return fallback
  return value.replace('T', ' ').slice(0, 16)
}

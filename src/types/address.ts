/** 前端展示和选择使用的服务地址 */
export interface ServiceAddress {
  /** 地址 ID */
  id: number
  /** 联系人姓名 */
  name: string
  /** 联系电话 */
  phone: string
  /** 地区或位置名称 */
  locationName: string
  /** 详细地址 */
  address: string
  /** 门牌号 */
  doorplate: string
  /** 纬度 */
  latitude?: number
  /** 经度 */
  longitude?: number
}

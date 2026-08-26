/**
 * declare module '@vue/runtime-core'
 *   现调整为
 * declare module 'vue'
 */
import 'vue'
declare module 'vue' {
  /** 项目全局注册的 Vue 组件类型映射 */
  export interface GlobalComponents {
    // 在此处声明无需显式导入即可使用的全局组件。
  }
}

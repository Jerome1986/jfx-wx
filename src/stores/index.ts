import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

// 创建 pinia 实例
const pinia = createPinia()
// 使用持久化存储插件
pinia.use(
  createPersistedState({
    storage: {
      getItem: (key: string) => uni.getStorageSync(key) || null,
      setItem: (key: string, value: string) => uni.setStorageSync(key, value),
    },
  }),
)

// 默认导出，给 main.ts 使用
export default pinia

// 模块统一导出
export * from './modules/member'
export * from './modules/appointment-service'

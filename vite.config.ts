import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

import Components from '@uni-helper/vite-plugin-uni-components'
import { WotV2Resolver } from '@uni-helper/vite-plugin-uni-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // 开发阶段启用源码映射：https://uniapp.dcloud.net.cn/tutorial/migration-to-vue3.html#需主动开启-sourcemap
    sourcemap: process.env.NODE_ENV === 'development',
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api'],
        additionalData: `@use "styles/base" as *;`,
        includePaths: [resolve(__dirname, 'src')],
      },
    },
  },
  plugins: [
    // make sure put it before `Uni()`
    Components({
      resolvers: [WotV2Resolver()],
    }),
    uni(),
  ],
})

// vue-tsc 1.x uses plugin API v1; Vue - Official 2.x/3.x uses API v2.
// Both support the template compiler hook provided by uni-app-types.
const uniPlugin = require('@uni-helper/uni-app-types/volar-plugin')

module.exports = (context) => {
  const plugin = uniPlugin()
  return {
    ...plugin,
    version: 'checkUnknownComponents' in context.vueCompilerOptions ? 2 : 1,
  }
}

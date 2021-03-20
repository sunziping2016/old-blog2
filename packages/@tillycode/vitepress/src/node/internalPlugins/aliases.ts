import { VitepressPlugin } from '../plugin'

const aliasesPlugin: VitepressPlugin<never> = {
  name: '@internal/aliases',
  config() {
    return {
      resolve: {
        alias: [
          {
            find: /^vue$/,
            replacement: require.resolve(
              '@vue/runtime-dom/dist/runtime-dom.esm-bundler.js'
            )
          },
          {
            find: /^vue-router$/,
            replacement: require.resolve(
              'vue-router/dist/vue-router.esm-bundler.js'
            )
          }
        ]
      }
    }
  }
}

export default aliasesPlugin

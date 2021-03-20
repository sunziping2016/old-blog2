import { PluginApi, VitepressPluginOption } from '../plugin'

export const ENHANCE_APPS_ID = '@enhanceApps'
export const ENHANCE_APPS_REQUEST_PATH = '/' + ENHANCE_APPS_ID

export default function enhanceAppPlugin(
  this: PluginApi
): VitepressPluginOption {
  return {
    name: '@internal/enhance-app',
    config() {
      return {
        resolve: {
          alias: [
            {
              find: ENHANCE_APPS_ID,
              replacement: ENHANCE_APPS_REQUEST_PATH
            }
          ]
        }
      }
    },
    resolveId(id) {
      if (id === ENHANCE_APPS_REQUEST_PATH) {
        return ENHANCE_APPS_REQUEST_PATH
      }
    },
    load: (id) => {
      if (id === ENHANCE_APPS_REQUEST_PATH) {
        const enhanceApps = this.collectEnhanceAppFiles()
        return (
          enhanceApps
            .map((x, index) => `import enhanceApp${index} from "/@fs/${x}"\n`)
            .join('') +
          '\n' +
          'export default async function enhanceApps(app, router, siteData, isServer) {\n' +
          enhanceApps
            .map(
              (x, index) =>
                `  await enhanceApp${index}(app, router, siteData, isServer)\n`
            )
            .join('') +
          '}\n'
        )
      }
    }
  }
}

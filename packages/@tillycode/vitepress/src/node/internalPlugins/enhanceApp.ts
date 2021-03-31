import { PluginApi, VitepressPluginOption } from '../plugin'

export const ENHANCE_APPS_ID = '@enhanceApps'

export default function enhanceAppPlugin(
  this: PluginApi
): VitepressPluginOption {
  return {
    name: '@internal/enhance-app',
    resolveId(id) {
      if (id === ENHANCE_APPS_ID) {
        return id
      }
    },
    load: (id) => {
      if (id === ENHANCE_APPS_ID) {
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

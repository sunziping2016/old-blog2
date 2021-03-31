import { PluginApi, VitepressPluginOption } from '../plugin'

export const SITE_DATA_ID = '@siteData'

export default function siteDataPlugin(this: PluginApi): VitepressPluginOption {
  return {
    name: '@internal/site-data',
    resolveId(id) {
      if (id === SITE_DATA_ID) {
        return id
      }
    },
    load: (id) => {
      if (id === SITE_DATA_ID) {
        return `export default ${JSON.stringify(this.siteConfig.siteData)}`
      }
    }
  }
}

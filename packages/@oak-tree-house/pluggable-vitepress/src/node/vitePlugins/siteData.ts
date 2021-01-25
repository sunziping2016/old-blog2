import { Plugin } from 'vite'
import { SiteData } from '../../shared/types'

export const SITE_DATA_ID = '@siteData'
export const SITE_DATA_REQUEST_PATH = '/' + SITE_DATA_ID

export default function createSiteDataPlugin(siteData: SiteData): Plugin {
  return {
    name: 'siteData',
    config() {
      return {
        alias: [
          {
            find: SITE_DATA_ID,
            replacement: SITE_DATA_REQUEST_PATH
          }
        ]
      }
    },
    resolveId(id) {
      if (id === SITE_DATA_REQUEST_PATH) {
        return SITE_DATA_REQUEST_PATH
      }
    },
    load(id) {
      if (id === SITE_DATA_REQUEST_PATH) {
        return `export default ${JSON.stringify(siteData)}`
      }
    }
  }
}

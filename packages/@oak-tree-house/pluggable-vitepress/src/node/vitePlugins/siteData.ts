import { UserConfig } from '../config'
import { Plugin } from 'vite'
import { SiteData } from '../../shared/types'

export const SITE_DATA_ID = '@siteData'
export const SITE_DATA_REQUEST_PATH = '/' + SITE_DATA_ID

export default function createSiteDataPlugin(userConfig: UserConfig): Plugin {
  const siteData: SiteData = {
    title: userConfig.title || 'VitePress',
    description: userConfig.description || 'A VitePress site',
    base: userConfig.base ? userConfig.base.replace(/([^/])$/, '$1/') : '/'
  }
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

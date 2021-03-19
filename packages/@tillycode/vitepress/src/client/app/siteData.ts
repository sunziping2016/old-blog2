import initialSiteData from '@siteData'
import { Ref, ref } from 'vue'
// noinspection ES6PreferShortImport
import { SiteData } from '../../shared/types'

export const siteData: Ref<SiteData> = ref(initialSiteData)

export function useSiteData(): {
  siteData: Ref<SiteData>
  withBase: (path: string) => string
} {
  return {
    siteData,
    withBase: (path) => `${siteData.value.base}${path}`.replace(/\/+/g, '/')
  }
}

if (import.meta.hot) {
  import.meta.hot?.on('vitepress:siteData', ({ siteData: newSiteData }) => {
    siteData.value = newSiteData
  })
}

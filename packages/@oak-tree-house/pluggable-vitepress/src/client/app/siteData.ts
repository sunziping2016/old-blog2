import initialSiteData from '@siteData'
import { computed, Ref, ref } from 'vue'
// noinspection ES6PreferShortImport
import { SiteData } from '../../shared/types'

export const siteData: Ref<SiteData> = ref(initialSiteData)

export function useSiteData<T = never>(): {
  siteData: Ref<SiteData<T>>
  themeConfig: Ref<T | undefined>
  withBase: (path: string) => string
} {
  return {
    siteData,
    themeConfig: computed(() => siteData.value.themeConfig as T | undefined),
    withBase: (path) => `${siteData.value.base}${path}`.replace(/\/+/g, '/')
  }
}

if (import.meta.hot) {
  import.meta.hot?.on('vitepress:siteData', ({ siteData: newSiteData }) => {
    siteData.value = newSiteData
  })
}

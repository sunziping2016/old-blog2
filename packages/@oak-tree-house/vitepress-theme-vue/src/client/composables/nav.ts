import { computed, Ref } from 'vue'
import type { Config, NavItemWithChildren } from '../config'
import { useRoute } from 'vue-router'
import { useSiteData } from '@oak-tree-house/vitepress/dist/client/app/siteData'
import { inBrowser } from '@oak-tree-house/vitepress/dist/client/app/utils'

export function useLocaleLinks(): Ref<NavItemWithChildren | null> {
  const route = useRoute()
  const { siteData, themeConfig } = useSiteData<Config>()

  return computed(() => {
    const locales = themeConfig.value && themeConfig.value.locales

    if (!locales) {
      return null
    }

    const localeKeys = Object.keys(locales)

    if (localeKeys.length <= 1) {
      return null
    }

    // handle site base
    const siteBase = inBrowser ? siteData.value.base : '/'

    const siteBaseWithoutSuffix = siteBase.endsWith('/')
      ? siteBase.slice(0, -1)
      : siteBase

    // remove site base in browser env
    const routerPath = route.path.slice(siteBaseWithoutSuffix.length)

    const currentLangBase = localeKeys.find((key) => {
      return key === '/' ? false : routerPath.startsWith(key)
    })

    const currentContentPath = currentLangBase
      ? routerPath.substring(currentLangBase.length - 1)
      : routerPath

    const candidates = localeKeys.map((v) => {
      const localePath = v.endsWith('/') ? v.slice(0, -1) : v

      return {
        text: locales[v].label || '',
        link: `${localePath}${currentContentPath}`
      }
    })

    const currentLangKey = currentLangBase ? currentLangBase : '/'

    const selectText = locales[currentLangKey].selectText || 'Languages'

    return {
      text: selectText,
      items: candidates
    }
  })
}

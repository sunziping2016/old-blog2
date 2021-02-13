import { computed, Ref } from 'vue'
import { isArray, ensureStartingSlash, removeExtension } from '../utils'
import { getSideBarConfig, getFlatSideBarLinks } from '../support/sideBar'
import { useSiteData } from '@oak-tree-house/vitepress/dist/client/app/siteData'
import { Config, SideBarLink } from '../config'
import { usePageData } from '@oak-tree-house/vitepress/dist/client/app/pageData'

export function useNextAndPrevLinks(): {
  next: Ref<SideBarLink | undefined>
  prev: Ref<SideBarLink | undefined>
  hasLinks: Ref<boolean>
} {
  const { themeConfig } = useSiteData<Config>()
  const { pageData } = usePageData()

  const path = computed(() => {
    return (
      pageData.value &&
      removeExtension(ensureStartingSlash(pageData.value.relativePath))
    )
  })

  const candidates = computed(() => {
    if (
      themeConfig.value === undefined ||
      themeConfig.value.sidebar === undefined ||
      path.value === undefined
    ) {
      return []
    }
    const config = getSideBarConfig(themeConfig.value.sidebar, path.value)

    return isArray(config) ? getFlatSideBarLinks(config) : []
  })

  const index = computed(() => {
    return candidates.value.findIndex((item) => {
      return item.link === path.value
    })
  })

  const next = computed(() => {
    if (
      themeConfig.value &&
      themeConfig.value.nextLinks !== false &&
      index.value > -1 &&
      index.value < candidates.value.length - 1
    ) {
      return candidates.value[index.value + 1]
    }
    return undefined
  })

  const prev = computed(() => {
    if (
      themeConfig.value &&
      themeConfig.value.prevLinks !== false &&
      index.value > 0
    ) {
      return candidates.value[index.value - 1]
    }
    return undefined
  })

  const hasLinks = computed(() => !!next.value || !!prev.value)

  return {
    next,
    prev,
    hasLinks
  }
}

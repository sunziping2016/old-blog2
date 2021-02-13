import { computed, Ref } from 'vue'
import { getSideBarConfig } from '../support/sideBar'
import { Config, SideBarItem } from '../config'
import { usePageData } from '@oak-tree-house/vitepress/dist/client/app/pageData'
import { useSiteData } from '@oak-tree-house/vitepress/dist/client/app/siteData'
import { joinUrl, removeExtension } from '../utils'
import { useRoute } from 'vue-router'
import { useActiveSidebarLinks } from './activeSidebarLink'

export function useSideBar(): Ref<Array<SideBarItem>> {
  const { pageData, frontmatter } = usePageData()
  const { siteData, themeConfig } = useSiteData<Config>()
  const route = useRoute()

  useActiveSidebarLinks()

  return computed(() => {
    // at first, we'll check if we can find the sidebar setting in frontmatter.
    const frontSidebar = frontmatter.value && frontmatter.value.sidebar
    // if it's `false`, we'll just return an empty array here.
    if (frontSidebar === false) {
      return []
    }
    // if it's `auto`, render headers of the current page
    if (frontSidebar === 'auto') {
      return pageData.value === undefined
        ? []
        : [
            {
              text: pageData.value.title,
              link: joinUrl(
                siteData.value.base,
                removeExtension(pageData.value.relativePath)
              )
            }
          ]
    }
    // now, there's no sidebar setting at frontmatter; let's see the configs
    const themeSidebar =
      themeConfig.value === undefined || themeConfig.value.sidebar === undefined
        ? 'auto'
        : getSideBarConfig(themeConfig.value.sidebar, route.path)
    if (themeSidebar === false) {
      return []
    }
    if (themeSidebar === 'auto') {
      return pageData.value === undefined
        ? []
        : [
            {
              text: pageData.value.title,
              link: joinUrl(
                siteData.value.base,
                removeExtension(pageData.value.relativePath)
              )
            }
          ]
    }
    return themeSidebar
  })
}

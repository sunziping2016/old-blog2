import { computed, Ref } from 'vue'
import { useRoute } from 'vue-router'
import type { Config, NavItemWithLink } from '../config'
import { isExternal as isExternalCheck } from '../utils'
import { useSiteData } from '@oak-tree-house/vitepress/dist/client/app/siteData'

export function useNavLink(
  item: NavItemWithLink
): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Ref<Record<string, any>>
  href: string
  isExternal: boolean
} {
  const route = useRoute()
  const { withBase } = useSiteData<Config>()

  const isExternal = isExternalCheck(item.link)

  const props = computed(() => {
    const routePath = normalizePath(route.path)

    let active
    if (item.activeMatch) {
      active = new RegExp(item.activeMatch).test(routePath)
    } else {
      const itemPath = normalizePath(withBase(item.link))
      active =
        itemPath === '/'
          ? itemPath === routePath
          : routePath.startsWith(itemPath)
    }

    return {
      class: {
        active,
        isExternal
      },
      target: item.target || isExternal ? `_blank` : null,
      rel: item.rel || isExternal ? `noopener noreferrer` : null,
      'aria-label': item.ariaLabel
    }
  })

  return {
    props,
    href: isExternal ? item.link : withBase(item.link),
    isExternal
  }
}

function normalizePath(path: string): string {
  return path
    .replace(/#.*$/, '')
    .replace(/\?.*$/, '')
    .replace(/\.(html|md)$/, '')
    .replace(/\/index$/, '/')
}

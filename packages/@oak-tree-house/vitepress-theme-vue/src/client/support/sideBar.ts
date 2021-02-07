import type {
  SideBarConfig,
  MultiSideBarConfig,
  SideBarItem,
  SideBarGroup,
  SideBarLink
} from '../config'
import { isArray, ensureStartingSlash, removeExtension } from '../utils'

export function isSideBarConfig(
  sidebar: SideBarConfig | MultiSideBarConfig
): sidebar is SideBarConfig {
  return sidebar === false || sidebar === 'auto' || isArray(sidebar)
}

export function isSideBarGroup(item: SideBarItem): item is SideBarGroup {
  return (item as SideBarGroup).children !== undefined
}

/**
 * Get the `SideBarConfig` from sidebar option. This method will ensure to get
 * correct sidebar config from `MultiSideBarConfig` with various path
 * combinations such as matching `guide/` and `/guide/`. If no matching config
 * was found, it will return `auto` as a fallback.
 */
export function getSideBarConfig(
  sidebar: SideBarConfig | MultiSideBarConfig,
  path: string
): SideBarConfig {
  if (isSideBarConfig(sidebar)) {
    return sidebar
  }

  path = ensureStartingSlash(path)

  for (const dir of Object.keys(sidebar)) {
    // make sure the multi sidebar key starts with slash too
    if (path.startsWith(ensureStartingSlash(dir))) {
      return sidebar[dir]
    }
  }

  return 'auto'
}

/**
 * Get flat sidebar links from the sidebar items. This method is useful for
 * creating the "next and prev link" feature. It will ignore any items that
 * don't have `link` property and removes `.md` or `.html` extension if a
 * link contains it.
 */
export function getFlatSideBarLinks(sidebar: SideBarItem[]): SideBarLink[] {
  return sidebar.reduce<SideBarLink[]>((links, item) => {
    if (item.link) {
      links.push({ text: item.text, link: removeExtension(item.link) })
    }

    if (isSideBarGroup(item)) {
      links = [...links, ...getFlatSideBarLinks(item.children)]
    }

    return links
  }, [])
}

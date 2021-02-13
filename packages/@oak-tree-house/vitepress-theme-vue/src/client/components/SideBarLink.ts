import {
  computed,
  defineComponent,
  h,
  Ref,
  toRefs,
  VNode,
  resolveComponent
} from 'vue'
import { joinUrl, isActive } from '../utils'
import { useRoute } from 'vue-router'
import { useSiteData } from '@oak-tree-house/vitepress/dist/client/app/siteData'
import {
  useHeaders,
  HeaderWithChildren
} from '@oak-tree-house/vitepress/dist/client/app/page'
import type { Config, SideBarItem } from '../config'

const SideBarLink = defineComponent({
  name: 'SideBarLink',
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const { item } = toRefs(props) as {
      item: Ref<SideBarItem>
    }
    const route = useRoute()
    const { siteData } = useSiteData<Config>()
    const { headersWithChildren } = useHeaders()
    const text = computed(() => item.value.text)
    const link = computed(() =>
      resolveLink(siteData.value.base, item.value.link)
    )
    const children = computed(() =>
      'children' in item.value ? item.value.children : undefined
    )
    const active = computed(() => isActive(route, link.value))
    const routerLink = resolveComponent('router-link')

    return () => {
      return h('li', { class: 'sidebar-link' }, [
        h(
          link.value ? routerLink : 'p',
          {
            class: { 'sidebar-link-item': true, active: active.value },
            to: link.value
          },
          link.value ? () => text.value : text.value
        ),
        createChildren(active.value, children.value, headersWithChildren.value)
      ])
    }
  }
})

export default SideBarLink

function resolveLink(base: string, path?: string): string | undefined {
  if (path === undefined) {
    return path
  }
  // keep relative hash to the same page
  if (path.startsWith('#')) {
    return path
  }
  return joinUrl(base, path)
}

function createChildren(
  active: boolean,
  children?: SideBarItem[],
  headers?: HeaderWithChildren[]
): VNode | null {
  if (children && children.length > 0) {
    return h(
      'ul',
      { class: 'sidebar-links' },
      children.map((c) => {
        return h(SideBarLink, { item: c })
      })
    )
  }

  return active && headers ? createChildren(false, mapHeaders(headers)) : null
}

export function mapHeaders(headers: HeaderWithChildren[]): SideBarItem[] {
  return headers.map((header) => ({
    text: header.title,
    link: `#${header.slug}`,
    children: header.children ? mapHeaders(header.children) : undefined
  }))
}

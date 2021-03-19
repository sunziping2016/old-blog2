import {
  computed,
  defineAsyncComponent,
  defineComponent,
  h,
  Ref,
  ref,
  watch
} from 'vue'
import { inBrowser } from './utils'
import { useRoute } from 'vue-router'
import { siteData } from './siteData'

function pathToFile(path: string, isData?: boolean): string {
  if (import.meta.env.DEV) {
    path += `.md?t=${Date.now()}&${isData ? 'pageData' : 'content'}`
  } else if (inBrowser) {
    const base = import.meta.env.BASE_URL
    path = path.slice(base.length).replace(/\//g, '_') + '.md'
    const pageName = (isData ? 'page_data.' : 'page.') + path
    const pageHash = __VP_HASH_MAP__[pageName.toLowerCase()]
    path = `${base}assets/scripts/${pageName}.${pageHash}.js`
  } else {
    // ssr build uses much simpler name mapping
    path =
      `./${isData ? 'page_data' : 'page'}.` +
      `${path.slice(1).replace(/\//g, '_')}.md.js`
  }
  return path
}

const pageLoading: Ref<boolean> = ref(false)

export function usePage(): {
  hasPage: Ref<boolean>
  pageLoading: Ref<boolean>
  pageContentPath: Ref<string>
  pageDataPath: Ref<string>
  routePath: Ref<string>
} {
  const route = useRoute()
  const loadRoutePath = (): string =>
    route.path.endsWith('/') ? route.path.slice(0, -1) : route.path
  const routePath = ref(loadRoutePath())
  watch(route, () => {
    const newRoutePath = loadRoutePath()
    if (routePath.value !== newRoutePath) {
      routePath.value = newRoutePath
    }
  })
  const hasPage = computed(() => {
    // return siteData.value.pages.indexOf(routePath.value.slice(1) + '.md') !== -1
    return false
  })
  return {
    hasPage,
    pageLoading,
    pageContentPath: computed(() => pathToFile(routePath.value, false)),
    pageDataPath: computed(() => pathToFile(routePath.value, true)),
    routePath
  }
}
export const Content = defineComponent({
  name: 'Content',
  setup() {
    const { hasPage, pageContentPath, pageLoading } = usePage()
    return () =>
      h(
        !hasPage.value
          ? 'div'
          : inBrowser
          ? defineAsyncComponent(() => {
              pageLoading.value = true
              return import(/* @vite-ignore */ pageContentPath.value).then(
                (data) => {
                  setTimeout(() => {
                    pageLoading.value = false
                    if (location.hash) {
                      const oldHash = location.hash
                      location.hash = ''
                      setTimeout(() => {
                        location.hash = oldHash
                      })
                    }
                  })
                  return data
                }
              )
            })
          : // eslint-disable-next-line @typescript-eslint/no-var-requires
            require(pageContentPath.value).default
      )
  }
})

export interface Header {
  level: number
  title: string
  slug: string
}

export interface HeaderWithChildren extends Header {
  children?: HeaderWithChildren[]
}

export function useHeaders(
  levels?: string[]
): {
  headers: Ref<Array<Header>>
  headersWithChildren: Ref<Array<HeaderWithChildren>>
} {
  const { pageLoading } = usePage()
  const normalizedLevels = levels || ['h2', 'h3']
  const selector = normalizedLevels
    .map((level) => `.content ${level}`)
    .join(', ')
  const headers = ref<Header[]>([])
  function reloadHeaders() {
    if (!pageLoading.value && inBrowser) {
      const nodes = document.querySelectorAll(
        selector
      ) as NodeListOf<HTMLElement>
      headers.value = Array.from(nodes).map((node) => ({
        level: parseInt(node.tagName.slice(1), 10),
        // Slice out the anchor
        title: node.innerText.slice(2),
        slug: node.id
      }))
    }
  }
  watch(pageLoading, reloadHeaders)
  reloadHeaders()
  const { routePath } = usePage()
  watch(routePath, () => {
    headers.value = []
  })
  return {
    headers,
    headersWithChildren: computed(() => groupHeaders(headers.value))
  }
}

function groupHeaders(headers: Header[]): HeaderWithChildren[] {
  const stack: HeaderWithChildren[] = [
    {
      level: 1,
      title: '',
      slug: ''
    }
  ]
  for (const header of headers) {
    if (header.level > 1 && header.level <= stack.length + 1) {
      const parent = stack[header.level - 2]
      const child: HeaderWithChildren = {
        ...header
      }
      parent.children = parent.children || []
      parent.children.push(child)
      stack[header.level - 1] = child
    }
  }
  return stack[0].children || []
}

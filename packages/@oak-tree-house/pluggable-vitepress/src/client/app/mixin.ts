import { defineComponent, ComponentOptions, h } from 'vue'
import { inBrowser } from './utils'
import { useRoute } from 'vue-router'

function pathToFile(path: string): string {
  path = path.replace(/\.html$/, '')
  if (path.endsWith('/')) {
    path += `index`
  }
  if (import.meta.env.DEV) {
    path += `.md?t=${Date.now()}&content`
  } else {
    if (inBrowser) {
      const base = import.meta.env.BASE_URL
      path = path.slice(base.length).replace(/\//g, '_') + '.md'
      const pageHash = __VP_HASH_MAP__['page.' + path.toLowerCase()]
      path = `${base}assets/scripts/page.${path}.${pageHash}.js`
    } else {
      // ssr build uses much simpler name mapping
      path = `./page.${path.slice(1).replace(/\//g, '_')}.md.js`
    }
  }
  return path
}

export function loadPageModule(
  path: string
): ComponentOptions | Promise<ComponentOptions> {
  const pageFilePath = pathToFile(path)
  if (inBrowser) {
    return import(/* @vite-ignore */ pageFilePath).then(
      (result) => result.default
    )
  }
  // eslint-disable-next-line
  return require(pageFilePath).default
}

export const Content = defineComponent({
  name: 'Content',
  async setup() {
    const route = useRoute()
    const component = await loadPageModule(route.path)
    return () => h(component)
  }
})

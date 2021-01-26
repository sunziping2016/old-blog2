import { defineComponent, ComponentOptions, h, defineAsyncComponent } from 'vue'
import { inBrowser } from './utils'
import { useRoute } from 'vue-router'

function pathToFile(path: string): string {
  path = path.replace(/\.html$/, '')
  if (path.endsWith('/')) {
    path += `index`
  }
  if (import.meta.env.DEV) {
    path += `.md?t=${Date.now()}&content`
  } else if (inBrowser) {
    const base = import.meta.env.BASE_URL
    path = path.slice(base.length).replace(/\//g, '_') + '.md'
    const pageName = 'page.' + path
    const pageHash = __VP_HASH_MAP__[pageName.toLowerCase()]
    path = `${base}assets/scripts/${pageName}.${pageHash}.js`
  } else {
    // ssr build uses much simpler name mapping
    path = `./page.${path.slice(1).replace(/\//g, '_')}.md.js`
  }
  return path
}

export function loadPageModule(
  path: string
): ComponentOptions | Promise<ComponentOptions> {
  const pageFilePath = pathToFile(path)
  if (inBrowser) {
    return defineAsyncComponent(() => import(/* @vite-ignore */ pageFilePath))
  }
  // eslint-disable-next-line
  return require(pageFilePath).default
}

export const Content = defineComponent({
  name: 'Content',
  setup() {
    const route = useRoute()
    return () => h(loadPageModule(route.path))
  }
})

import { defineComponent, defineAsyncComponent, h, Component } from 'vue'
import { inBrowser } from './utils'

function pathToFile(path: string): string {
  path = path.replace(/\.html$/, '')
  if (path.endsWith('/')) {
    path += `index`
  }
  path += `.md?t=${Date.now()}`
  return path
}

function loadPageModule(path: string): Component | Promise<Component> {
  const pageFilePath = pathToFile(path)
  if (inBrowser) {
    return defineAsyncComponent(() => import(/* @vite-ignore */ pageFilePath))
  }
  return require(pageFilePath)
}

export const Content = defineComponent({
  name: 'Content',
  setup() {
    return () => h(loadPageModule(location.pathname))
  }
})

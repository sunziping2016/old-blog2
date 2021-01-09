import { Component, InjectionKey } from 'vue'
import {
  createRouter,
  createWebHistory,
  Router,
  RouteRecordRaw
} from 'vue-router'
import { store } from './store'
import { inBrowser } from './utils'

function pathToFile(path: string): string {
  let pagePath = path.replace(/\.html$/, '')
  if (pagePath.endsWith('/')) {
    pagePath += 'index'
  }
  if (import.meta.env.DEV) {
    pagePath += `.md?t=${Date.now()}`
  } else {
    if (inBrowser) {
      const base = import.meta.env.BASE_URL
      pagePath = pagePath.slice(base.length).replace(/\//g, '_') + '.md'
      const pageHash = __OAK_HASH_MAP__[pagePath]
      pagePath = `${base}assets/${pagePath}.${pageHash}.js`
    } else {
      pagePath = `./${pagePath.slice(1).replace(/\//g, '_')}.md.js`
    }
  }
  return pagePath
}

function loadPageModule(path: string): Component | Promise<Component> {
  const pageFilePath = pathToFile(path)
  if (inBrowser) {
    return import(/* @vite-ignore */ pageFilePath)
  }
  return require(pageFilePath)
}

const routes: RouteRecordRaw[] = [
  {
    path: '/:pathMatch(.*)*',
    component: () => loadPageModule(location.pathname) // TODO: base?
  }
]

export const routerKey: InjectionKey<Router> = Symbol()

export const router = createRouter({
  history: createWebHistory(store.state.siteData.base),
  routes
})

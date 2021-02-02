import {
  createMemoryHistory,
  createRouter as baseCreateRouter,
  createWebHistory,
  Router
} from 'vue-router'
import { inBrowser } from './utils'
import { siteData } from './siteData'
import { watch } from 'vue'
import Layout from '@theme/Layout'
import NotFound from '@theme/NotFound'

export default function createRouter(base: string): Router {
  const router = baseCreateRouter({
    history: inBrowser ? createWebHistory(base) : createMemoryHistory(base),
    routes: []
  })

  router.addRoute({
    name: '404',
    path: '/404',
    component: NotFound
  })
  router.addRoute({
    path: '/:pathMatch(.*)*',
    redirect: { name: '404' }
  })
  function reloadRoutes() {
    router
      .getRoutes()
      .filter(
        (route) =>
          typeof route.name === 'string' && route.name.startsWith('page:')
      )
      .forEach((route) => route.name && router.removeRoute(route.name))
    siteData.value.pages.forEach((page) => {
      router.addRoute({
        name: `page:${page}`,
        path: `/${page.slice(0, -3)}`,
        component: Layout
      })
    })
  }

  reloadRoutes()
  if (import.meta.env.DEV) {
    watch(siteData, reloadRoutes)
  }

  return router
}

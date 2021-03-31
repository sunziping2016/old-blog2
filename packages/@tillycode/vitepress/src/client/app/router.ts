import {
  createMemoryHistory,
  createRouter as baseCreateRouter,
  createWebHistory,
  Router
} from 'vue-router'
import { inBrowser } from './utils'
import NotFound from '@layout/NotFound'
import routerData from '@routerData'
import { watch } from 'vue'
import { ResolvedRouterSettings, RouterSettings } from '@types'

export default function createRouter(base: string): Router {
  const router = baseCreateRouter({
    history: inBrowser ? createWebHistory(base) : createMemoryHistory(base),
    routes: [],
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      } else if (to.hash) {
        return {
          el: decodeURIComponent(to.hash)
        }
      } else {
        return { left: 0, top: 0 }
      }
    }
  })

  function addPage(id: string, settings: ResolvedRouterSettings): void {
    router.addRoute({
      name: `${id}@0`,
      path: settings.routerPath,
      component: settings.resolvedLayout,
      meta: settings.meta,
      alias: (settings.extraRouterPaths || [])
        .filter((path) => path.type === 'alias')
        .map((path) => path.path)
    })
    ;(settings.extraRouterPaths || [])
      .filter((path) => path.type === 'redirect')
      .forEach((path, index) => {
        router.addRoute({
          name: `${id}@${index}`,
          path: path.path,
          redirect: settings.routerPath
        })
      })
  }

  for (const [id, settings] of Object.entries(routerData.value)) {
    addPage(id, settings)
  }

  router.addRoute({
    name: '404@0',
    path: '/404',
    component: NotFound,
    alias: '/:pathMatch(.*)*'
  })

  if (import.meta.hot) {
    // eslint-disable-next-line no-inner-declarations
    function removePage(id: string): void {
      let i = 0
      while (router.hasRoute(`${id}@${i}`)) {
        router.removeRoute(`${id}@${i}`)
        ++i
      }
    }

    watch(
      routerData,
      (newRouterData, oldRouterData) => {
        const newIds: Set<string> = new Set<string>(Object.keys(newRouterData))
        const oldIds: Set<string> = new Set<string>(Object.keys(oldRouterData))
        const currentId =
          typeof router.currentRoute.value.name === 'string'
            ? router.currentRoute.value.name.split('@', 2)[0]
            : null
        let affected = false
        // Removed items
        for (const id of [...oldIds].filter((id) => !newIds.has(id))) {
          removePage(id)
          affected ||= id === currentId
        }
        // Added items
        for (const id of [...newIds].filter((id) => !oldIds.has(id))) {
          addPage(id, newRouterData[id])
          affected ||= id === currentId
        }
        // Updated items
        for (const id of [...newIds].filter((id) => oldIds.has(id))) {
          const newSettings = Object.assign(
            {},
            newRouterData[id]
          ) as RouterSettings
          const oldSettings = Object.assign(
            {},
            oldRouterData[id]
          ) as RouterSettings
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          delete newSettings.resolvedLayout
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          delete oldSettings.resolvedLayout
          if (JSON.stringify(newSettings) !== JSON.stringify(oldSettings)) {
            removePage(id)
            addPage(id, newRouterData[id])
            affected ||= id === currentId
          }
        }
        // Reload
        if (affected || currentId === '404') {
          router.go(0)
        }
      },
      {
        deep: true
      }
    )
  }

  return router
}

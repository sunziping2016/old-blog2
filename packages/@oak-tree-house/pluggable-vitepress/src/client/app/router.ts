import {
  createMemoryHistory,
  createRouter as baseCreateRouter,
  createWebHistory,
  Router
} from 'vue-router'
import { Content } from './mixin'
import { inBrowser } from './utils'

export default function createRouter(base: string): Router {
  const router = baseCreateRouter({
    history: inBrowser ? createWebHistory(base) : createMemoryHistory(base),
    routes: []
  })

  router.addRoute({
    name: 'page',
    path: '/:pathMatch(.*)*',
    component: Content // TODO: base?
  })

  return router
}

import {
  createRouter as baseCreateRouter,
  createWebHistory,
  Router
} from 'vue-router'
import { Content } from './mixin'

export default function createRouter(base: string): Router {
  const router = baseCreateRouter({
    history: createWebHistory(base),
    routes: []
  })

  router.addRoute({
    name: 'default',
    path: '/:pathMatch(.*)*',
    component: Content // TODO: base?
  })

  return router
}

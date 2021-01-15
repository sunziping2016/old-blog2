import { App } from 'vue'
import { Router } from 'vue-router'
import blogData from '@blogData'
import IndexPost from './IndexPost.vue'

export default function enhanceApps(app: App, router: Router): void {
  const defaultRoute = router
    .getRoutes()
    .find((route) => route.name === 'default')
  if (defaultRoute !== undefined && defaultRoute.name !== undefined) {
    router.removeRoute(defaultRoute.name)
  }
  if (Object.keys(blogData).length) {
    for (const [id, data] of Object.entries(blogData)) {
      if (data.keys === undefined) {
        router.addRoute({
          name: `${id}-first`,
          path: data.path,
          component: IndexPost,
          meta: {
            id,
            key: 'all'
          }
        })
        if (data.values.all.totalPages > 1) {
          router.addRoute({
            name: `${id}-rest`,
            path: data.path + 'page/:page/',
            component: IndexPost,
            meta: {
              id,
              key: 'all'
            }
          })
        }
      } else {
        // TODO
      }
    }
  }
  if (defaultRoute !== undefined) {
    router.addRoute(defaultRoute)
  }
}

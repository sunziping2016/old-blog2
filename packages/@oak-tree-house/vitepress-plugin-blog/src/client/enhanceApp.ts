import { App } from 'vue'
import { Router } from 'vue-router'
import blogData from '@blogData'
import IndexPost from '@blog/post'
import IndexKey from '@blog/key'

export default function enhanceApps(app: App, router: Router): void {
  const defaultRoute = router.getRoutes().find((route) => route.name === 'page')
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
          props: () => ({ blogId: id, blogKey: 'all' })
        })
        router.addRoute({
          name: `${id}-rest`,
          path: data.path + 'page/:page/',
          component: IndexPost,
          props: (route) => ({
            blogId: id,
            blogKey: 'all',
            blogPage: parseInt((route.params.page as string) || '1', 10) - 1
          })
        })
      } else {
        router.addRoute({
          name: `${id}-key`,
          path: data.path,
          component: IndexKey,
          props: () => ({ blogId: id })
        })
        router.addRoute({
          name: `${id}-first`,
          path: data.path + ':key/',
          component: IndexPost,
          props: (route) => ({ blogId: id, blogKey: route.params.key })
        })
        router.addRoute({
          name: `${id}-rest`,
          path: data.path + ':key/page/:page/',
          component: IndexPost,
          props: (route) => ({
            blogId: id,
            blogKey: route.params.key,
            blogPage: parseInt((route.params.page as string) || '1', 10) - 1
          })
        })
      }
    }
  }
  if (defaultRoute !== undefined) {
    router.addRoute(defaultRoute)
  }
}

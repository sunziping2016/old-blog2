import { App } from 'vue'
import { Router } from 'vue-router'
import blogData from '@blogData'

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
          component: () => import(/* @vite-ignore */ `/@blog/${id}/post`),
          props: () => ({ blogId: id, blogKey: 'all' })
        })
        router.addRoute({
          name: `${id}-rest`,
          path: data.path + 'page/:page/',
          component: () => import(/* @vite-ignore */ `/@blog/${id}/post`),
          props: (route) => ({
            blogId: id,
            blogKey: 'all',
            blogPage: parseInt((route.params.page as string) || '0', 10)
          })
        })
      } else {
        router.addRoute({
          name: `${id}-key`,
          path: data.path,
          component: () => import(/* @vite-ignore */ `/@blog/${id}/key`),
          props: () => ({ blogId: id })
        })
        router.addRoute({
          name: `${id}-first`,
          path: data.path + ':key/',
          component: () => import(/* @vite-ignore */ `/@blog/${id}/post`),
          props: (route) => ({ blogId: id, blogKey: route.params.key })
        })
        router.addRoute({
          name: `${id}-rest`,
          path: data.path + ':key/page/:page/',
          component: () => import(/* @vite-ignore */ `/@blog/${id}/post`),
          props: (route) => ({
            blogId: id,
            blogKey: route.params.key,
            blogPage: parseInt((route.params.page as string) || '0', 10)
          })
        })
      }
    }
  }
  if (defaultRoute !== undefined) {
    router.addRoute(defaultRoute)
  }
}

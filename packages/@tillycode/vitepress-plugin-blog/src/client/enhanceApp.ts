import { App } from 'vue'
import { Router } from 'vue-router'
import blogData from '@blogData'
import IndexPost from '@theme/IndexPost'
import IndexKey from '@theme/IndexKey'

export default function enhanceApps(app: App, router: Router): void {
  if (Object.keys(blogData).length) {
    for (const [id, data] of Object.entries(blogData)) {
      if (data.keys === undefined) {
        router.addRoute({
          name: `blog:${id}-first`,
          path: data.path,
          component: IndexPost,
          props: () => ({ blogId: id, blogKey: 'all' })
        })
        router.addRoute({
          name: `blog:${id}-rest`,
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
          name: `blog:${id}-key`,
          path: data.path,
          component: IndexKey,
          props: () => ({ blogId: id })
        })
        router.addRoute({
          name: `blog:${id}-first`,
          path: data.path + ':key/',
          component: IndexPost,
          props: (route) => ({ blogId: id, blogKey: route.params.key })
        })
        router.addRoute({
          name: `blog:${id}-rest`,
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
}

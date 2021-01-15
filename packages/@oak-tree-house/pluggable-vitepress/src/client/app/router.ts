import { InjectionKey } from 'vue'
import { createRouter, createWebHistory, Router } from 'vue-router'
import { store } from './store'
import { Content } from './mixin'
import blogData from '@blogData'
import Theme from '/@theme/index'

// TODO: compose them
export interface BlogDataItem {
  path: string
  title: string
  dirname?: string
  keys?: string[]
  lengthPerPage: number
  values: Record<
    string,
    {
      totalItems: number
      totalPages: number
    }
  >
}

export type BlogData = Record<string, BlogDataItem>

export const routerKey: InjectionKey<Router> = Symbol()

export const router = createRouter({
  history: createWebHistory(store.state.siteData.base),
  routes: []
})

function addContentRoute() {
  router.addRoute({
    name: 'content',
    path: '/:pathMatch(.*)*',
    component: Content // TODO: base?
  })
}

// function removeContentRoute() {
//   router.removeRoute('fallback')
// }

function addBlogRoute(blogData: BlogData) {
  if (Object.keys(blogData).length) {
    for (const [id, data] of Object.entries(blogData)) {
      if (data.keys === undefined) {
        router.addRoute({
          name: `${id}-first`,
          path: data.path,
          component: Theme.IndexPost,
          meta: {
            id,
            key: 'all'
          }
        })
        if (data.values.all.totalPages > 1) {
          router.addRoute({
            name: `${id}-rest`,
            path: data.path + 'page/:page/',
            component: Theme.IndexPost,
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
}

addBlogRoute(blogData)
addContentRoute()

if (import.meta.hot) {
  import.meta.hot?.on('plugin-blog:blogData', (data) => {
    console.log('blogData', data.blogData)
  })
}

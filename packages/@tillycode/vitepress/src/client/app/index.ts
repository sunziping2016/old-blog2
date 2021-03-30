import 'vite/dynamic-import-polyfill'

import pageData from '@md/data/md._posts_2020-02-18-xiaomi-notebook-config'
import excerpt from '@md/excerpt/md._posts_2020-02-18-xiaomi-notebook-config'
import content from '@md/content/md._posts_2020-02-18-xiaomi-notebook-config'
import { App, createApp as createClientApp, createSSRApp, h, watch } from 'vue'
// import { siteData } from './siteData'
// import createRouter from './router'
// import { Content } from './page'
// import enhanceApps from '@enhanceApps'
// import GlobalLayout from '@theme/GlobalLayout'
import { inBrowser } from './utils'
import routerData from '@routerData'
// import { Router } from 'vue-router'
//

watch(routerData, () => console.log(routerData.value), {
  deep: true
})

function newApp(): App {
  const app = {
    name: 'OakApp',
    setup() {
      return () =>
        h('div', [
          h('h1', 'PageData'),
          h('h2', pageData.value.title),
          h('h1', 'excerpt'),
          h(excerpt),
          h('h1', 'content'),
          h(content)
        ])
    }
  }
  return import.meta.env.PROD ? createSSRApp(app) : createClientApp(app)
}

// avoid uncaught ReferenceError: process is not defined
void import.meta.hot

export function createApp(): Promise<{ app: App }> {
  const app = newApp()
  return Promise.resolve().then(() => ({ app }))
  // app.component('Content', Content)
  // const router = createRouter(siteData.value.base)
  // return enhanceApps(app, router, siteData, import.meta.env.PROD).then(() => {
  //   app.use(router)
  //   return { app, router }
  // })
}

if (inBrowser) {
  createApp().then(({ app }) => {
    // router.isReady().then(() => {
    app.mount('#app')
    // })
  })
}

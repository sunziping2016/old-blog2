import 'vite/dynamic-import-polyfill'

import { App, createApp as createClientApp, createSSRApp, h } from 'vue'
import { Router } from 'vue-router'
import GlobalLayout from '@layout/GlobalLayout'
import Content from '@layout/Content'
import siteData from '@siteData'
import enhanceApps from '@enhanceApps'
import createRouter from './router'
import { inBrowser } from './utils'

function newApp(): App {
  const app = {
    name: 'OakApp',
    setup() {
      return () => h(GlobalLayout)
    }
  }
  return import.meta.env.PROD ? createSSRApp(app) : createClientApp(app)
}

// avoid uncaught ReferenceError: process is not defined
void import.meta.hot

export function createApp(): Promise<{ app: App; router: Router }> {
  const app = newApp()
  app.component('Content', Content)
  const router = createRouter(siteData.base)
  return enhanceApps(app, router, siteData, import.meta.env.PROD).then(() => {
    app.use(router)
    return { app, router }
  })
}

if (inBrowser) {
  createApp().then(({ app, router }) => {
    router.isReady().then(() => {
      app.mount('#app')
    })
  })
}

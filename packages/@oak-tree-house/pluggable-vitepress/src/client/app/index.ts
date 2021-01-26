import 'vite/dynamic-import-polyfill'
import {
  App,
  createApp as createClientApp,
  createSSRApp,
  h,
  readonly
} from 'vue'
import siteData from '@siteData'
import createRouter from './router'
import { Content } from './mixin'
import enhanceApps from '@enhanceApps'
import Theme from '@theme/index'
import { inBrowser } from './utils'
import { Router } from 'vue-router'

function newApp(): App {
  const app = {
    name: 'OakApp',
    setup() {
      return () => h(Theme.Layout)
    }
  }
  return import.meta.env.PROD ? createSSRApp(app) : createClientApp(app)
}

void import.meta.hot

export function createApp(): Promise<{ app: App; router: Router }> {
  const app = newApp()
  Object.defineProperty(app.config.globalProperties, '$site', {
    get: () => readonly(siteData)
  })
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
      app.mount('#app', true)
    })
  })
}

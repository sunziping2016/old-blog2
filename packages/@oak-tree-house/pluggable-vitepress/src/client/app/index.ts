import 'vite/dynamic-import-polyfill'
import { App, createApp, createSSRApp, h, readonly } from 'vue'
import siteData from '@siteData'
import createRouter from './router'
import { Content } from './mixin'
import enhanceApps from '@enhanceApps'
import Theme from '@theme/index'

function newApp(): App {
  const app = {
    name: 'OakApp',
    setup() {
      return () => h(Theme.Layout)
    }
  }
  return import.meta.env.PROD ? createSSRApp(app) : createApp(app)
}

void import.meta.hot

const app = newApp()
Object.defineProperty(app.config.globalProperties, '$site', {
  get: () => readonly(siteData)
})
app.component('Content', Content)
const router = createRouter(siteData.base)
enhanceApps(app, router, siteData, import.meta.env.PROD).then(() => {
  app.use(router)
  app.mount('#app')
})

// eslint-disable-next-line
;(window as any).router = router

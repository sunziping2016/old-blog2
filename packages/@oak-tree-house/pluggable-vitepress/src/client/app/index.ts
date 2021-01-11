import 'vite/dynamic-import-polyfill'
import { App, createApp, createSSRApp, h } from 'vue'
import { store, storeKey } from './store'
import { router } from './router'
import { Content } from './mixin'
import Theme from '/@theme/index'

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
app.use(store, storeKey)
app.use(router)
app.component('Content', Content)
app.mount('#app')

import 'vite/dynamic-import-polyfill'
import { App, createApp, createSSRApp, h } from 'vue'
import { store, storeKey } from './store'
import Theme from '/@theme/index'
import { Content } from './mixin';
import { router } from './router';

function newApp(): App {
  const app = {
    name: 'OakApp',
    setup() {
      return () => h(Theme.Layout)
    }
  }

  return import.meta.env.PROD
    ? createSSRApp(app)
    : createApp(app)
}

const app = newApp()
app.use(store, storeKey)
app.use(router)
app.component('Content', Content)
app.mount('#app')

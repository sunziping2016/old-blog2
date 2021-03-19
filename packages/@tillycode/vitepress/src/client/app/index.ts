import 'vite/dynamic-import-polyfill'
// import {
//   App,
//   createApp as createClientApp,
//   createSSRApp,
//   h,
//   readonly
// } from 'vue'
// import { siteData } from './siteData'
// import createRouter from './router'
// import { Content } from './page'
// import enhanceApps from '@enhanceApps'
// import GlobalLayout from '@theme/GlobalLayout'
// import { inBrowser } from './utils'
// import { Router } from 'vue-router'
//
// function newApp(): App {
//   const app = {
//     name: 'OakApp',
//     setup() {
//       return () => h(GlobalLayout)
//     }
//   }
//   return import.meta.env.PROD ? createSSRApp(app) : createClientApp(app)
// }
//
// // avoid uncaught ReferenceError: process is not defined
// void import.meta.hot
//
// export function createApp(): Promise<{ app: App; router: Router }> {
//   const app = newApp()
//   Object.defineProperty(app.config.globalProperties, '$site', {
//     get: () => readonly(siteData)
//   })
//   app.component('Content', Content)
//   const router = createRouter(siteData.value.base)
//   return enhanceApps(app, router, siteData, import.meta.env.PROD).then(() => {
//     app.use(router)
//     return { app, router }
//   })
// }
//
// if (inBrowser) {
//   createApp().then(({ app, router }) => {
//     router.isReady().then(() => {
//       app.mount('#app')
//     })
//   })
// }

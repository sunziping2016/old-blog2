// import { Plugin } from 'vite'
// import { SiteData } from '../../shared/types'
// import path from 'path'
// import { debounce } from '../utils'
//
// export const SITE_DATA_ID = '@siteData'
// export const SITE_DATA_REQUEST_PATH = '/' + SITE_DATA_ID
//
// export default function createSiteDataPlugin(
//   siteData: SiteData,
//   root: string
// ): Plugin {
//   return {
//     name: 'siteData',
//     config() {
//       return {
//         alias: [
//           {
//             find: SITE_DATA_ID,
//             replacement: SITE_DATA_REQUEST_PATH
//           }
//         ]
//       }
//     },
//     async configureServer(server) {
//       const handleHotUpdate = debounce((): void => {
//         server.ws.send({
//           type: 'custom',
//           event: 'vitepress:siteData',
//           data: {
//             siteData
//           }
//         })
//       }, 200)
//       server.watcher.on('add', (file) => {
//         if (!file.endsWith('.md')) {
//           return
//         }
//         file = path.relative(root, file)
//         if (siteData.pages.indexOf(file) == -1) {
//           siteData.pages.push(file)
//           handleHotUpdate()
//         }
//       })
//       server.watcher.on('unlink', (file) => {
//         if (!file.endsWith('.md')) {
//           return
//         }
//         file = path.relative(root, file)
//         const index = siteData.pages.indexOf(file)
//         if (index != -1) {
//           siteData.pages.splice(index, 1)
//           handleHotUpdate()
//         }
//       })
//     },
//     resolveId(id) {
//       if (id === SITE_DATA_REQUEST_PATH) {
//         return SITE_DATA_REQUEST_PATH
//       }
//     },
//     load(id) {
//       if (id === SITE_DATA_REQUEST_PATH) {
//         return `export default ${JSON.stringify(siteData)}`
//       }
//     }
//   }
// }

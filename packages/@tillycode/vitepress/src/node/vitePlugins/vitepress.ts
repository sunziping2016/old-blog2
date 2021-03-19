import { Plugin, ViteDevServer } from 'vite'
import path from 'path'
import fs from 'fs-extra'
// import { ThemeApi } from '../theme'

export const APP_PATH = path.join(__dirname, '../../client/app')

export const DEFAULT_THEME_PATH = path.join(
  __dirname,
  '../../client/theme-default'
)
const THEME_RE = /^\/@theme\/(.+)/

// export default function createVitepressPlugin(theme: ThemeApi): Plugin {
//   return {
//     name: 'vitepress',
//     config() {
//       return {
//         alias: [
//           {
//             find: /^@theme\/(.+)/,
//             replacement: '/@theme/$1'
//           },
//           {
//             find: /^vue$/,
//             replacement: require.resolve(
//               '@vue/runtime-dom/dist/runtime-dom.esm-bundler.js'
//             )
//           },
//           {
//             find: /^vue-router$/,
//             replacement: require.resolve(
//               'vue-router/dist/vue-router.esm-bundler.js'
//             )
//           }
//         ]
//       }
//     },
//     async resolveId(id) {
//       const m = id.match(THEME_RE)
//       if (m) {
//         if (theme.queryView(m[1]) !== undefined) {
//           return id
//         } else if (
//           await fs.pathExists(path.resolve(DEFAULT_THEME_PATH, m[1] + '.vue'))
//         ) {
//           return id
//         }
//       }
//     },
//     async load(id) {
//       const m = id.match(THEME_RE)
//       if (m) {
//         let view: string | undefined = theme.queryView(m[1])
//         if (view === undefined) {
//           const testView = path.resolve(DEFAULT_THEME_PATH, m[1] + '.vue')
//           if (await fs.pathExists(testView)) {
//             view = testView
//           }
//         }
//         if (view !== undefined) {
//           return `export { default } from "/@fs/${view}"\n`
//         }
//       }
//     },
//     configureServer(server: ViteDevServer) {
//       return () => {
//         server.middlewares.use((req, res, next) => {
//           if (req.url && req.url.endsWith('.html')) {
//             res.statusCode = 200
//             res.end(HTML_TEMPLATE)
//             return
//           }
//           next()
//         })
//       }
//     }
//   }
// }

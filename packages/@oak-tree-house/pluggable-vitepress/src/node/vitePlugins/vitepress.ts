import { Plugin, ViteDevServer } from 'vite'
import path from 'path'
import fs from 'fs-extra'
import { UserConfig } from '../config'

export const APP_PATH = path.join(__dirname, '../../client/app')

const DEFAULT_THEME_PATH = path.join(__dirname, '../../client/theme-default')
const THEME_RE = /^\/@theme\/(.+)/

export const HTML_TEMPLATE = `\
<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title></title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/@fs/${APP_PATH}/index.js"></script>
  </body>
</html>
`

export default function createVitepressPlugin(userConfig: UserConfig): Plugin {
  return {
    name: 'vitepress',
    config() {
      return {
        alias: [
          {
            find: /^@theme\/(.+)/,
            replacement: '/@theme/$1'
          },
          {
            find: /^vue$/,
            replacement: require.resolve(
              '@vue/runtime-dom/dist/runtime-dom.esm-bundler.js'
            )
          }
        ]
      }
    },
    async resolveId(id) {
      const m = id.match(THEME_RE)
      if (m) {
        if (userConfig.theme && userConfig.theme[m[1]] !== undefined) {
          return id
        } else if (
          await fs.pathExists(path.resolve(DEFAULT_THEME_PATH, m[1] + '.vue'))
        ) {
          return id
        }
      }
    },
    async load(id) {
      const m = id.match(THEME_RE)
      if (m) {
        let component: string | undefined = undefined
        if (userConfig.theme && userConfig.theme[m[1]] !== undefined) {
          component = userConfig.theme[m[1]]
        } else {
          const testComponent = path.resolve(DEFAULT_THEME_PATH, m[1] + '.vue')
          if (await fs.pathExists(testComponent)) {
            component = testComponent
          }
        }
        if (component !== undefined) {
          return `export { default } from "/@fs/${component}"\n`
        }
      }
    },
    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.endsWith('.html')) {
            res.statusCode = 200
            res.end(HTML_TEMPLATE)
            return
          }
          next()
        })
      }
    }
  }
}

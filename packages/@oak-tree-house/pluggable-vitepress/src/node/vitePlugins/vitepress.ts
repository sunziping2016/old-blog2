import { Plugin, ViteDevServer } from 'vite'
import path from 'path'

export const APP_PATH = path.join(__dirname, '../../client/app')

export const DEFAULT_THEME_PATH = path.join(
  __dirname,
  '../../client/theme-default'
)

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

export default function createVitepressPlugin(): Plugin {
  return {
    name: 'vitepress',
    config() {
      return {
        alias: [
          {
            find: '@theme',
            replacement: DEFAULT_THEME_PATH
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

    configureServer(server: ViteDevServer) {
      return () => {
        server.app.use((req, res, next) => {
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

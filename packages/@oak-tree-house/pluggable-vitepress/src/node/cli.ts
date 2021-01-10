import path from 'path'
import { createServer, ViteDevServer } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue'
import MarkdownIt from 'markdown-it'
import qs from 'querystring'
import minimist from 'minimist'
import { resolvePath, resolveUserConfig } from './config'
import { SiteData } from '../shared/config'
import { PluginApi, VitepressPluginContext } from './plugin'
import { createMarkdownRender, transformMarkdown } from './markdown'

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2))

export const root = argv.root || path.join(__dirname, './docs.fallback')
export const APP_PATH = path.join(__dirname, '../client/app')
export const DEFAULT_THEME_PATH = path.join(
  __dirname,
  '../client/theme-default'
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

export const SITE_DATA_ID = '@siteData'
export const SITE_DATA_REQUEST_PATH = '/' + SITE_DATA_ID

async function main(): Promise<void> {
  // Load config
  const userConfigPath = resolvePath(root, 'config.js')
  const userConfig = await resolveUserConfig(userConfigPath)
  const pluginContext: VitepressPluginContext = {
    isProd: false,
    sourceDir: root
  }
  const pluginApi = await PluginApi.loadPlugins(
    userConfig.plugins || [],
    pluginContext,
    resolvePath(root, '.')
  )
  // Markdown
  const md = MarkdownIt(
    pluginApi.applyConfigMarkdown({
      html: true,
      linkify: true
    })
  )
  const renderer = createMarkdownRender(md)

  const siteData: SiteData = {
    title: userConfig.title || 'VitePress',
    description: userConfig.description || 'A VitePress site',
    base: userConfig.base ? userConfig.base.replace(/([^/])$/, '$1/') : '/'
  }

  // Load data
  const server = await createServer({
    root: root,
    plugins: [
      ...pluginApi.getVitePlugins(),
      {
        name: 'oak-press',
        config() {
          return {
            alias: [
              {
                find: '/@theme',
                replacement: DEFAULT_THEME_PATH
              },
              {
                find: SITE_DATA_ID,
                replacement: SITE_DATA_REQUEST_PATH
              }
            ]
          }
        },
        resolveId(id) {
          if (id === SITE_DATA_REQUEST_PATH) {
            return SITE_DATA_REQUEST_PATH
          }
        },
        load(id) {
          if (id === SITE_DATA_REQUEST_PATH) {
            return `export default ${JSON.stringify(siteData)}`
          }
        },
        async transform(code, id) {
          const [filename, rawQuery] = id.split(`?`, 2)
          const query = qs.parse(rawQuery || '')
          if (filename.endsWith('.md')) {
            return await transformMarkdown(
              renderer,
              {
                excerpt: query.excerpt !== undefined
              },
              root,
              code,
              filename
            )
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
        },
        async handleHotUpdate(ctx) {
          console.log(ctx.file, ctx.modules.length)
        }
      },
      createVuePlugin({
        include: [/\.vue$/, /\.md$/],
        ssr: false
      })
    ]
  })
  await server.listen()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

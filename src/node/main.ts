import path from 'path'
import { createServer, ViteDevServer } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue'
import fs from 'fs-extra'
import chalk from 'chalk'
import { SiteData, UserConfig } from '/@shared/config'
import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'
import { promisify } from 'util'
// import slash from 'slash';

export const ROOT_PATH = path.join(__dirname, '../../site')
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

async function resolveUserConfig(root: string): Promise<UserConfig> {
  // load user config
  const configPath = path.resolve(root, 'config.js')
  const hasUserConfig = await fs.pathExists(configPath)
  // always delete cache first before loading config
  delete require.cache[configPath]
  const userConfig: UserConfig = hasUserConfig ? require(configPath) : {}
  if (hasUserConfig) {
    console.info(`loaded config at ${chalk.yellow(configPath)}`)
  } else {
    console.info(`no config file found.`)
  }
  return userConfig
}

const md = MarkdownIt({
  html: true,
  linkify: true
})

async function main(): Promise<void> {
  // Load config
  const userConfig = await resolveUserConfig(ROOT_PATH)
  const siteData: SiteData = {
    lang: userConfig.lang || 'en-US',
    title: userConfig.title || 'VitePress',
    description: userConfig.description || 'A VitePress site',
    base: userConfig.base ? userConfig.base.replace(/([^/])$/, '$1/') : '/'
  }

  // Load data
  const server = await createServer({
    root: ROOT_PATH,
    plugins: [
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
            return `export default ${JSON.stringify(JSON.stringify(siteData))}`
          }
        },
        transform(code, id) {
          if (id.endsWith('.md')) {
            // const relativePath = slash(path.relative(ROOT_PATH, id))
            const { content } = matter(code)
            const html = md.render(content)
            return `<template><div>${html}</div></template>`
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

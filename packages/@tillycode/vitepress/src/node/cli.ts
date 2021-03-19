import path from 'path'
import { createServer } from 'vite'
import minimist from 'minimist'
import winston from 'winston'
import { resolveSiteConfig } from './config'
import { resolvePlugin } from './plugin'

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2))

async function main(): Promise<void> {
  // Configure environment variables
  if (argv._[0] === 'build') {
    process.env.NODE_ENV = 'production'
  }
  // Configure logger
  winston.configure({
    format: winston.format.combine(
      // eslint-disable-next-line
      winston.format((info: any): any => {
        if (info instanceof Error)
          return Object.assign({}, info, { message: info.stack })
        return info
      })(),
      winston.format.colorize(),
      winston.format.label({ label: 'vitepress' }),
      winston.format.timestamp(),
      winston.format.printf(
        ({ level, message, label, timestamp }) =>
          `${timestamp} [${label}] ${level}: ${message}`
      )
    ),
    level: argv.logLevel || 'info',
    transports: [new winston.transports.Console()]
  })
  const root = argv.root || path.join(__dirname, './docs.fallback')
  // Load config
  const siteConfig = await resolveSiteConfig(root)
  // Load plugins
  const plugins = await resolvePlugin(siteConfig)
  // Initialize
  await plugins.initialize()
  // const renderer = createMarkdownRender(md)
  // const plugins: VitePlugin[] = [
  //   ...pluginApi.getVitePlugins(),
  //   createVitepressPlugin(themeApi),
  //   createSiteDataPlugin(siteConfig.siteData, root),
  //   createMarkdownPlugin(renderer, root),
  //   createEnhanceAppPlugin(
  //     themeApi
  //       .collectEnhanceAppFiles()
  //       .concat(pluginApi.collectEnhanceAppFiles())
  //   ),
  //   createVuePlugin({ include: [/\.vue$/, /\.md$/] })
  // ]

  if (argv._[0] === 'build') {
    // await build(
    //   siteConfig,
    //   plugins,
    //   (ssr) => {
    //     const input: Record<string, string> = {
    //       app: path.join(APP_PATH, 'index.js')
    //     }
    //     for (const file of siteConfig.siteData.pages) {
    //       const name = slash(file).replace(/\//g, '_')
    //       input['page.' + name] = path.resolve(root, file) + '?content'
    //       input['page_data.' + name] = path.resolve(root, file) + '?pageData'
    //     }
    //     Object.assign(input, pluginApi.rollupInput(ssr))
    //     return input
    //   },
    //   async (context) => {
    //     await renderPages(context)
    //     await pluginApi.renderPages(context)
    //   }
    // )
  } else {
    const server = await createServer({
      root,
      plugins: plugins.getVitePlugins(),
      clearScreen: false
    })
    await server.listen()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

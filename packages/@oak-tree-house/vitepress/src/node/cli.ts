import path from 'path'
import { createServer, Plugin as VitePlugin } from 'vite'
import MarkdownIt from 'markdown-it'
import minimist from 'minimist'
import { resolvePath, resolveSiteConfig } from './config'
import { PluginApi, VitepressPluginContext } from './plugin'
import { createMarkdownRender } from './markdown'
import createVuePlugin from './vitePlugins/vueWrapper'
import createMarkdownPlugin from './vitePlugins/markdown'
import createSiteDataPlugin from './vitePlugins/siteData'
import createVitepressPlugin, { APP_PATH } from './vitePlugins/vitepress'
import createEnhanceAppPlugin from './vitePlugins/enhanceApp'
import { build } from './build'
import slash from 'slash'
import { renderPages } from './render'
import { ThemeApi, VitepressThemeContext } from './theme'
import { highlight } from './markdown/highlight'

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2))

async function main(): Promise<void> {
  if (argv._[0] === 'build') {
    process.env.NODE_ENV = 'production'
  }
  const root = argv.root || path.join(__dirname, './docs.fallback')
  // Load config
  const siteConfig = await resolveSiteConfig(root)
  const themeContext: VitepressThemeContext = siteConfig
  const themeApi = await ThemeApi.loadTheme(
    siteConfig.userConfig.theme,
    siteConfig.userConfig.themeConfig,
    themeContext,
    resolvePath(root, '.')
  )
  const pluginContext: VitepressPluginContext = {
    theme: themeApi,
    ...siteConfig
  }
  const pluginApi = await PluginApi.loadPlugins(
    siteConfig.userConfig.plugins || [],
    pluginContext,
    resolvePath(root, '.')
  )
  // Markdown
  const md = MarkdownIt(
    pluginApi.applyConfigMarkdown({
      html: true,
      linkify: true,
      highlight
    })
  )
  pluginApi.extendMarkdown(md)
  const renderer = createMarkdownRender(md)
  const plugins: VitePlugin[] = [
    ...pluginApi.getVitePlugins(),
    createVitepressPlugin(themeApi),
    createSiteDataPlugin(siteConfig.siteData, root),
    createMarkdownPlugin(renderer, root),
    createEnhanceAppPlugin(
      themeApi
        .collectEnhanceAppFiles()
        .concat(pluginApi.collectEnhanceAppFiles())
    ),
    createVuePlugin({ include: [/\.vue$/, /\.md$/] })
  ]

  if (argv._[0] === 'build') {
    await build(
      siteConfig,
      plugins,
      (ssr) => {
        const input: Record<string, string> = {
          app: path.join(APP_PATH, 'index.js')
        }
        for (const file of siteConfig.siteData.pages) {
          const name = slash(file).replace(/\//g, '_')
          input['page.' + name] = path.resolve(root, file) + '?content'
          input['page_data.' + name] = path.resolve(root, file) + '?pageData'
        }
        Object.assign(input, pluginApi.rollupInput(ssr))
        return input
      },
      async (context) => {
        await renderPages(context)
        await pluginApi.renderPages(context)
      }
    )
  } else {
    const server = await createServer({
      root,
      plugins
    })
    await server.listen()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

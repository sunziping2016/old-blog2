import path from 'path'
import { createServer } from 'vite'
import MarkdownIt from 'markdown-it'
import minimist from 'minimist'
import { resolvePath, resolveUserConfig } from './config'
import { PluginApi, VitepressPluginContext } from './plugin'
import { createMarkdownRender } from './markdown'
import createVuePlugin from './vitePlugins/vueWrapper'
import createMarkdownPlugin from './vitePlugins/markdown'
import createSiteDataPlugin from './vitePlugins/siteData'
import createVitepressPugin from './vitePlugins/vitepress'

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2))

export const root = argv.root || path.join(__dirname, './docs.fallback')

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

  const server = await createServer({
    root: root,
    plugins: [
      ...pluginApi.getVitePlugins(),
      createVitepressPugin(),
      createSiteDataPlugin(userConfig),
      createMarkdownPlugin(renderer, root),
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

import markdownPluginsPlugin from './markdownPlugins'
import enhanceAppPlugin from './enhanceApp'
import markdownPageProviderPlugin from './markdownPageProvider'
import markdownPageLoaderPlugin from './markdownPageLoader'
import aliasesPlugin from './aliases'
import indexHtmlPlugin from './indexHtml'
import { SiteConfig, UserConfigPlugins } from '../config'
import vuePlugin, { VuePluginOptions } from './vue'

export default function internalPlugins(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  siteConfig: SiteConfig
): UserConfigPlugins {
  return [
    aliasesPlugin,
    indexHtmlPlugin,
    enhanceAppPlugin,
    markdownPluginsPlugin,
    markdownPageProviderPlugin,
    markdownPageLoaderPlugin,
    [
      vuePlugin,
      {
        include: [/\.vue$/, /\.md$/],
        variants: {
          '': 'process',
          excerpt: 'process',
          content: 'process',
          data: 'bypass'
        }
      } as VuePluginOptions
    ]
  ]
}

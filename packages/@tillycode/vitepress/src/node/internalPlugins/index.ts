import markdownRenderPlugin from './markdownRender'
import enhanceAppPlugin from './enhanceApp'
import markdownPagesPlugin from './markdownPages'
import markdownPageDataPlugin from './markdownPageData'
import aliasesPlugin from './aliases'
import indexHtmlPlugin from './indexHtml'
import { SiteConfig, UserConfigPlugins } from '../config'

export default function internalPlugins(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  siteConfig: SiteConfig
): UserConfigPlugins {
  return [
    aliasesPlugin,
    indexHtmlPlugin,
    enhanceAppPlugin,
    markdownRenderPlugin,
    markdownPagesPlugin,
    markdownPageDataPlugin
  ]
}

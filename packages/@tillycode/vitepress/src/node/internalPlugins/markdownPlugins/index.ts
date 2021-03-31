import MarkdownIt from 'markdown-it'
import componentPlugin from './compoent'
import emoji from 'markdown-it-emoji'
import anchor from 'markdown-it-anchor'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import toc from 'markdown-it-table-of-contents'
import { parseHeader } from '../markdownPageProvider/parseHeader'
import { hoistPlugin } from './hoist'
import { slugify } from './slugify'
import { highlightLinePlugin } from './highlightLines'
import { preWrapperPlugin } from './preWrapper'
import { snippetPlugin } from './snippet'
import { VitepressPlugin } from '../../plugin'
import { highlight } from './highlight'
import { convertRouterLinkPlugin } from './link'
import { createContainer } from './containers'
import container from 'markdown-it-container'
import Token from 'markdown-it/lib/token'
import path from 'path'

export interface MarkdownParsedData {
  hoistedTags?: string[]
  links?: string[]
}

export interface MarkdownEnv {
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  frontmatter: Record<string, any>
  routerPath: string
  sourcePath: string
  filePath?: string
  relativePath?: string
}

export interface MarkdownItWithData extends MarkdownIt {
  __data: MarkdownParsedData
}

const markdownPluginsPlugin: VitepressPlugin<never> = {
  name: '@internal/markdown-plugins',
  configMarkdown(config) {
    // noinspection JSUnusedGlobalSymbols
    config.options
      .html(true)
      .highlight(highlight)
      .end()

      .plugin('component')
      .use(componentPlugin)
      .end()

      .plugin('highlight-lines')
      .use(highlightLinePlugin)
      .end()

      .plugin('pre-wrapper')
      .use(preWrapperPlugin)
      .end()

      .plugin('snippet')
      .use(snippetPlugin)
      .end()

      .plugin('convert-router-link')
      .use(convertRouterLinkPlugin, [
        {
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      ])
      .end()

      .plugin('hoist-script-style')
      .use(hoistPlugin)
      .end()

      .plugin('container-tip')
      .use(...createContainer('tip', 'TIP'))
      .end()

      .plugin('container-warning')
      .use(...createContainer('warning', 'WARNING'))
      .end()

      .plugin('container-danger')
      .use(...createContainer('danger', 'ERROR'))
      .end()

      .plugin('container-v-pre')
      .use(container, [
        'v-pre',
        {
          render: (tokens: Token[], idx: number) =>
            tokens[idx].nesting === 1 ? `<div v-pre>\n` : `</div>\n`
        }
      ])
      .end()

      .plugin('emoji')
      .use(emoji)
      .end()

      .plugin('anchor')
      .use(anchor, [
        {
          slugify,
          permalink: true,
          permalinkBefore: true,
          permalinkSymbol: '#',
          permalinkAttrs: () => ({ 'aria-hidden': true })
        }
      ])
      .end()

      .plugin('toc')
      .use(toc, [
        {
          slugify,
          includeLevel: [2, 3],
          format: parseHeader
        }
      ])
      .end()
  },
  layoutFiles: {
    OutboundLink: path.resolve(
      __dirname,
      '../../../client/markdownPlugins/OutboundLink.vue'
    )
  },
  enhanceAppFiles: path.resolve(
    __dirname,
    '../../../client/markdownPlugins/enhanceApp.js'
  )
}

export default markdownPluginsPlugin

import { PageData } from '../../shared/types'
import MarkdownIt from 'markdown-it'
import componentPlugin from './compoent'
import matter from 'gray-matter'
import slash from 'slash'
import fs from 'fs-extra'
import path from 'path'
import emoji from 'markdown-it-emoji'
import anchor from 'markdown-it-anchor'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import toc from 'markdown-it-table-of-contents'
import { deeplyParseHeader, parseHeader } from './parseHeader'
import { hoistPlugin } from './hoist'
import { slugify } from './slugify'
import { highlightLinePlugin } from './highlightLines'
import { preWrapperPlugin } from './preWrapper'
import { snippetPlugin } from './snippet'
import { containerPlugin } from './containers'

export interface MarkdownParsedData {
  hoistedTags?: string[]
}

export interface MarkdownEnv {
  relativePath: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  frontmatter: Record<string, any>
}

export type MarkdownRenderer = (
  src: string,
  env: MarkdownEnv
) => { html: string; data: MarkdownParsedData }

export interface MarkdownItWithData extends MarkdownIt {
  __data: MarkdownParsedData
}

export function createMarkdownRender(md: MarkdownIt): MarkdownRenderer {
  md.use(componentPlugin)
    .use(highlightLinePlugin)
    .use(preWrapperPlugin)
    .use(snippetPlugin)
    .use(hoistPlugin)
    .use(containerPlugin)
    .use(emoji)
    .use(anchor, {
      slugify,
      permalink: true,
      permalinkBefore: true,
      permalinkSymbol: '#',
      permalinkAttrs: () => ({ 'aria-hidden': true })
    })
    .use(toc, {
      slugify,
      includeLevel: [2, 3],
      format: parseHeader
    })
  const render = md.render
  return (src, env) => {
    ;(md as MarkdownItWithData).__data = {}
    const html = render.call(md, src, env)
    return {
      html,
      data: (md as MarkdownItWithData).__data
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export function inferTitle(frontmatter: any, content: string): string {
  if (frontmatter.title) {
    return deeplyParseHeader(frontmatter.title)
  }
  const match = content.match(/^\s*#+\s+(.*)/m)
  if (match) {
    return deeplyParseHeader(match[1].trim())
  }
  return ''
}

export interface MarkdownItem {
  pageData: PageData
  excerptHtml: string
  contentHtml: string
  hoistedTags: string[]
}

export class MarkdownCachedLoader {
  private readonly renderer: MarkdownRenderer
  private readonly markdownItems: Record<string, MarkdownItem>

  constructor(renderer: MarkdownRenderer) {
    this.renderer = renderer
    this.markdownItems = {}
  }

  invalidateFile(filename: string): boolean {
    return delete this.markdownItems[filename]
  }

  async ensureMarkdownItem(
    filename: string,
    code: string,
    root: string
  ): Promise<MarkdownItem> {
    if (this.markdownItems[filename] !== undefined) {
      return this.markdownItems[filename]
    }
    const relativePath = slash(path.relative(root, filename))
    const { content, data: frontmatter, excerpt } = matter(code, {
      excerpt_separator: '<!-- more -->'
    })
    const env: MarkdownEnv = { relativePath, frontmatter }
    const { html: excerptHtml } = excerpt
      ? this.renderer(excerpt, env)
      : { html: '' }
    const {
      html: contentHtml,
      data: { hoistedTags }
    } = this.renderer(content, env)
    const pageData: PageData = {
      title: inferTitle(frontmatter, content),
      frontmatter,
      relativePath,
      lastUpdated: Math.round((await fs.stat(filename)).mtimeMs)
    }
    const item: MarkdownItem = {
      pageData,
      excerptHtml,
      contentHtml,
      hoistedTags: hoistedTags || []
    }
    this.markdownItems[filename] = item
    return item
  }

  async exportPageData(
    filename: string,
    code: string,
    root: string
  ): Promise<string> {
    const item = await this.ensureMarkdownItem(filename, code, root)
    return (
      'import { shallowRef } from "vue"\n' +
      `const pageData = shallowRef(${JSON.stringify(item.pageData)})\n\n` +
      'export default pageData\n\n' +
      'if (import.meta.hot) {\n' +
      '  if (import.meta.hot.data.pageData) {\n' +
      '    import.meta.hot.data.pageData.value = pageData.value\n' +
      '  } else {\n' +
      '    import.meta.hot.data.pageData = pageData\n' +
      '  }\n' +
      '  import.meta.hot.accept(() => {})\n' +
      '}\n'
    )
  }

  async exportExcerpt(
    filename: string,
    code: string,
    root: string
  ): Promise<string> {
    const item = await this.ensureMarkdownItem(filename, code, root)
    return `<template><div>${item.excerptHtml}</div></template>\n`
  }

  async exportContent(
    filename: string,
    code: string,
    root: string
  ): Promise<string> {
    const item = await this.ensureMarkdownItem(filename, code, root)
    return (
      (item.hoistedTags || []).join('\n') +
      `\n<template><div>${item.contentHtml}</div></template>`
    )
  }
}

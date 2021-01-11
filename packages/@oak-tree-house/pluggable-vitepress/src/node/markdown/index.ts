import { Header, PageData } from '../../shared/config'
import MarkdownIt from 'markdown-it'
import componentPlugin from './compoent'
import matter from 'gray-matter'
import slash from 'slash'
import fs from 'fs-extra'
import path from 'path'
import { deeplyParseHeader } from '../parseHeaders'

export interface MarkdownParsedData {
  hoistedTags?: string[]
  links?: string[]
  headers?: Header[]
}

export type MarkdownRenderer = (
  src: string,
  env?: never
) => { html: string; data: MarkdownParsedData }

export interface MarkdownItWithData extends MarkdownIt {
  __data: MarkdownParsedData
}

export function createMarkdownRender(md: MarkdownIt): MarkdownRenderer {
  md.use(componentPlugin)
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

export interface TransformMarkdownOptions {
  excerpt: boolean
}

export async function exportMarkdownPageData(
  renderer: MarkdownRenderer,
  root: string,
  src: string,
  file: string
): Promise<string> {
  const relativePath = slash(path.relative(root, file))
  const { content, data: frontmatter } = matter(src, {
    excerpt_separator: '<!-- more -->'
  })
  const pageData: PageData = {
    title: inferTitle(frontmatter, content),
    frontmatter,
    relativePath,
    lastUpdated: Math.round((await fs.stat(file)).mtimeMs)
  }
  return (
    `const pageData = ${JSON.stringify(pageData)}\n\n` +
    'export default pageData\n'
  )
}

export function exportMarkdownExcerpt(
  renderer: MarkdownRenderer,
  root: string,
  src: string
): string {
  const { excerpt } = matter(src, {
    excerpt_separator: '<!-- more -->'
  })
  const { html: excerptHtml } = excerpt ? renderer(excerpt) : { html: '' }
  return `<template><div>${excerptHtml}</div></template>\n`
}

export function exportMarkdown(
  renderer: MarkdownRenderer,
  root: string,
  src: string
): string {
  const { content } = matter(src, {
    excerpt_separator: '<!-- more -->'
  })
  const { html: contentHtml, data } = renderer(content)
  return (
    `<template><div>${contentHtml}</div></template>\n` +
    (data.hoistedTags || []).join('\n')
  )
}

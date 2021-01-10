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

const scriptRE = /<\/script>/
const scriptSetupRE = /<\s*script[^>]*\bsetup\b[^>]*/
const defaultExportRE = /((?:^|\n|;)\s*)export(\s*)default/
const namedDefaultExportRE = /((?:^|\n|;)\s*)export(.+)as(\s*)default/

function insertPageDataTag(tags: string[], data: PageData): string[] {
  tags = tags.slice()
  const code = `\nexport const pageData = ${JSON.stringify(data)}`

  const existingScriptIndex = tags.findIndex((tag) => {
    return scriptRE.test(tag) && !scriptSetupRE.test(tag)
  })

  if (existingScriptIndex > -1) {
    const tagSrc = tags[existingScriptIndex]
    // user has <script> tag inside markdown
    // if it doesn't have export default it will error out on build
    const hasDefaultExport =
      defaultExportRE.test(tagSrc) || namedDefaultExportRE.test(tagSrc)
    tags[existingScriptIndex] = tagSrc.replace(
      scriptRE,
      code + (hasDefaultExport ? `` : `\nexport default{}\n`) + `</script>`
    )
  } else {
    tags.unshift(`<script>${code}\nexport default {}</script>`)
  }

  return tags
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

export async function transformMarkdown(
  renderer: MarkdownRenderer,
  options: TransformMarkdownOptions,
  root: string,
  src: string,
  file: string
): Promise<string> {
  const relativePath = slash(path.relative(root, file))
  const { content, data: frontmatter, excerpt } = matter(src, {
    excerpt_separator: '<!-- more -->'
  })
  const { html: excerptHtml } = excerpt ? renderer(excerpt) : { html: '' }
  const { html: contentHtml, data } = renderer(content)

  const pageData: PageData = {
    title: inferTitle(frontmatter, content),
    frontmatter,
    headers: data.headers || [],
    relativePath,
    lastUpdated: Math.round((await fs.stat(file)).mtimeMs)
  }
  return (
    insertPageDataTag(data.hoistedTags || [], pageData).join('\n') +
    `\n<template><div>${
      options.excerpt ? excerptHtml : contentHtml
    }</div></template>`
  )
}

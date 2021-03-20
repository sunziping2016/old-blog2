import { PluginApi, VitepressPluginOption } from '../plugin'
import qs from 'querystring'
import winston from 'winston'
import { MarkdownPage } from './markdownPageProvider'
import chalk from 'chalk'
import { MarkdownPageData } from '../../shared/types'

const MARKDOWN_RE = /^@md\/(data|excerpt|content)\/([^?]+)(?:\?(.*))?$/

export default function markdownPageLoaderPlugin(
  this: PluginApi
): VitepressPluginOption {
  return {
    name: '@internal/markdown-page-loader',
    resolveId: (id) => {
      const match = id.match(MARKDOWN_RE)
      if (match && this.pageApi.has(match[2])) {
        const page = this.pageApi.get(match[2])
        if (page.type !== 'markdown') {
          winston.warn(
            `non-markdown page ${chalk.yellow(
              match[2]
            )} in markdown-page-loader/resolveId`
          )
          return
        }
        const markdownPage = (page as MarkdownPage).page
        if ('filePath' in markdownPage) {
          return (
            `/@fs/${markdownPage.filePath}?variant=${match[1]}&id=${match[2]}` +
            (match[3] ? `&${match[3]}` : '')
          )
        } else {
          return (
            `@md/virtual.md?variant=${match[1]}&id=${match[2]}` +
            (match[3] ? `&${match[3]}` : '')
          )
        }
      }
    }, // ~resolveId
    load: async (id) => {
      const [filename, rawQuery] = id.split(`?`, 2)
      const query = qs.parse(rawQuery || '')
      if (filename === '@md/virtual.md' && typeof query.id === 'string') {
        const page = this.pageApi.get(query.id)
        if (page.type !== 'markdown') {
          winston.warn(
            `non-markdown page ${chalk.yellow(
              query.id
            )} found in markdown-page-loader/load`
          )
          return
        }
        const markdownPage = (page as MarkdownPage).page
        if (!('content' in markdownPage)) {
          winston.warn(`expect code in markdown page ${query.id}`)
          return
        }
        return markdownPage.content
      }
    }, // ~content
    transform: async (code, id) => {
      const [filename, rawQuery] = id.split(`?`, 2)
      const query = qs.parse(rawQuery || '')
      if (
        filename.endsWith('.md') &&
        query.vue === undefined &&
        typeof query.id === 'string'
      ) {
        const page = this.pageApi.get(query.id)
        if (page.type !== 'markdown') {
          winston.warn(
            `non-markdown page ${chalk.yellow(
              query.id
            )} found in markdown-page-loader/transform`
          )
          return
        }
        const markdownPage = page as MarkdownPage
        switch (query.variant) {
          case 'data': {
            const basic = await markdownPage.ensureBasic()
            const pageData: MarkdownPageData = {
              title: basic.title,
              headers: [], // TODO
              frontmatter: basic.frontmatter,
              lastUpdated: basic.lastUpdated
            }
            return (
              'import { shallowRef } from "vue"\n' +
              `const pageData = shallowRef(${JSON.stringify(pageData)})\n\n` +
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
          case 'excerpt': {
            return `<template><div>${await markdownPage.ensureExcerpt()}</div></template>\n`
          }
          case 'content': {
            const item = await markdownPage.ensureContent()
            return (
              (item.hoistedTags || []).join('\n') +
              `\n<template><div>${item.contentHtml}</div></template>`
            )
          }
          default:
            winston.warn(`unknown variant for ${chalk.yellow(id)}`)
        }
      }
    } // ~transform
  }
}

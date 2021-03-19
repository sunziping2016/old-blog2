import {
  AdditionalPage,
  PluginApi,
  VitepressPluginContext,
  VitepressPluginOption
} from '../../plugin'
import globby from 'globby'
import MarkdownIt from 'markdown-it'
import winston from 'winston'
import path from 'path'
import chalk from 'chalk'
import { Page } from '../../page'
import { readModifiedFile } from '../../utils'
import matter from 'gray-matter'
import { RouterSettings } from '../../../shared/types'
import { deeplyParseHeader } from './parseHeader'
import fs from 'fs-extra'
import { MarkdownEnv, MarkdownItWithData } from '../markdownRender'
import slash from 'slash'

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

export interface MarkdownPageBasicData {
  code: string
  content: string
  excerpt: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  frontmatter: Record<string, any>
  title: string
  lastUpdated?: number
}

export interface MarkdownPageContentData {
  contentHtml: string
  hoistedTags: string[]
}

function generatePageId(routerPath: string): string {
  return `md.${routerPath.slice(1, -1).replace(/\//g, '_')}`
}

function relativePathToRouterPath(relativePath: string): string {
  let routerPath = '/' + relativePath
  const match = routerPath.match(/(.*)\/(?:index|readme)\.md$/i)
  if (match) {
    routerPath = match[1]
  } else {
    // must ends with ".md"
    routerPath = routerPath.slice(0, -3)
  }
  if (!routerPath.endsWith('/')) {
    routerPath += '/'
  }
  return routerPath
}

// Markdown is loaded
// 1. ensureBasic: content and excerpt are extracted, frontmatter parsed
// 2.a ensureExcerpt: excerpt is parsed
// 2.b ensureContent: content is parsed
export class MarkdownPage extends Page {
  public readonly page: AdditionalPage

  private readonly context: VitepressPluginContext
  private readonly md: MarkdownIt
  private basic?: MarkdownPageBasicData
  private excerpt?: string
  private content?: MarkdownPageContentData

  constructor(
    id: string,
    context: VitepressPluginContext,
    md: MarkdownIt,
    page: AdditionalPage
  ) {
    super('markdown', id)
    this.context = context
    this.md = md
    this.page = page
  }

  onInvalidated(): void | Promise<void> {
    delete this.basic
    delete this.excerpt
    delete this.content
  }

  async ensureBasic(): Promise<MarkdownPageBasicData> {
    if (this.basic === undefined) {
      let code
      if ('filePath' in this.page) {
        code = await readModifiedFile(this.page.filePath)
      } else {
        code = this.page.content
      }
      const { content, data: frontmatter, excerpt = '' } = matter(code, {
        excerpt_separator: '<!-- more -->'
      })
      const title = inferTitle(frontmatter, content)
      this.basic = {
        code,
        content,
        excerpt,
        frontmatter,
        title
      }
      if ('filePath' in this.page) {
        this.basic.lastUpdated = Math.round(
          (await fs.stat(this.page.filePath)).mtimeMs
        )
      }
    }
    return this.basic
  }

  private makeEnv(basic: MarkdownPageBasicData): MarkdownEnv {
    const env: MarkdownEnv = {
      id: this.id,
      frontmatter: basic.frontmatter,
      routerPath: this.page.path,
      sourcePath: this.context.sourceDir
    }
    if ('filePath' in this.page) {
      env.filePath = this.page.filePath
      env.relativePath = slash(
        path.relative(this.context.sourceDir, this.page.filePath)
      )
    }
    return env
  }

  async ensureExcerpt(): Promise<string> {
    if (this.excerpt === undefined) {
      const basic = await this.ensureBasic()
      const env = this.makeEnv(basic)
      const md = this.md as MarkdownItWithData
      md.__data = {}
      this.excerpt = md.render(basic.excerpt, env)
    }
    return this.excerpt
  }

  async ensureContent(): Promise<MarkdownPageContentData> {
    if (this.content === undefined) {
      const basic = await this.ensureBasic()
      const env = this.makeEnv(basic)
      const md = this.md as MarkdownItWithData
      md.__data = {}
      const contentHtml = md.render(basic.excerpt, env)
      this.content = {
        contentHtml,
        hoistedTags: md.__data.hoistedTags || []
      }
    }
    return this.content
  }

  protected async reload(): Promise<RouterSettings> {
    const basic = await this.ensureBasic()
    return {
      routerPath: this.page.path,
      layout: basic.frontmatter.layout || 'Layout'
    }
  }
}

export default async function markdownPagesPlugin(
  this: PluginApi,
  pluginOptions: undefined,
  context: VitepressPluginContext
): Promise<VitepressPluginOption> {
  return {
    name: '@internal/markdown-pages',
    configureServer: async (server) => {
      const pages: AdditionalPage[] = []
      const pagePathSet: Set<string> = new Set<string>() // ensure uniqueness
      const pageFilePathSet: Set<string> = new Set<string>() // ensure uniqueness
      // load pages under source dir
      ;(
        await globby(['**.md'], {
          cwd: context.sourceDir,
          ignore: ['node_modules']
        })
      ).forEach((relativePath) => {
        const routerPath = relativePathToRouterPath(relativePath)
        if (pagePathSet.has(routerPath)) {
          winston.warn(
            'duplicated path in additionalPages: ' + chalk.yellow(routerPath)
          )
          return
        }
        pagePathSet.add(routerPath)
        const filePath = path.resolve(context.sourceDir, relativePath)
        pageFilePathSet.add(filePath)
        pages.push({
          path: routerPath,
          filePath
        })
      })
      // load customized pages
      ;(await this.collectAdditionalPages()).forEach((item) => {
        if ('filePath' in item && 'content' in item) {
          winston.warn(
            'only one of filePath and content can be set ' +
              'in additionalPages, filePath ignored'
          )
          // eslint-disable-next-line
          // @ts-ignore
          delete item.filePath
        }
        if (!item.path.endsWith('/')) {
          winston.warn(
            'path in additionalPages should have trailing slash: ' +
              chalk.yellow(item.path)
          )
          item.path += '/'
        }
        if (pagePathSet.has(item.path)) {
          winston.warn(
            'duplicated path in additionalPages: ' + chalk.yellow(item.path)
          )
          return
        }
        pagePathSet.add(item.path)
        if ('filePath' in item) {
          item.filePath = path.resolve(item.filePath)
          if (pageFilePathSet.has(item.filePath)) {
            winston.warn(
              'duplicated filePath in additionalPages: ' +
                chalk.yellow(item.filePath)
            )
            return
          }
          pageFilePathSet.add(item.filePath)
        }
        pages.push(item)
      })
      // Add file to pages and setup watcher
      for (const page of pages) {
        const id = generatePageId(page.path)
        await this.pageApi.add(new MarkdownPage(id, context, this.md, page))
        if ('filePath' in page) {
          server.watcher.add(page.filePath)
        }
      }
      server.watcher.on('add', (filePath) => {
        if (filePath.endsWith('.md') && !pageFilePathSet.has(filePath)) {
          const relativePath = path.relative(context.sourceDir, filePath)
          const routerPath = relativePathToRouterPath(relativePath)
          const id = generatePageId(routerPath)
          if (pagePathSet.has(routerPath)) {
            winston.warn(
              'duplicated path in additionalPages: ' + chalk.yellow(routerPath)
            )
            return
          }
          pagePathSet.add(routerPath)
          pageFilePathSet.add(filePath)
          this.pageApi
            .add(
              new MarkdownPage(id, context, this.md, {
                path: routerPath,
                filePath
              })
            )
            .catch((e) => winston.error(e))
        }
      })
      server.watcher.on('unlink', (filePath) => {
        if (filePath.endsWith('.md') && pageFilePathSet.has(filePath)) {
          const relativePath = path.relative(context.sourceDir, filePath)
          const routerPath = relativePathToRouterPath(relativePath)
          const id = generatePageId(routerPath)
          const markdownPage = this.pageApi.get(id) as MarkdownPage
          const page = markdownPage.page as {
            path: string
            filePath: string
          }
          pagePathSet.delete(page.path)
          pageFilePathSet.delete(page.filePath)
          this.pageApi.remove(id).catch((e) => winston.error(e))
        }
      })
      server.watcher.on('change', (filePath) => {
        if (filePath.endsWith('.md') && pageFilePathSet.has(filePath)) {
          const relativePath = path.relative(context.sourceDir, filePath)
          const routerPath = relativePathToRouterPath(relativePath)
          const id = generatePageId(routerPath)
          this.pageApi.invalidate(id).catch((e) => winston.error(e))
        }
      })
    } // ~configureServer
  }
}

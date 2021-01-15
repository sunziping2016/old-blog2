import {
  VitepressPlugin,
  inferTitle
} from '@oak-tree-house/pluggable-vitepress'
import dayjs from 'dayjs'
import globby from 'globby'
import path from 'path'
import fs from 'fs-extra'
import matter from 'gray-matter'
import slash from 'slash'
import { BlogData, BlogDataItem } from '../shared/types'

export interface MarkdownFile {
  relativePath: string
  title: string
  // eslint-disable-next-line
  frontmatter: any
  lastUpdated: number
}

export type Sorter = (prev: MarkdownFile, next: MarkdownFile) => number

export interface PaginationOptions {
  sorter?: Sorter
  lengthPerPage?: number
}

export interface ClassifierOptions {
  id: string
  path?: string
  title?: string
  pagination?: PaginationOptions
  dirname?: string
  keys?: string[] | string
}

export interface BlogPluginOptions {
  classifiers?: ClassifierOptions[]
}

export type BlogPlugin = VitepressPlugin<BlogPluginOptions>

export function defaultSorter(prev: MarkdownFile, next: MarkdownFile): number {
  if (
    prev.frontmatter.date === undefined &&
    next.frontmatter.date == undefined
  ) {
    return prev.relativePath > next.relativePath
      ? -1
      : prev.relativePath < next.relativePath
      ? 1
      : 0
  }
  const prevTime = dayjs(prev.frontmatter.date)
  const nextTime = dayjs(next.frontmatter.date)
  const diff = prevTime.diff(nextTime)
  return diff > 0 ? -1 : diff < 0 ? 1 : 0
}

export class Pagination {
  private readonly sorter: Sorter
  private readonly lengthPerPage: number

  constructor(options: PaginationOptions) {
    this.sorter = options.sorter || defaultSorter
    this.lengthPerPage = options.lengthPerPage || 10
  }
  getLengthPerPage(): number {
    return this.lengthPerPage
  }
  equal(left: MarkdownFile, right: MarkdownFile): boolean {
    return this.sorter(left, right) === 0
  }
  paginatePages(pages: MarkdownFile[], page: number): MarkdownFile[] {
    pages = pages.slice()
    pages = pages.sort(this.sorter)
    return pages.slice(
      page * this.lengthPerPage,
      (page + 1) * this.lengthPerPage
    )
  }
  indexOfPage(pages: MarkdownFile[], page: MarkdownFile): number {
    return Math.floor(
      pages.filter((other) => this.sorter(other, page) < 0).length /
        this.lengthPerPage
    )
  }
}

export class Classifier {
  private readonly id: string
  private readonly path: string
  private readonly title: string
  private pagination: Pagination
  private readonly dirname?: string
  private readonly keys?: string[]
  private readonly pages: Record<string, [MarkdownFile, Set<string>]>
  private readonly keyToPages: Record<string, Set<string>>

  public constructor(options: ClassifierOptions) {
    this.id = options.id
    this.path = options.path || `/${options.id}/`
    this.title = options.title || options.id
    this.pagination = new Pagination(options.pagination || {})
    this.dirname = options.dirname
    if (this.dirname !== undefined && !this.dirname.endsWith('/')) {
      this.dirname += '/'
    }
    this.keys = typeof options.keys === 'string' ? [options.keys] : options.keys
    this.pages = {}
    this.keyToPages = {}
  }
  exportData(): BlogDataItem {
    const lengthPerPage = this.pagination.getLengthPerPage()
    const result: BlogDataItem = {
      path: this.path,
      title: this.title,
      lengthPerPage,
      values: {}
    }
    if (this.dirname !== undefined) {
      result.dirname = this.dirname
    }
    if (this.keys !== undefined) {
      result.keys = this.keys
      for (const [key, pages] of Object.entries(this.keyToPages)) {
        result.values[key] = {
          totalItems: pages.size,
          totalPages: Math.ceil(pages.size / lengthPerPage)
        }
      }
    } else {
      const totalItems = Object.keys(this.pages).length
      result.values.all = {
        totalItems,
        totalPages: Math.ceil(totalItems / lengthPerPage)
      }
    }
    return result
  }
  filterFile(file: MarkdownFile): boolean {
    if (this.dirname && !file.relativePath.startsWith(this.dirname)) {
      return false
    }
    return !(
      this.keys && this.keys.every((key) => file.frontmatter[key] === undefined)
    )
  }
  resolveFileKeys(file: MarkdownFile): Set<string> {
    if (this.keys === undefined) {
      return new Set<string>()
    }
    const values = this.keys.flatMap((key) => {
      const values = file.frontmatter[key]
      if (values === undefined) {
        return []
      } else if (typeof values === 'string') {
        return [values]
      } else if (Array.isArray(values)) {
        return values.filter((x) => typeof x === 'string')
      }
    })
    return new Set(values)
  }
  generateUpdates(files: MarkdownFile[]): Record<string, number> {
    if (this.keys === undefined) {
      return {
        all: Math.min(
          ...files.map((file) =>
            this.pagination.indexOfPage(
              Object.values(this.pages).map((x) => x[0]),
              file
            )
          )
        )
      }
    } else {
      const result: Record<string, number> = {}
      for (const key of Object.keys(this.keyToPages)) {
        result[key] = Math.min(
          ...files.map((file) =>
            this.pagination.indexOfPage(
              [...this.keyToPages[key]].map((path) => this.pages[path][0]),
              file
            )
          )
        )
      }
      return result
    }
  }
  updateFile(file: MarkdownFile): false | Record<string, number> {
    if (!this.filterFile(file)) {
      return false
    }
    const newFileKeys = this.resolveFileKeys(file)
    const oldFile = this.pages[file.relativePath]
    // If frontmatter keys in file haven't been updated, just record the
    // new file without triggering update
    if (
      oldFile !== undefined &&
      oldFile[1].size === newFileKeys.size &&
      [...newFileKeys].every((key) => oldFile[1].has(key)) &&
      this.pagination.equal(oldFile[0], file)
    ) {
      oldFile[0] = file
      return false
    }
    // Update file
    if (oldFile !== undefined) {
      for (const key of oldFile[1]) {
        this.keyToPages[key].delete(file.relativePath)
        if (this.keyToPages[key].size === 0) {
          delete this.keyToPages[key]
        }
      }
      delete this.pages[file.relativePath]
    }
    const updates = this.generateUpdates(
      oldFile === undefined ? [file] : [oldFile[0], file]
    )
    for (const key of newFileKeys) {
      this.keyToPages[key] = this.keyToPages[key] || new Set<string>()
      this.keyToPages[key].add(file.relativePath)
    }
    this.pages[file.relativePath] = [file, newFileKeys]
    return updates
  }
  removeFile(relativePath: string): false | Record<string, number> {
    const oldFile = this.pages[relativePath]
    if (oldFile === undefined) {
      return false
    }
    for (const key of oldFile[1]) {
      this.keyToPages[key].delete(relativePath)
      if (this.keyToPages[key].size === 0) {
        delete this.keyToPages[key]
      }
    }
    delete this.pages[relativePath]
    return this.generateUpdates([oldFile[0]])
  }
  fetchPages(key: string, page: number): MarkdownFile[] {
    let candidates: MarkdownFile[]
    if (this.keys === undefined) {
      candidates = Object.values(this.pages).map((x) => x[0])
    } else {
      candidates = [...this.keyToPages[key]].map((path) => this.pages[path][0])
    }
    return this.pagination.paginatePages(candidates, page)
  }
  generateFetchPagesCode(key: string, page: number): string {
    const pages = this.fetchPages(key, page)
    let result = 'import { markRaw } from "vue"\n'
    for (let i = 0; i < pages.length; ++i) {
      const page = pages[i]
      result += `import pageData${i} from "/${page.relativePath}?pageData"\n`
    }
    for (let i = 0; i < pages.length; ++i) {
      const page = pages[i]
      result += `import excerpt${i} from "/${page.relativePath}?excerpt"\n`
    }
    result +=
      '\n' +
      `const data = [\n${Array.from(
        { length: pages.length },
        (x, i) =>
          `  { excerpt: markRaw(excerpt${i}), pageData: pageData${i} },\n`
      ).join('')}]\n\n`
    result += 'export default data\n\n'
    return result
  }
}

const BLOG_PATH_RE = /^\/@blogData(?:$|\/([^/]+)\/([^/]+)\/([^/]+))/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = (func: any, wait: number) => {
  let timeout: NodeJS.Timeout | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function executedFunction(...args: any[]) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

const plugin: BlogPlugin = async (options, context) => {
  const classifiers: Record<string, Classifier> = {}
  if (options.classifiers) {
    for (const option of options.classifiers) {
      classifiers[option.id] = new Classifier(option)
    }
  }
  async function loadMarkdownFile(file: string): Promise<MarkdownFile> {
    const full_path = path.join(context.sourceDir, file)
    const src = await fs.readFile(full_path)
    const { content, data: frontmatter } = matter(src)
    return {
      relativePath: slash(file),
      title: inferTitle(frontmatter, content),
      frontmatter: frontmatter,
      lastUpdated: Math.round((await fs.stat(full_path)).mtimeMs)
    }
  }
  let lastBlogData: BlogData | undefined
  function getBlogData(): BlogData {
    const data: BlogData = {}
    for (const [key, value] of Object.entries(classifiers)) {
      data[key] = value.exportData()
    }
    lastBlogData = data
    return data
  }
  const markdownFiles = await globby(['**.md'], {
    cwd: context.sourceDir,
    ignore: ['node_modules']
  })
  for (const markdownFile of markdownFiles) {
    for (const classifier of Object.values(classifiers)) {
      classifier.updateFile(await loadMarkdownFile(markdownFile))
    }
  }
  return {
    name: '@oak-tree-house/vitepress-plugin-blog',
    config() {
      return {
        alias: [
          {
            find: /^@blogData($|\/.*)/,
            replacement: '/@blogData$1'
          }
        ]
      }
    },
    async configureServer(server) {
      let updatedClassifier: Record<string, Record<string, number>> = {}
      const handleHotUpdate = debounce((): void => {
        if (Object.keys(updatedClassifier).length !== 0) {
          for (const [id, key_pages] of Object.entries(updatedClassifier)) {
            for (const [key, page] of Object.entries(key_pages)) {
              const total =
                lastBlogData &&
                lastBlogData[id] &&
                lastBlogData[id].values[key].totalPages
              if (total !== undefined) {
                for (let i = page; i < total; ++i) {
                  const module = server.moduleGraph.getModuleById(
                    `/@blogData/${id}/${key}/${i}`
                  )
                  if (module !== undefined) {
                    module.transformResult = null
                  }
                }
              }
            }
          }
          server.ws.send({
            type: 'custom',
            event: 'plugin-blog:blogData',
            data: {
              updates: updatedClassifier,
              blogData: getBlogData()
            }
          })
          updatedClassifier = {}
        }
      }, 200)
      function mergeUpdates(
        id: string,
        updates: false | Record<string, number>
      ) {
        if (updates) {
          const item = updatedClassifier[id] || {}
          for (const [key, value] of Object.entries(updates)) {
            if (item[key] === undefined || item[key] > value) {
              item[key] = value
            }
          }
          updatedClassifier[id] = item
          handleHotUpdate()
        }
      }
      async function updateFile(file: string): Promise<void> {
        const markdownFile = await loadMarkdownFile(file)
        for (const [id, classifier] of Object.entries(classifiers)) {
          mergeUpdates(id, classifier.updateFile(markdownFile))
        }
      }
      function removeFile(file: string) {
        for (const [id, classifier] of Object.entries(classifiers)) {
          mergeUpdates(id, classifier.removeFile(file))
        }
      }
      server.watcher.on('change', (file) => {
        updateFile(path.relative(context.sourceDir, file)).catch((err) =>
          console.error(err)
        )
      })
      server.watcher.on('add', (file) => {
        updateFile(path.relative(context.sourceDir, file)).catch((err) =>
          console.error(err)
        )
      })
      server.watcher.on('unlink', (file) => {
        removeFile(path.relative(context.sourceDir, file))
      })
    },
    resolveId(id) {
      const m = id.match(BLOG_PATH_RE)
      if (m && (m[1] === undefined || classifiers[m[1]] !== undefined)) {
        return id
      }
    },
    load(id) {
      const m = id.match(BLOG_PATH_RE)
      if (m) {
        if (m[1] === undefined) {
          return `export default ${JSON.stringify(getBlogData())}\n`
        } else if (classifiers[m[1]] !== undefined && m[2] !== undefined) {
          const classifier = classifiers[m[1]]
          const key = m[2]
          const page = parseInt(m[3], 10)
          return classifier.generateFetchPagesCode(key, page)
        }
      }
    }
  }
}

export default plugin

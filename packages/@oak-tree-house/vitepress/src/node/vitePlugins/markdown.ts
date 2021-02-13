import { Plugin } from 'vite'
import qs from 'querystring'
import fs from 'fs-extra'
import { MarkdownCachedLoader, MarkdownRenderer } from '../markdown'

export default function createMarkdownPlugin(
  renderer: MarkdownRenderer,
  root: string
): Plugin {
  const mdLoader = new MarkdownCachedLoader(renderer)
  return {
    name: 'markdown',
    resolveId(id) {
      const [filename] = id.split(`?`, 2)
      if (filename.endsWith('.md')) {
        return id
      }
    },
    async load(id) {
      const [filename] = id.split(`?`, 2)
      if (filename.endsWith('.md')) {
        return await fs.readFile(filename, 'utf-8')
      }
    },
    async transform(code, id) {
      const [filename, rawQuery] = id.split(`?`, 2)
      const query = qs.parse(rawQuery || '')
      if (filename.endsWith('.md')) {
        if (query.pageData !== undefined) {
          return await mdLoader.exportPageData(filename, code, root)
        } else if (query.excerpt !== undefined) {
          return await mdLoader.exportExcerpt(filename, code, root)
        } else {
          return await mdLoader.exportContent(filename, code, root)
        }
      }
    },
    async handleHotUpdate(ctx) {
      if (ctx.file.endsWith('.md')) {
        mdLoader.invalidateFile(ctx.file)
      }
    }
  }
}

import originCreateVuePlugin, { Options } from '@vitejs/plugin-vue'
import qs from 'querystring'
import { SourceMapInput } from 'rollup'
import { Plugin } from 'vite'

function transformId(
  id: string
): {
  newId: string
  pageData?: true
  tag?: 'excerpt' | 'content'
} {
  const [filename, rawQuery] = id.split(`?`, 2)
  const query = qs.parse(rawQuery || '')
  if (filename.endsWith('.md')) {
    if (query.pageData !== undefined) {
      return { newId: id, pageData: true }
    } else if (query.excerpt !== undefined) {
      const newFilename = filename.slice(0, -3) + '.excerpt.md'
      return {
        newId: newFilename + '?' + rawQuery,
        tag: 'excerpt'
      }
    } else if (query.content !== undefined) {
      const newFilename = filename.slice(0, -3) + '.content.md'
      return {
        newId: newFilename + '?' + rawQuery,
        tag: 'content'
      }
    }
  }
  return { newId: id }
}

function mapSourceMap(map?: SourceMapInput): void {
  if (typeof map === 'object' && map !== null) {
    if ('file' in map && map.file) {
      map.file = map.file.replace(/\.(?:content|excerpt)\.md$/, '.md')
    }
    if ('sources' in map) {
      map.sources = map.sources.map((file) =>
        file.replace(/\.(?:content|excerpt)\.md$/, '.md')
      )
    }
  }
}

export default function createVuePlugin(options: Options): Plugin {
  const vuePlugin = originCreateVuePlugin(options)
  const originVuePluginLoad = vuePlugin.load
  if (originVuePluginLoad !== undefined) {
    vuePlugin.load = async function (id, ssr) {
      const { newId, pageData, tag } = transformId(id)
      if (!pageData) {
        const replaceTag = tag === undefined ? '.md?' : `.md?${tag}&`
        let result = await originVuePluginLoad.call(this, newId, ssr)
        // noinspection SuspiciousTypeOfGuard
        if (typeof result === 'string') {
          result = result.replace(/\.(?:content|excerpt)\.md\?/g, replaceTag)
        } else if (typeof result === 'object' && result !== null) {
          result.code = result.code.replace(
            /\.(?:content|excerpt)\.md\?/g,
            replaceTag
          )
          mapSourceMap(result.map)
        }
        return result
      }
    }
  }
  const originVuePluginTransform = vuePlugin.transform
  if (originVuePluginTransform !== undefined) {
    vuePlugin.transform = async function (code, id, ssr) {
      const { newId, pageData, tag } = transformId(id)
      if (!pageData) {
        const replaceTag = tag === undefined ? '.md?' : `.md?${tag}&`
        let result = await originVuePluginTransform.call(this, code, newId, ssr)
        // noinspection SuspiciousTypeOfGuard
        if (typeof result === 'string') {
          result = result.replace(/\.(?:content|excerpt)\.md\?/g, replaceTag)
        } else if (typeof result === 'object' && result !== null) {
          if (result.code !== undefined) {
            result.code = result.code.replace(
              /\.(?:content|excerpt)\.md\?/g,
              replaceTag
            )
          }
          mapSourceMap(result.map)
        }
        return result
      }
    }
  }
  const originVueHandleHotUpdate = vuePlugin.handleHotUpdate
  if (originVueHandleHotUpdate !== undefined) {
    vuePlugin.handleHotUpdate = async function (ctx) {
      return ctx.modules
    }
  }
  return vuePlugin
}

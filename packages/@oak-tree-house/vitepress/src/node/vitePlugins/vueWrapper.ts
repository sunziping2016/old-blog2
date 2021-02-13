import originCreateVuePlugin, { Options } from '@vitejs/plugin-vue'
import qs from 'querystring'
import { Plugin } from 'vite'

function transformId(
  id: string
): {
  filename: string
  newId: string
  pageData?: true
  content?: true
  excerpt?: true
} {
  const [filename, rawQuery] = id.split(`?`, 2)
  const query = qs.parse(rawQuery || '')
  if (filename.endsWith('.md')) {
    if (query.pageData !== undefined) {
      return { filename, newId: id, pageData: true }
    } else if (query.excerpt !== undefined) {
      const newFilename = filename.slice(0, -3) + '.excerpt.md'
      return {
        filename: newFilename,
        newId: newFilename + '?' + rawQuery,
        excerpt: true
      }
    } else if (query.content !== undefined) {
      const newFilename = filename.slice(0, -3) + '.content.md'
      return {
        filename: newFilename,
        newId: newFilename + '?' + rawQuery,
        content: true
      }
    }
  }
  return { filename, newId: id }
}

export default function createVuePlugin(options: Options): Plugin {
  const vuePlugin = originCreateVuePlugin(options)
  const originVuePluginLoad = vuePlugin.load
  if (originVuePluginLoad !== undefined) {
    vuePlugin.load = async function (id) {
      const { newId, pageData } = transformId(id)
      if (!pageData) {
        return await originVuePluginLoad.call(this, newId)
      }
    }
  }
  const originVuePluginTransform = vuePlugin.transform
  if (originVuePluginTransform !== undefined) {
    vuePlugin.transform = async function (code, id) {
      const { newId, pageData } = transformId(id)
      if (!pageData) {
        return await originVuePluginTransform.call(this, code, newId)
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

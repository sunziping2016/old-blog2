import { PluginApi, VitepressPluginOption } from '../plugin'

export default function markdownPageDataPlugin(
  this: PluginApi
): VitepressPluginOption {
  return {
    name: '@internal/markdown-page-data',
    async resolveId(id) {
      console.log(id)
      return undefined
    }
  }
}

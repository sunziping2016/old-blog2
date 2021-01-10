import { Plugin as VitePlugin } from 'vite'
import MarkdownIt from 'markdown-it'
import { UserConfigPlugins } from './config'
import path from 'path'

export interface VitepressPluginOption extends VitePlugin {
  configMarkdown?: (config: MarkdownIt.Options) => MarkdownIt.Options
  extendMarkdown?: (md: MarkdownIt) => MarkdownIt
}

export interface VitepressPluginContext {
  isProd: boolean
  sourceDir: string
}

export type AsyncVitepressPlugin<Options> = (
  pluginOptions: Options,
  context: VitepressPluginContext
) => Promise<VitepressPluginOption>

export type SyncVitepressPlugin<Options> = (
  pluginOptions: Options,
  context: VitepressPluginContext
) => VitepressPluginOption

export type RawVitepressPlugin = VitepressPluginOption

export type VitepressPlugin<Options> =
  | SyncVitepressPlugin<Options>
  | AsyncVitepressPlugin<Options>
  | RawVitepressPlugin

export class PluginApi {
  private plugins: VitepressPluginOption[]

  constructor(plugins: VitepressPluginOption[]) {
    this.plugins = plugins
  }

  getVitePlugins(): VitePlugin[] {
    return this.plugins
  }

  static async loadPlugins(
    userConfigPlugins: UserConfigPlugins,
    context: VitepressPluginContext,
    pathRelativeTo: string
  ): Promise<PluginApi> {
    if (!Array.isArray(userConfigPlugins)) {
      userConfigPlugins = Object.entries(userConfigPlugins)
    }
    const plugins: VitepressPluginOption[] = []
    for (const config of userConfigPlugins) {
      const name = Array.isArray(config) ? config[0] : config
      const options: never = Array.isArray(config) ? config[1] : ({} as never)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const plugin: VitepressPlugin<never> = require(name.startsWith('.')
        ? path.resolve(pathRelativeTo, name)
        : name).default
      if (typeof plugin === 'function') {
        const result = plugin(options, context)
        if ('then' in result && typeof result.then === 'function') {
          plugins.push(await result)
        } else {
          plugins.push(result as VitepressPluginOption)
        }
      } else {
        plugins.push(plugin)
      }
    }
    return new PluginApi(plugins)
  }

  applyConfigMarkdown(config: MarkdownIt.Options): MarkdownIt.Options {
    for (const plugin of this.plugins) {
      if (plugin.configMarkdown) {
        config = plugin.configMarkdown(config)
      }
    }
    return config
  }
}
import { Plugin as VitePlugin } from 'vite'
import MarkdownIt from 'markdown-it'
import { SiteConfig, UserConfigPlugins } from './config'
import path from 'path'
import { RenderContext } from './render'

export interface VitepressPluginOption extends VitePlugin {
  configMarkdown?: (config: MarkdownIt.Options) => MarkdownIt.Options
  extendMarkdown?: (md: MarkdownIt) => void
  enhanceAppFile?: string
  rollupInput?: (ssr: boolean) => Record<string, string>
  renderPages?: (context: RenderContext) => Promise<void>
}

export interface VitepressPluginContext extends SiteConfig {
  isProd: boolean
  sourceDir: string
}

export type AsyncVitepressPlugin<Options> = (
  pluginOptions: Options | undefined,
  context: VitepressPluginContext
) => Promise<VitepressPluginOption>

export type SyncVitepressPlugin<Options> = (
  pluginOptions: Options | undefined,
  context: VitepressPluginContext
) => VitepressPluginOption

export type RawVitepressPlugin = VitepressPluginOption

export type VitepressPlugin<Options> =
  | SyncVitepressPlugin<Options>
  | AsyncVitepressPlugin<Options>
  | RawVitepressPlugin

export class PluginApi {
  private readonly plugins: VitepressPluginOption[]

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

  extendMarkdown(md: MarkdownIt): void {
    for (const plugin of this.plugins) {
      if (plugin.extendMarkdown) {
        plugin.extendMarkdown(md)
      }
    }
  }

  collectEnhanceAppFiles(): string[] {
    const results: string[] = []
    for (const plugin of this.plugins) {
      if (plugin.enhanceAppFile !== undefined) {
        results.push(plugin.enhanceAppFile)
      }
    }
    return results
  }

  rollupInput(ssr: boolean): Record<string, string> {
    const results: Record<string, string> = {}
    for (const plugin of this.plugins) {
      if (plugin.rollupInput !== undefined) {
        Object.assign(results, plugin.rollupInput(ssr))
      }
    }
    return results
  }

  async renderPages(context: RenderContext): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.renderPages !== undefined) {
        await plugin.renderPages(context)
      }
    }
  }
}

import { Plugin as VitePlugin } from 'vite'
import MarkdownIt from 'markdown-it'
import { SiteConfig, UserConfigPlugins } from './config'
import path from 'path'
import { RenderContext } from './render'
import winston from 'winston'
import chalk from 'chalk'
import {
  MarkdownChain as MarkdownConfig,
  MarkdownChain
} from '@tillycode/markdown-it-chain'
import internalPlugins from './internalPlugins'
import { PageApi } from './page'

export type AdditionalPage =
  | {
      path: string
      filePath: string
    }
  | {
      path: string
      content: string
    }

export interface VitepressPluginOption extends VitePlugin {
  plugins?: UserConfigPlugins
  before?: string
  after?: string
  configMarkdown?: (config: MarkdownChain) => void
  extendMarkdown?: (md: MarkdownIt) => void
  additionalPages?:
    | AdditionalPage[]
    | (() => AdditionalPage[] | Promise<AdditionalPage[]>)
  layoutFiles?: Record<string, string | null>
  enhanceAppFiles?: string | Record<string, string | null>
  rollupInput?: (ssr: boolean) => Record<string, string>
  renderPages?: (context: RenderContext) => Promise<void>
}

export type VitepressPluginContext = SiteConfig

export type VitepressPlugin<Options> =
  | ((
      this: PluginApi,
      pluginOptions: Options | undefined,
      context: VitepressPluginContext
    ) => VitepressPluginOption | Promise<VitepressPluginOption>)
  | VitepressPluginOption

export class PluginApi {
  public readonly siteConfig: SiteConfig
  public readonly pageApi: PageApi = new PageApi()

  private readonly pluginsMap: Record<string, VitepressPluginOption> = {}
  private readonly plugins: VitepressPluginOption[] = []
  private __md?: MarkdownIt

  constructor(siteConfig: SiteConfig) {
    this.siteConfig = siteConfig
  }

  get md(): MarkdownIt {
    if (this.__md === undefined) {
      throw new Error('getMd() called before initialize()')
    }
    return this.__md
  }

  getVitePlugins(): VitePlugin[] {
    return this.plugins
  }

  addPlugin(plugin: VitepressPluginOption): boolean {
    let duplicated = false
    if (this.pluginsMap[plugin.name] !== undefined) {
      winston.warn(`duplicated plugin: ${chalk.yellow(plugin.name)}`)
      const index = this.plugins.indexOf(this.pluginsMap[plugin.name])
      if (index > -1) {
        this.plugins.splice(index, 1)
      } else {
        throw new Error('corrupted data structure, please report it as a pug')
      }
      delete this.pluginsMap[plugin.name]
      duplicated = true
    }
    winston.info(
      `${duplicated ? 'reloaded' : 'loaded'} plugin ${
        duplicated ? chalk.yellow(plugin.name) : chalk.green(plugin.name)
      }`
    )
    this.pluginsMap[plugin.name] = plugin
    this.plugins.push(plugin)
    return duplicated
  }

  async initialize(): Promise<void> {
    // Sort plugins
    Object.entries(this.pluginsMap).forEach(([key, value]) => {
      const { before, after } = value
      if (before !== undefined && after !== undefined) {
        winston.warn(
          `only one of "before" and 'after' can be set for ` +
            `plugin ${chalk.yellow(key)}. ignore "after"`
        )
      }
      if (before !== undefined) {
        const index = this.plugins.findIndex((plugin) => plugin.name === before)
        if (index > -1) {
          this.plugins.splice(this.plugins.indexOf(value), 1)
          this.plugins.splice(index, 0, value)
        } else {
          winston.error(
            `unknown before ${chalk.red(before)} for plugin ${chalk.yellow(
              key
            )}`
          )
        }
      } else if (after !== undefined) {
        const index = this.plugins.findIndex((plugin) => plugin.name === after)
        if (index > -1) {
          this.plugins.splice(this.plugins.indexOf(value), 1)
          this.plugins.splice(index + 1, 0, value)
        } else {
          winston.error(
            `unknown after ${chalk.red(after)} for plugin ${chalk.yellow(key)}`
          )
        }
      }
    })
    winston.info(
      `plugin order is ${chalk.green(
        this.plugins.map((plugin) => plugin.name).join(', ')
      )}`
    )
    // Configure markdown
    const mdConfig = new MarkdownConfig()
    for (const plugin of this.plugins) {
      if (plugin.configMarkdown) {
        plugin.configMarkdown(mdConfig)
      }
    }
    this.__md = mdConfig.toMd()
    // Extend markdown
    for (const plugin of this.plugins) {
      if (plugin.extendMarkdown) {
        plugin.extendMarkdown(this.__md)
      }
    }
  }

  collectEnhanceAppFiles(): string[] {
    const results: Record<string, string> = {}
    for (const plugin of this.plugins) {
      if (plugin.enhanceAppFiles !== undefined) {
        const newEnhanceAppFiles =
          typeof plugin.enhanceAppFiles === 'string'
            ? { [plugin.name]: plugin.enhanceAppFiles }
            : plugin.enhanceAppFiles
        for (const [key, file] of Object.entries(newEnhanceAppFiles)) {
          if (results[key] !== undefined) {
            delete results[key]
          }
          if (file !== null) {
            results[key] = file
          }
        }
      }
    }
    return Object.values(results)
  }

  queryLayout(name: string): string | null {
    for (const plugin of this.plugins.slice().reverse()) {
      if (
        plugin.layoutFiles !== undefined &&
        plugin.layoutFiles[name] !== undefined
      ) {
        return plugin.layoutFiles[name]
      }
    }
    return null
  }

  async collectAdditionalPages(): Promise<AdditionalPage[]> {
    let results: AdditionalPage[] = []
    for (const plugin of this.plugins) {
      if (plugin.additionalPages !== undefined) {
        if (Array.isArray(plugin.additionalPages)) {
          results = results.concat(plugin.additionalPages)
        } else {
          results = results.concat(await plugin.additionalPages())
        }
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

  async loadPlugins(userConfigPlugins: UserConfigPlugins): Promise<void> {
    const pluginArray = Array.isArray(userConfigPlugins)
      ? userConfigPlugins
      : Object.entries(userConfigPlugins)
    for (const config of pluginArray) {
      const nameOrPlugin = Array.isArray(config) ? config[0] : config
      const options = Array.isArray(config) ? config[1] : {}
      const rawPlugin: VitepressPlugin<never> =
        typeof nameOrPlugin === 'string'
          ? // eslint-disable-next-line @typescript-eslint/no-var-requires
            require(nameOrPlugin.startsWith('.')
              ? path.resolve(this.siteConfig.vitepressDir, nameOrPlugin)
              : nameOrPlugin).default
          : nameOrPlugin
      let plugin: VitepressPluginOption
      if (typeof rawPlugin === 'function') {
        plugin = await rawPlugin.call(this, options, this.siteConfig)
      } else {
        plugin = rawPlugin
      }
      if (plugin.plugins !== undefined) {
        await this.loadPlugins(userConfigPlugins)
      }
      this.addPlugin(plugin)
    }
  }
}

export async function resolvePlugin(
  siteConfig: SiteConfig
): Promise<PluginApi> {
  const plugins = new PluginApi(siteConfig)
  await plugins.loadPlugins(internalPlugins(siteConfig))
  const userConfig = siteConfig.userConfig
  if (userConfig.plugins !== undefined) {
    await plugins.loadPlugins(userConfig.plugins)
  }
  plugins.addPlugin(
    Object.assign(
      {
        name: 'config.js'
      },
      userConfig
    )
  )
  return plugins
}

import MarkdownIt, { Options } from 'markdown-it'
import ChainedMap, { TypedChainedMap } from './ChainedMap'
import winston from 'winston'
import chalk from 'chalk'

// noinspection JSUnusedGlobalSymbols
export class OptionsChain extends ChainedMap<MarkdownChain> {
  constructor(parent: MarkdownChain) {
    // noinspection TypeScriptValidateTypes
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    super(parent)
  }

  html(value: boolean): this {
    return this.set('html', value)
  }
  xhtmlOut(value: boolean): this {
    return this.set('xhtmlOut', value)
  }
  breaks(value: boolean): this {
    return this.set('breaks', value)
  }
  langPrefix(value: string): this {
    return this.set('langPrefix', value)
  }
  linkify(value: boolean): this {
    return this.set('linkify', value)
  }
  typographer(value: boolean): this {
    return this.set('typographer', value)
  }
  quotes(value: string | string[]): this {
    return this.set('quotes', value)
  }
  highlight(value: (code: string, lang: string) => string): this {
    return this.set('highlight', value)
  }
}

type MarkdownItPlugin =
  | MarkdownIt.PluginSimple
  | MarkdownIt.PluginWithOptions<never>
  | MarkdownIt.PluginWithParams

export class PluginChain extends ChainedMap<MarkdownChain> {
  __after?: string
  __before?: string

  before(name: string): this {
    if (this.__after) {
      throw new Error(
        `Unable to set .before(${JSON.stringify(
          name
        )}) with existing value for .after()`
      )
    }

    this.__before = name
    return this
  }

  after(name: string): this {
    if (this.__before) {
      throw new Error(
        `Unable to set .after(${JSON.stringify(
          name
        )}) with existing value for .before()`
      )
    }

    this.__after = name
    return this
  }

  constructor(parent: MarkdownChain) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    super(parent)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  use(plugin: MarkdownItPlugin, args: any[] = []): this {
    return this.set('plugin', plugin).set('args', args)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tap(f: (args: any[]) => any[]): this {
    this.set('args', f(this.get('args') || []))
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  merge(obj: Record<string, any>, omit = []): this {
    if ('plugin' in obj) {
      this.set('plugin', obj.plugin)
    }
    if ('args' in obj) {
      this.set('args', obj.args)
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return super.merge(obj, [...omit, 'args', 'plugin', 'before', 'after'])
  }

  toConfig(): {
    plugin: MarkdownItPlugin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any[]
  } {
    return {
      plugin: this.get('plugin'),
      args: this.get('args')
    }
  }
}

export class MarkdownChain {
  plugins: TypedChainedMap<this, PluginChain>
  options: OptionsChain

  constructor() {
    this.options = new OptionsChain(this)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.plugins = new ChainedMap(this)
  }

  toConfig(): {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: Record<string, any>
    plugins: Array<{
      plugin: MarkdownItPlugin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args: any[]
      name: string
    }>
  } {
    return {
      options: this.options.entriesMap(),
      plugins: this.plugins.entries().map(([name, plugin]) => ({
        ...plugin.toConfig(),
        name
      }))
    }
  }

  plugin(name: string): PluginChain {
    if (!this.plugins.has(name)) {
      this.plugins.set(name, new PluginChain(this))
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.plugins.get(name)!
  }

  toMd(
    markdownIt?: (options: Options) => MarkdownIt,
    instantiationOptions?: Options
  ): MarkdownIt {
    const { options, plugins } = this.toConfig()
    let markdownItResolved: (options: Options) => MarkdownIt
    if (!markdownIt) {
      try {
        markdownItResolved = require(require.resolve('markdown-it'))
      } catch (error) {
        throw new Error('Failed to detect markdowns-it has been installed')
      }
    } else {
      markdownItResolved = markdownIt
    }
    const md = markdownItResolved(
      Object.assign(instantiationOptions || {}, options || {})
    )
    for (const { plugin, args, name } of plugins) {
      winston.info(`use markdown plugin ${chalk.green(name)}`)
      md.use(plugin, ...args)
    }
    return md
  }
}

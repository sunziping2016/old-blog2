import { HeadConfig, RouterSettings } from '../shared/types'
import winston from 'winston'
import chalk from 'chalk'

export interface RenderSettings {
  title: string
  description?: string
  headers?: HeadConfig[]
  preloadChunks?: string[]
  renderPaths?: Array<{
    routerPath: string
    outputPath?: string
  }>
}

export type PageGeneralListener = (page: Page) => void | Promise<void>
export type PageLoadedListener = (
  page: Page,
  routerSettings: RouterSettings
) => void | Promise<void>
export type PageRenderedListener = (
  page: Page,
  renderSettings: RenderSettings,
  routerSettings: RouterSettings
) => void | Promise<void>

export interface PageEventListener {
  add: PageGeneralListener[] // called from PageApi
  remove: PageGeneralListener[] // called from PageApi
  invalidate: PageGeneralListener[] // called from PageApi
  load: PageLoadedListener[] // called from Page
  render: PageRenderedListener[] // called from Page
}

// LifeCycle of a page:
// -->--+-> load -+--+-----------+--> drop
//      ^         v  v           ^
//      +---<-----+  +-> render -+

// Each Page represents a real web page. Plugins can add, modify and remove these pages.
// This class is intended to be used only by subtyping.
export class Page {
  // NOTE: YOU MUST OVERRIDE TYPE AND ID IN SUBCLASS
  public readonly type: string
  public readonly id: string
  private eventListeners: PageEventListener = {
    add: [],
    remove: [],
    invalidate: [],
    load: [],
    render: []
  }

  constructor(type: string, id: string) {
    this.type = type
    this.id = id
  }

  setEventListeners(eventListeners: PageEventListener): void {
    this.eventListeners = eventListeners
  }

  public routerSettings?: RouterSettings
  public renderSettings?: RenderSettings

  protected load(): RouterSettings | Promise<RouterSettings> {
    throw new Error('this method should be implemented by sub-class')
  }
  protected render?(
    routerSettings: RouterSettings
  ): RenderSettings | Promise<RenderSettings>
  public onInvalidated(): void | Promise<void> {
    // do nothing
  }
  // Called when this page is removed (before calling listeners)
  public onRemoved(): void | Promise<void> {
    // do nothing
  }

  async ensureLoaded(): Promise<RouterSettings> {
    if (this.routerSettings === undefined) {
      this.routerSettings = await this.load()
      for (const listener of this.eventListeners.load) {
        await listener(this, this.routerSettings)
      }
    }
    return this.routerSettings
  }

  async ensureRendered(): Promise<RenderSettings> {
    if (!this.render) {
      throw new Error('no render method provided')
    }
    if (this.renderSettings === undefined) {
      const routerSettings = await this.ensureLoaded()
      this.renderSettings = await this.render(routerSettings)
      for (const listener of this.eventListeners.render) {
        await listener(this, this.renderSettings, routerSettings)
      }
    }
    return this.renderSettings
  }
}

export class PageApi {
  private readonly pages: Record<string, Page> = {}
  private readonly eventListeners: PageEventListener = {
    add: [],
    remove: [],
    invalidate: [],
    load: [],
    render: []
  }

  async add(page: Page): Promise<void> {
    if (this.pages[page.id] !== undefined) {
      throw new Error(`duplicated page id "${page.id}"`)
    }
    page.setEventListeners(this.eventListeners)
    this.pages[page.id] = page
    winston.info(`add page ${chalk.green(page.id)}`)
    for (const listener of this.eventListeners.add) {
      await listener(page)
    }
  }

  async remove(id: string): Promise<void> {
    const page = this.pages[id]
    if (page === undefined) {
      winston.warn(`remove with unknown page id: ${chalk.yellow(id)}`)
      return
    }
    delete this.pages[id]
    winston.info(`remove page ${chalk.green(page.id)}`)
    for (const listener of this.eventListeners.remove) {
      await listener.call(this, page)
    }
    await page.onRemoved()
  }

  async invalidate(id: string): Promise<void> {
    const page = this.pages[id]
    if (page === undefined) {
      winston.warn(`invalidate with unknown page id: ${chalk.yellow(id)}`)
      return
    }
    winston.info(`invalidate page ${chalk.green(page.id)}`)
    delete page.routerSettings
    delete page.renderSettings
    for (const listener of this.eventListeners.invalidate) {
      await listener.call(this, page)
    }
    await page.onInvalidated()
  }

  has(id: string): boolean {
    return this.pages[id] !== undefined
  }

  get(id: string): Page {
    const page = this.pages[id]
    if (page === undefined) {
      throw new Error(`ensureLoaded with unknown page id: ${id}`)
    }
    return page
  }

  on(type: 'add', listener: PageGeneralListener): void
  on(type: 'remove', listener: PageGeneralListener): void
  on(type: 'invalidate', listener: PageGeneralListener): void
  on(type: 'load', listener: PageLoadedListener): void
  on(type: 'render', listener: PageRenderedListener): void
  // eslint-disable-next-line @typescript-eslint/ban-types
  on(type: string, listener: Function): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const index = this.eventListeners[type].indexOf(listener)
    if (index > -1) {
      winston.error(`trying to add duplicated "${type}" event listener`)
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.eventListeners[type].push(listener as PageAddListener)
    }
  }

  off(type: 'add', listener: PageGeneralListener): void
  off(type: 'remove', listener: PageGeneralListener): void
  off(type: 'invalidate', listener: PageGeneralListener): void
  off(type: 'load', listener: PageLoadedListener): void
  off(type: 'render', listener: PageRenderedListener): void
  // eslint-disable-next-line @typescript-eslint/ban-types
  off(type: string, listener: Function): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const index = this.eventListeners[type].indexOf(listener)
    if (index > -1) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.eventListeners[type].splice(index, 1)
    } else {
      winston.error(`trying to remove non-exist "${type}" event listener`)
    }
  }
}

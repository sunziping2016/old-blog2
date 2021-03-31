import { PluginApi, VitepressPluginOption } from '../plugin'
import { RouterSettings } from '../../shared/types'
import { debounce } from '../utils'
import { WebSocketServer } from 'vite'
import winston from 'winston'

export const ROUTER_DATA_ID = '@routerData'
export const ROUTER_DATA_EVENT = '@internal/router-data:routerData'

class RouterDataHotUpdateHandler {
  protected readonly handleHotUpdate: () => void

  private readonly updated: Set<string> = new Set<string>()
  private readonly removed: Set<string> = new Set<string>()
  private readonly plugins: PluginApi
  private readonly ws: WebSocketServer

  constructor(plugins: PluginApi, ws: WebSocketServer) {
    this.plugins = plugins
    this.ws = ws
    this.handleHotUpdate = debounce((): void => {
      ;(async (): Promise<void> => {
        const updatedData: Record<string, RouterSettings> = {}
        for (const id of this.updated) {
          updatedData[id] = await this.plugins.pageApi.get(id).ensureLoaded()
        }
        for (const id of this.removed) {
          if (this.plugins.pageApi.has(id)) {
            throw new Error(`page ${id} has not been removed`)
          }
        }
        winston.info('router data updated')
        this.ws.send({
          type: 'custom',
          event: ROUTER_DATA_EVENT,
          data: {
            updated: updatedData,
            removed: [...this.removed]
          }
        })
        this.updated.clear()
        this.removed.clear()
      })().catch((err) => {
        winston.error('error during handleHotUpdate()@routerData')
        winston.error(err)
      })
    }, 200)
  }

  handleUpdated(id: string): void {
    if (this.removed.has(id)) {
      this.removed.delete(id)
    }
    this.updated.add(id)
    this.handleHotUpdate()
  }

  handleRemoved(id: string): void {
    if (this.updated.has(id)) {
      this.updated.delete(id)
    }
    this.removed.add(id)
    this.handleHotUpdate()
  }
}

export default function routerDataPlugin(
  this: PluginApi
): VitepressPluginOption {
  let initialized = false
  return {
    name: '@internal/router-data',
    resolveId(id) {
      if (id === ROUTER_DATA_ID) {
        return id
      }
    },
    configureServer: async (server) => {
      const handler = new RouterDataHotUpdateHandler(this, server.ws)
      const invalidate = (): void => {
        const module = server.moduleGraph.getModuleById(ROUTER_DATA_ID)
        if (module !== undefined) {
          server.moduleGraph.invalidateModule(module)
        }
      }
      this.pageApi.on('add', (page) => {
        if (initialized) {
          handler.handleUpdated(page.id)
          invalidate()
        }
      })
      this.pageApi.on('invalidate', (page) => {
        if (initialized) {
          handler.handleUpdated(page.id)
          invalidate()
        }
      })
      this.pageApi.on('remove', (page) => {
        if (initialized) {
          handler.handleRemoved(page.id)
          invalidate()
        }
      })
    },
    load: async (id) => {
      if (id === ROUTER_DATA_ID) {
        initialized = true
        const data: Record<string, RouterSettings> = {}
        const layouts: Set<string> = new Set<string>()
        for (const [id, page] of this.pageApi.entries()) {
          data[id] = await page.ensureLoaded()
          layouts.add(data[id].layout)
        }
        return (
          [...layouts]
            .map((layout) => `import _${layout} from '/@layout/${layout}'\n`)
            .join('') +
          'import { ref, markRaw } from "vue"\n\n' +
          'const data = ref({\n' +
          Object.entries(data)
            .map(
              ([id, settings]) =>
                `  '${id}': Object.assign({\n` +
                `    resolvedLayout: markRaw(_${settings.layout})\n` +
                `  }, ${JSON.stringify(settings)}),\n`
            )
            .join('') +
          '})\n\n' +
          'export default data\n\n' +
          'if (import.meta.hot) {\n' +
          `  import.meta.hot.on('${ROUTER_DATA_EVENT}', (newData) => {\n` +
          '    (async () => {\n' +
          '      for (const newPage of Object.values(newData.updated)) {\n' +
          '        newPage.resolvedLayout = (await import(/* @vite-ignore */ "/@layout/" + newPage.layout)).default\n' +
          '      }\n' +
          '      const temp = Object.assign({}, data.value)\n' +
          '      Object.entries(newData.updated).forEach(([id, settings]) => {\n' +
          '        temp[id] = settings\n' +
          '      })\n' +
          '      newData.removed.forEach((id) => {\n' +
          '        delete temp[id]\n' +
          '      })\n' +
          '      data.value = temp\n' +
          '    })().catch((err) => console.error(err))\n' +
          '  })\n' +
          '}\n'
        )
      }
    }
  }
}

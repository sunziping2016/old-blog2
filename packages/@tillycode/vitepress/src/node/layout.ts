import { PluginApi, VitepressPluginOption } from './plugin'
import winston from 'winston'

const LAYOUT_RE = /^\/@layout\/(.+)$/

export default function layoutPlugin(this: PluginApi): VitepressPluginOption {
  return {
    name: '@internal/layout',
    config() {
      return {
        resolve: {
          alias: [
            {
              find: /^@layout\/(.+)$/,
              replacement: '/@layout/$1'
            }
          ]
        }
      }
    },
    resolveId: (id) => {
      const match = id.match(LAYOUT_RE)
      if (match) {
        const layout = this.queryLayout(match[1])
        if (layout !== null) {
          return `${layout}`
        } else {
          winston.error(`unknown layout ${match[1]}`)
        }
      }
    }
  }
}

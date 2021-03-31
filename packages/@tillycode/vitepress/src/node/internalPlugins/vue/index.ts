// Synchronized with plugin-vue@aaa1efbd4959104ab7396c35a3398e7de14a5c91
import { PluginApi, VitepressPluginOption } from '../../plugin'
import { createFilter } from '@rollup/pluginutils'
import { SFCBlock } from '@vue/compiler-sfc'
import { Options, ResolvedOptions } from '@vitejs/plugin-vue'
import fs from 'fs-extra'
import { parseVueRequest } from './utils/query'
import { getDescriptor } from './utils/descriptorCache'
import { getResolvedScript } from './script'
import { transformMain } from './main'
import { handleHotUpdate } from './handleHotUpdate'
import { transformTemplateAsModule } from './template'
import { transformStyle } from './style'

// extend the descriptor so we can store the scopeId on it
declare module '@vue/compiler-sfc' {
  interface SFCDescriptor {
    id: string
  }
}

export type VariantOptions = 'ignore' | 'bypass' | 'process'

export interface VuePluginOptions extends Options {
  variants: Record<string, VariantOptions>
}

export interface VuePluginResolvedOptions extends ResolvedOptions {
  variants: Record<string, VariantOptions>
}

export default function vuePlugin(
  this: PluginApi,
  rawOptions: VuePluginOptions
): VitepressPluginOption {
  let options: VuePluginResolvedOptions = {
    isProduction: process.env.NODE_ENV === 'production',
    ...rawOptions,
    root: process.cwd()
  }

  const filter = createFilter(
    rawOptions.include || /\.vue$/,
    rawOptions.exclude
  )

  return {
    name: '@internal/vue',

    handleHotUpdate(ctx) {
      if (!filter(ctx.file)) {
        return
      }
      return handleHotUpdate(ctx, options)
    },
    config(config) {
      return {
        define: {
          __VUE_OPTIONS_API__: true,
          __VUE_PROD_DEVTOOLS__: false,
          ...config.define
        },
        ssr: {
          external: ['vue', '@vue/server-renderer']
        }
      }
    },
    configResolved(config) {
      options = {
        ...options,
        root: config.root,
        isProduction: config.isProduction
      }
    },
    configureServer(server) {
      options.devServer = server
    },
    resolveId(id) {
      // serve subpart requests (*?vue) as virtual modules
      if (parseVueRequest(id).query.vue) {
        return id
      }
    },
    async load(id, ssr = !!options.ssr) {
      const { filename, query } = parseVueRequest(id)
      if (query.vue) {
        if (query.src) {
          return await fs.readFile(filename, 'utf-8')
        }
        const descriptor = getDescriptor(filename, query.variant || '')
        let block: SFCBlock | null | undefined
        if (query.type === 'script') {
          // handle <scrip> + <script setup> merge via compileScript()
          block = getResolvedScript(descriptor, ssr)
        } else if (query.type === 'template') {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          block = descriptor.template!
        } else if (query.type === 'style') {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          block = descriptor.styles[query.index!]
        } else if (query.index != null) {
          block = descriptor.customBlocks[query.index]
        }
        if (block) {
          return {
            code: block.content,
            map: block.map
              ? {
                  ...block.map,
                  version: parseInt(block.map.version, 10)
                }
              : undefined
          }
        }
      }
    }, // ~load
    transform(code, id, ssr = !!options.ssr) {
      const { filename, query } = parseVueRequest(id)
      if ((!query.vue && !filter(filename)) || query.raw) {
        return
      }
      if (!query.vue && options.variants[query.variant || ''] === 'process') {
        // main request
        return transformMain(
          code,
          filename,
          query.variant || '',
          options,
          this,
          ssr
        )
      } else if (query.vue) {
        // sub block request
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const descriptor = getDescriptor(filename, query.variant || '')!
        if (query.type === 'template') {
          return transformTemplateAsModule(code, descriptor, options, this, ssr)
        } else if (query.type === 'style') {
          return transformStyle(
            code,
            descriptor,
            Number(query.index),
            options,
            this
          )
        }
      }
    }
  }
}

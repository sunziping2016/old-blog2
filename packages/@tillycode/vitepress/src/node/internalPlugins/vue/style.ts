import { compileStyleAsync, SFCDescriptor } from '@vue/compiler-sfc'
import { SourceDescription, TransformPluginContext } from 'rollup'
import { VuePluginResolvedOptions } from '.'

export async function transformStyle(
  code: string,
  descriptor: SFCDescriptor,
  index: number,
  options: VuePluginResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<SourceDescription | null> {
  const block = descriptor.styles[index]
  // vite already handles pre-processors and CSS module so this is only
  // applying SFC-specific transforms like scoped mode and CSS vars rewrite (v-bind(var))
  const result = await compileStyleAsync({
    ...options.style,
    filename: descriptor.filename,
    id: `data-v-${descriptor.id}`,
    isProd: options.isProduction,
    source: code,
    scoped: block.scoped
  })

  if (result.errors.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.errors.forEach((error: any) => {
      if (error.line && error.column) {
        error.loc = {
          file: descriptor.filename,
          line: error.line + block.loc.start.line,
          column: error.column
        }
      }
      pluginContext.error(error)
    })
    return null
  }

  return {
    code: result.code,
    map: result.map
      ? {
          ...result.map,
          version: parseInt(result.map.version, 10)
        }
      : {
          mappings: ''
        }
  }
}

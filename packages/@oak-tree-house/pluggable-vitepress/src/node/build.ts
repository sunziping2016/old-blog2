import ora from 'ora'
import { RollupOutput } from 'rollup'
import {
  build as viteBuild,
  Plugin as VitePlugin,
  UserConfig as ViteUserConfig
} from 'vite'
import { SiteConfig } from './config'
import { OutputChunk, OutputAsset } from 'rollup'
import path from 'path'

function serverPath(siteConfig: SiteConfig): string {
  return path.join(siteConfig.tempDir, 'server')
}

export function resolveViteConfig(
  siteConfig: SiteConfig,
  plugins: VitePlugin[],
  input: Record<string, string>,
  ssr: boolean,
  pageToHashMap?: Record<string, string>
): ViteUserConfig {
  return {
    root: siteConfig.root,
    plugins: [
      ...plugins,
      {
        name: 'hash-map',
        generateBundle(_options, bundle) {
          if (ssr) {
            for (const name of Object.keys(bundle)) {
              if (bundle[name].type === 'asset') {
                delete bundle[name]
              }
            }
          }
          if (pageToHashMap === undefined) {
            return
          }
          for (const chunk of Object.values(bundle)) {
            let m
            if (
              chunk.type === 'chunk' &&
              chunk.isEntry &&
              (m = chunk.fileName.match(/\.(\w+)\.js$/))
            ) {
              // record page -> hash relations
              pageToHashMap[chunk.name.toLowerCase()] = m[1]
            }
          }
        }
      }
    ],
    build: {
      ssr,
      base: siteConfig.siteData.base,
      outDir: ssr ? serverPath(siteConfig) : siteConfig.outDir,
      cssCodeSplit: false,
      emptyOutDir: true,
      rollupOptions: {
        input,
        preserveEntrySignatures: 'allow-extension',
        output: {
          entryFileNames: ssr ? '[name].js' : 'assets/scripts/[name].[hash].js',
          assetFileNames(chunk): string {
            if (chunk.name !== undefined) {
              const ext = path.extname(chunk.name).toLowerCase()
              if (ext === '.css') {
                return 'assets/styles/[name].[hash].[ext]'
              } else if (
                ['.png', '.jpeg', '.jpg', '.gif', '.svg'].indexOf(ext) != -1
              ) {
                return 'assets/images/[name].[hash].[ext]'
              }
            }
            return 'assets/files/[name].[hash].[ext]'
          },
          chunkFileNames(chunk): string {
            if (ssr) {
              return `chunk.[name].js`
            }
            if (!chunk.isEntry && /runtime/.test(chunk.name)) {
              return `assets/scripts/framework.[hash].js`
            }
            return `assets/scripts/chunk.[name].[hash].js`
          }
        }
      },
      minify: ssr ? false : !process.env.DEBUG
    }
  }
}

export const okMark = '\x1b[32m✓\x1b[0m'
export const failMark = '\x1b[31m✖\x1b[0m'

export async function bundle(
  siteConfig: SiteConfig,
  plugins: VitePlugin[],
  input: (ssr: boolean) => Record<string, string>
): Promise<[RollupOutput, string, Record<string, string>]> {
  let clientResult: RollupOutput
  const pageToHashMap: Record<string, string> = {}

  const spinner = ora()
  spinner.start('building client + server bundles...')
  try {
    ;[clientResult] = (await Promise.all([
      viteBuild(
        resolveViteConfig(
          siteConfig,
          plugins,
          input(false),
          false,
          pageToHashMap
        )
      ),
      viteBuild(resolveViteConfig(siteConfig, plugins, input(true), true))
    ])) as [RollupOutput, RollupOutput]
  } catch (e) {
    spinner.stopAndPersist({
      symbol: failMark
    })
    throw e
  }
  spinner.stopAndPersist({
    symbol: okMark
  })
  return [clientResult, serverPath(siteConfig), pageToHashMap]
}

export async function build(
  siteConfig: SiteConfig,
  plugins: VitePlugin[],
  input: (ssr: boolean) => Record<string, string>,
  renderer: (
    clientResult: RollupOutput,
    serverPath: string,
    appChunk: OutputChunk,
    cssChunk: OutputAsset,
    pageToHashMap: Record<string, string>
  ) => Promise<void>
): Promise<void> {
  try {
    const [clientResult, serverPath, pageToHashMap] = await bundle(
      siteConfig,
      plugins,
      input
    )

    const spinner = ora()
    spinner.start('rendering pages...')

    try {
      const appChunk = clientResult.output.find(
        (chunk) => chunk.type === 'chunk' && chunk.isEntry && chunk
      ) as OutputChunk

      const cssChunk = clientResult.output.find(
        (chunk) => chunk.type === 'asset' && chunk.fileName.endsWith('.css')
      ) as OutputAsset

      await renderer(
        clientResult,
        serverPath,
        appChunk,
        cssChunk,
        pageToHashMap
      )
    } catch (e) {
      spinner.stopAndPersist({
        symbol: failMark
      })
      throw e
    }
    spinner.stopAndPersist({
      symbol: okMark
    })
  } finally {
    // await fs.remove(siteConfig.tempDir)
  }
}

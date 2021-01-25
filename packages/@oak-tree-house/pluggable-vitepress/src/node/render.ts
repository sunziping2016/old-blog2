/* eslint-disable @typescript-eslint/no-var-requires */
import { OutputAsset, OutputChunk, RollupOutput } from 'rollup'
import { SiteConfig } from './config'
import path from 'path'
import { normalizePath } from 'vite'
import fs from 'fs-extra'

async function resolvePageImports(
  config: SiteConfig,
  page: string,
  result: RollupOutput,
  appChunk: OutputChunk
) {
  // find the page's js chunk and inject script tags for its imports so that
  // they are start fetching as early as possible
  const srcPath =
    normalizePath(await fs.realpath(path.resolve(config.root, page))) +
    '?content'
  const pageChunk = result.output.find(
    (chunk) => chunk.type === 'chunk' && chunk.facadeModuleId === srcPath
  ) as OutputChunk
  return Array.from(
    new Set([
      ...appChunk.imports,
      ...appChunk.dynamicImports,
      ...pageChunk.imports,
      ...pageChunk.dynamicImports
    ])
  )
}

export async function renderPage(
  config: SiteConfig,
  pages: string[],
  clientResult: RollupOutput,
  serverPath: string,
  appChunk: OutputChunk,
  cssChunk: OutputAsset,
  pageToHashMap: Record<string, string>
): Promise<void> {
  const { createApp } = require(path.join(serverPath, 'app.js'))
  const { app, router } = await createApp()
  const siteData = config.siteData
  const hashMapString = JSON.stringify(JSON.stringify(pageToHashMap))
  for (const page of pages) {
    const routePath = `/${page.replace(/\.md$/, '')}`
    await router.push(routePath)
    const content = await require('@vue/server-renderer').renderToString(app)
    const pageName = page.replace(/\//g, '_')
    const pageHash = pageToHashMap['page.' + pageName.toLowerCase()]
    const pageData = require(path.join(serverPath, `page_data.${pageName}.js`))

    const preloadLinks = [
      ...(await resolvePageImports(config, page, clientResult, appChunk)),
      `assets/scripts/page.${pageName}.${pageHash}.js`,
      appChunk.fileName
    ]
      .map((file) => {
        return `<link rel="modulepreload" href="${siteData.base}${file}">`
      })
      .join('\n    ')
    // noinspection JSConstantReassignment
    const html = `\
<!DOCTYPE html>
<html lang="${siteData.lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>
      ${pageData.title ? pageData.title + ` | ` : ``}${siteData.title}
    </title>
    <meta name="description" content="${siteData.description}">
    <link rel="stylesheet" href="${siteData.base}${cssChunk.fileName}">
    ${preloadLinks}
  </head>
  <body>
    <div id="app">${content}</div>
    <script>__VP_HASH_MAP__ = JSON.parse(${hashMapString})</script>
    <script type="module" async src="${siteData.base}${
      appChunk.fileName
    }"></script>
  </body>
</html>`
    const htmlFileName = path.join(
      config.outDir,
      page.replace(/\.md$/, '.html')
    )
    await fs.ensureDir(path.dirname(htmlFileName))
    await fs.writeFile(htmlFileName, html)
  }
}

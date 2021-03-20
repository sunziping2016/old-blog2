import { OutputAsset, OutputChunk, RollupOutput } from 'rollup'
import { SiteConfig } from './config'
import path from 'path'
import fs from 'fs-extra'
import { App } from 'vue'
import { Router } from 'vue-router'

export interface RenderContext {
  app: App
  router: Router
  config: SiteConfig
  clientResult: RollupOutput
  serverPath: string
  appChunk: OutputChunk
  cssChunk: OutputAsset | undefined
  pageToHashMap: Record<string, string>
}

export function renderHtml(
  title: string,
  preloadLinks: string[],
  content: string,
  context: RenderContext
): string {
  const siteData = context.config.siteData
  const links: string = preloadLinks
    .map((file) => {
      return `<link rel="modulepreload" href="${siteData.base}${file}">`
    })
    .join('\n    ')
  return `\
<!DOCTYPE html>
<html lang="${siteData.lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>
      ${title}
    </title>
    <meta name="description" content="${siteData.description}">
    ${
      context.cssChunk === undefined
        ? ''
        : `<link rel="stylesheet" ` +
          `href="${siteData.base}${context.cssChunk.fileName}">\n    `
    }${links}
  </head>
  <body>
    <div id="app">${content}</div>
    <script>__VP_HASH_MAP__ = JSON.parse(${JSON.stringify(
      JSON.stringify(context.pageToHashMap)
    )})</script>
    <script type="module" async src="${siteData.base}${
    context.appChunk.fileName
  }"></script>
  </body>
</html>`
}

export async function renderPage(
  title: string,
  routePath: string,
  pageName: string | null,
  pagePath: string | null,
  outputPath: string,
  context: RenderContext
): Promise<void> {
  await context.router.push(routePath)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const content = await require('@vue/server-renderer').renderToString(
    context.app
  )
  const preloadLinksSet = new Set([
    ...context.appChunk.imports,
    ...context.appChunk.dynamicImports
  ])
  if (pageName !== null && pagePath !== null) {
    const pageHash = context.pageToHashMap[pageName.toLowerCase()]
    const pageChunk = context.clientResult.output.find(
      (chunk) => chunk.type === 'chunk' && chunk.facadeModuleId === pagePath
    ) as OutputChunk
    pageChunk.imports.forEach((x) => preloadLinksSet.add(x))
    pageChunk.dynamicImports.forEach((x) => preloadLinksSet.add(x))
    preloadLinksSet.add(`assets/scripts/${pageName}.${pageHash}.js`)
  }
  preloadLinksSet.add(context.appChunk.fileName)
  const preloadLinks = Array.from(preloadLinksSet)
  const html = renderHtml(title, preloadLinks, content, context)
  await fs.ensureDir(path.dirname(outputPath))
  await fs.writeFile(outputPath, html)
}

export async function renderPages(context: RenderContext): Promise<void> {
  // for (const page of context.config.siteData.pages) {
  //   const partialPageName = page.replace(/\//g, '_')
  //   // eslint-disable-next-line @typescript-eslint/no-var-requires
  //   const pageData = require(path.join(
  //     context.serverPath,
  //     `page_data.${partialPageName}.js`
  //   ))
  //   const title =
  //     (pageData.title ? pageData.title + ` | ` : ``) +
  //     context.config.siteData.title
  //   const routePath = `/${page.replace(/\.md$/, '')}`
  //   const pageName = 'page.' + partialPageName
  //   const pagePath =
  //     normalizePath(
  //       await fs.realpath(path.resolve(context.config.sourceDir, page))
  //     ) + '?content'
  //   const outputPath = path.join(
  //     context.config.outDir,
  //     page.replace(/\.md$/, ''),
  //     'index.html'
  //   )
  //   await renderPage(title, routePath, pageName, pagePath, outputPath, context)
  // }
}

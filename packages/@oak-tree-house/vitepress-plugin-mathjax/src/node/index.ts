import {
  VitepressPlugin,
  MarkdownEnv
} from '@oak-tree-house/vitepress'
import { createCanvas } from 'canvas'
import StateInline from 'markdown-it/lib/rules_inline/state_inline'
import StateBlock from 'markdown-it/lib/rules_block/state_block'
import path from 'path'
import md5 from 'md5'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as mathjax from './mathjax'
import { ViteDevServer } from 'vite'
import fs from 'fs-extra'

interface MathJaxPluginOptions {
  formulaPath?: string
}

interface MathJaxPluginNormalizedOptions {
  formulaPath: string
  tempDir: string
  prod: boolean
}

type MathJaxPlugin = VitepressPlugin<MathJaxPluginOptions>

// from https://github.com/waylonflinn/markdown-it-katex/blob/master/index.js
function isValidDelimiter(
  state: StateInline,
  pos: number
): {
  canOpen: boolean
  canClose: boolean
} {
  const max = state.posMax
  const prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1
  const nextChar = pos + 1 <= max ? state.src.charCodeAt(pos + 1) : -1
  let canOpen = true
  let canClose = true
  if (
    prevChar === 0x20 /* " " */ ||
    prevChar === 0x09 /* \t */ ||
    (nextChar >= 0x30 /* "0" */ && nextChar <= 0x39) /* "9" */
  ) {
    canClose = false
  }
  if (nextChar === 0x20 /* " " */ || nextChar === 0x09 /* \t */) {
    canOpen = false
  }
  return {
    canOpen: canOpen,
    canClose: canClose
  }
}

function mathInline(state: StateInline, silent: boolean): boolean {
  if (state.src[state.pos] !== '$') {
    return false
  }
  const res = isValidDelimiter(state, state.pos)
  if (!res.canOpen) {
    if (!silent) {
      state.pending += '$'
    }
    state.pos += 1
    return true
  }
  const start = state.pos + 1
  let match = start
  while ((match = state.src.indexOf('$', match)) !== -1) {
    let pos = match - 1
    while (state.src[pos] === '\\') {
      pos -= 1
    }
    // Even number of escapes, potential closing delimiter found
    if ((match - pos) % 2 === 1) {
      break
    }
    match += 1
  }
  if (match === -1) {
    if (!silent) {
      state.pending += '$'
    }
    state.pos = start
    return true
  }
  if (match - start === 0) {
    if (!silent) {
      state.pending += '$$'
    }
    state.pos = start + 1
    return true
  }
  const res2 = isValidDelimiter(state, match)
  if (!res2.canClose) {
    if (!silent) {
      state.pending += '$'
    }
    state.pos = start
    return true
  }
  if (!silent) {
    const token = state.push('math_inline', 'math', 0)
    token.markup = '$'
    token.content = state.src.slice(start, match)
  }
  state.pos = match + 1
  return true
}
function mathBlock(
  state: StateBlock,
  start: number,
  end: number,
  silent: boolean
) {
  let found = false
  let pos = state.bMarks[start] + state.tShift[start]
  let max = state.eMarks[start]
  if (pos + 2 > max) {
    return false
  }
  if (state.src.slice(pos, pos + 2) !== '$$') {
    return false
  }
  pos += 2
  let firstLine = state.src.slice(pos, max)
  if (silent) {
    return true
  }
  if (firstLine.trim().slice(-2) === '$$') {
    firstLine = firstLine.trim().slice(0, -2)
    found = true
  }
  let next = start
  let lastPos
  let lastLine
  while (!found) {
    next++
    if (next >= end) {
      break
    }
    pos = state.bMarks[next] + state.tShift[next]
    max = state.eMarks[next]
    if (pos < max && state.tShift[next] < state.blkIndent) {
      break
    }
    if (state.src.slice(pos, max).trim().slice(-2) === '$$') {
      lastPos = state.src.slice(0, max).lastIndexOf('$$')
      lastLine = state.src.slice(pos, lastPos)
      found = true
    }
  }
  state.line = next + 1
  const token = state.push('math_block', 'math', 0)
  token.block = true
  token.content =
    (firstLine && firstLine.trim() ? firstLine + '\n' : '') +
    state.getLines(start + 1, next, state.tShift[start], true) +
    (lastLine && lastLine.trim() ? lastLine : '')
  token.map = [start, state.line]
  token.markup = '$$'
  return true
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

interface MarkdownMathJaxEnv extends MarkdownEnv {
  mathjaxInitialized?: true
}

interface MathjaxRendered {
  content: string
  width?: number // ex
  height?: number // ex
  verticalAlign?: number // ex
}

interface MathJaxItem {
  files: Set<string>
  formula: string
  inline: boolean
  rendered?: MathjaxRendered
}

class MarkdownMathJaxManger {
  private readonly hashes: { [hash: string]: MathJaxItem } = {}
  private readonly file2Hashes: { [path: string]: Set<string> } = {}
  private readonly renderer: (
    formula: string,
    inline: boolean
  ) => MathjaxRendered

  constructor(renderer: (formula: string, inline: boolean) => MathjaxRendered) {
    this.renderer = renderer
  }

  cleanUpFile(path: string) {
    if (this.file2Hashes[path] === undefined) {
      return
    }
    const hashes = this.file2Hashes[path]
    delete this.file2Hashes[path]
    for (const hash of hashes) {
      this.hashes[hash].files.delete(path)
      if (this.hashes[hash].files.size === 0) {
        delete this.hashes[hash]
      }
    }
  }
  addItem(path: string, formula: string, inline: boolean): [string, boolean] {
    const hash = md5(`${formula}:${inline}`)
    const item = (this.hashes[hash] = this.hashes[hash] || {
      files: new Set<string>(),
      formula,
      inline
    })
    let exists = true
    if (!item.files.has(path)) {
      item.files.add(path)
      const file = (this.file2Hashes[path] =
        this.file2Hashes[path] || new Set<string>())
      file.add(hash)
      exists = false
    }
    return [hash, exists]
  }
  putCachedResult(hash: string, content: string): MathjaxRendered {
    const item = this.hashes[hash]
    const widthMatch = content.match(/width="([0-9.]+)ex"/)
    if (widthMatch === null) {
      throw new Error(`Failed to parse formula width for ${hash}`)
    }
    const heightMatch = content.match(/height="([0-9.]+)ex"/)
    if (heightMatch === null) {
      throw new Error(`Failed to parse formula height for ${hash}`)
    }
    const verticalAlignMatch = content.match(
      /vertical-align:\s*([-0-9.]+)(?:ex)?/
    )
    if (verticalAlignMatch === null) {
      throw new Error(`Failed to parse formula vertical-align for ${hash}`)
    }
    item.rendered = {
      content: content,
      width: parseFloat(widthMatch[1]),
      height: parseFloat(heightMatch[1]),
      verticalAlign: parseFloat(verticalAlignMatch[1])
    }
    return item.rendered
  }
  getItem(hash: string): MathjaxRendered {
    const item = this.hashes[hash]
    if (item.rendered === undefined) {
      item.rendered = this.renderer(item.formula, item.inline)
    }
    return item.rendered
  }
}

function mathRender(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adaptor: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  html: any,
  formula: string,
  inline: boolean
): MathjaxRendered {
  try {
    const node = adaptor.firstChild(
      html.convert(formula, {
        display: !inline,
        em: 16,
        ex: 8,
        containerWidth: 80 * 16
      })
    )
    // noinspection TypeScriptValidateJSTypes
    return {
      content: adaptor.outerHTML(node),
      width: parseFloat(node.attributes.width.slice(0, -2) || '0'),
      height: parseFloat(node.attributes.height.slice(0, -2) || '0'),
      verticalAlign: parseFloat(
        node.styles.styles['vertical-align'].slice(0, -2) || '0'
      )
    }
  } catch (e) {
    console.error(e)
    const canvas = createCanvas(0, 0, 'svg')
    const ctx = canvas.getContext('2d')
    const metrics = ctx.measureText(e.message)
    const padding = 2
    canvas.width =
      metrics.actualBoundingBoxRight -
      metrics.actualBoundingBoxLeft +
      2 * padding
    canvas.height =
      metrics.actualBoundingBoxAscent +
      metrics.actualBoundingBoxDescent +
      2 * padding
    ctx.fillStyle = 'red'
    ctx.fillText(e.message, padding, metrics.actualBoundingBoxAscent + padding)
    return {
      content: canvas.toBuffer().toString('utf-8'),
      width: canvas.width / 8,
      height: canvas.height / 8
    }
  }
}

function mathComponent(
  formula: string,
  inline: boolean,
  manager: MarkdownMathJaxManger,
  env: MarkdownMathJaxEnv,
  options: MathJaxPluginNormalizedOptions
): string {
  if (env.mathjaxInitialized === undefined) {
    manager.cleanUpFile(env.relativePath)
    env.mathjaxInitialized = true
  }
  const [hash, exists] = manager.addItem(env.relativePath, formula, inline)
  let exists2 = exists
  const dest = path.resolve(options.tempDir, `formula.${hash}.svg`)
  if (!exists2 && fs.existsSync(dest)) {
    exists2 = false
    const content = fs.readFileSync(dest, 'utf-8')
    manager.putCachedResult(hash, content)
  }
  if (options.prod) {
    const item = manager.getItem(hash)
    if (!exists2) {
      fs.ensureDirSync(options.tempDir)
      fs.writeFileSync(dest, item.content)
    }
    return (
      `<img src="${path.relative(path.resolve(env.relativePath), dest)}" ` +
      `alt="${escapeHtml(formula)}" ` +
      `style="width: ${item.width}ex;height: ${item.height}ex` +
      (item.verticalAlign === undefined
        ? '">'
        : `;vertical-align: ${item.verticalAlign}ex">`)
    )
  } else {
    return (
      `<async-mathjax src="${options.formulaPath}/formula.${hash}.svg" ` +
      `formula="${escapeHtml(formula)}" v-bind:inline="${inline}"` +
      `></async-mathjax>`
    )
  }
}

const plugin: MathJaxPlugin = (options, context) => {
  const adaptor = new mathjax.MyAdaptor()
  mathjax.RegisterHTMLHandler(adaptor)
  const tex = new mathjax.TeX({ packages: mathjax.AllPackages })
  const svg = new mathjax.SVG({ fontCache: 'local' })
  // noinspection TypeScriptValidateJSTypes
  const html = mathjax.mathjax.document('', { InputJax: tex, OutputJax: svg })

  const renderer = (formula: string, inline: boolean): MathjaxRendered =>
    mathRender(adaptor, html, formula, inline)
  const manager = new MarkdownMathJaxManger(renderer)

  options = options || {}
  const options2: MathJaxPluginNormalizedOptions = {
    formulaPath: options.formulaPath || '/assets/formulas',
    tempDir: path.join(context.tempDir, 'formula'),
    prod: context.isProd
  }
  const formulaPath = options2.formulaPath
  const formulaPathRegex = new RegExp(
    `^${formulaPath}/formula.([a-f0-9]{32}).svg$`
  )

  return {
    name: '@oak-tree-house/vitepress-plugin-mathjax',
    enhanceAppFile: path.resolve(__dirname, '../client/enhanceApp.js'),
    extendMarkdown(md) {
      md.inline.ruler.after('escape', 'math_inline', mathInline)
      md.block.ruler.after('blockquote', 'math_block', mathBlock, {
        alt: ['paragraph', 'reference', 'blockquote', 'list']
      })
      md.renderer.rules.math_inline = (tokens, idx, _, env) =>
        mathComponent(tokens[idx].content, true, manager, env, options2)
      md.renderer.rules.math_block = (tokens, idx, _, env) =>
        mathComponent(tokens[idx].content, false, manager, env, options2)
    },
    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use((req, res, next) => {
          let m
          if (req.url && (m = req.url.match(formulaPathRegex))) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'image/svg+xml')
            res.end(manager.getItem(m[1]).content)
            return
          }
          next()
        })
      }
    }
  }
}

export default plugin

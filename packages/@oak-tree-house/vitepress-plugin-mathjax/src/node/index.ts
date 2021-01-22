import { VitepressPlugin } from '@oak-tree-house/pluggable-vitepress'
import StateInline from 'markdown-it/lib/rules_inline/state_inline'
import StateBlock from 'markdown-it/lib/rules_block/state_block'
import path from 'path'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as mathjax from './mathjax'

export interface MathJaxPluginOptions {
  formulaPath: string
}

export type MathJaxPlugin = VitepressPlugin<MathJaxPluginOptions>

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

function mathRender(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adaptor: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  html: any,
  content: string,
  inline: boolean
): string {
  try {
    const node = adaptor.firstChild(
      html.convert(content, {
        display: !inline,
        em: 16,
        ex: 8,
        containerWidth: 80 * 16
      })
    )
    const output = adaptor.outerHTML(node)
    return inline ? output : `<p>${output}</p>`
  } catch (e) {
    console.error(`Failed to render formula: ${content}`)
    console.error(e)
    return (
      '' +
      `<${inline ? 'span' : 'div'} style="color:red">` +
      `Failed to render formula: ${escapeHtml(content)}` +
      `</${inline ? 'span' : 'div'}>`
    )
  }
}

const plugin: MathJaxPlugin = () => {
  const adaptor = mathjax.liteAdaptor()
  mathjax.RegisterHTMLHandler(adaptor)
  const tex = new mathjax.TeX({ packages: mathjax.AllPackages })
  const svg = new mathjax.SVG({ fontCache: 'local' })
  const html = mathjax.mathjax.document('', { InputJax: tex, OutputJax: svg })

  return {
    name: '@oak-tree-house/vitepress-plugin-mathjax',
    enhanceAppFile: path.resolve(__dirname, '../client/enhanceApp.js'),
    extendMarkdown(md) {
      md.inline.ruler.after('escape', 'math_inline', mathInline)
      md.block.ruler.after('blockquote', 'math_block', mathBlock, {
        alt: ['paragraph', 'reference', 'blockquote', 'list']
      })
      md.renderer.rules.math_inline = (tokens, idx) =>
        mathRender(adaptor, html, tokens[idx].content, true)
      md.renderer.rules.math_block = (tokens, idx) =>
        mathRender(adaptor, html, tokens[idx].content, true)
    }
  }
}

export default plugin

import MarkdownIt from 'markdown-it'

export function preWrapperPlugin(md: MarkdownIt): void {
  const fence = md.renderer.rules.fence
  if (fence === undefined) {
    throw new Error('no render rule for fence')
  }
  md.renderer.rules.fence = (...args) => {
    const [tokens, idx] = args
    const token = tokens[idx]
    const rawCode = fence(...args)
    return `<div class="language-${token.info.trim()}">${rawCode}</div>`
  }
}

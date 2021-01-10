import MarkdownIt from 'markdown-it'
import { MarkdownItWithData } from './index'

// hoist <script> and <style> tags out of the returned html
// so that they can be placed outside as SFC blocks.
export function hoistPlugin(md: MarkdownIt): void {
  const RE = /^<(script|style)(?=(\s|>|$))/i

  md.renderer.rules.html_block = (tokens, idx) => {
    const content = tokens[idx].content
    const data = (md as MarkdownItWithData).__data
    const hoistedTags = data.hoistedTags || (data.hoistedTags = [])
    if (RE.test(content.trim())) {
      hoistedTags.push(content)
      return ''
    } else {
      return content
    }
  }
}

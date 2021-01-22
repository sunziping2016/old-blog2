declare module 'markdown-it-katex' {
  import MarkdownIt = require('markdown-it')
  function math_plugin(md: MarkdownIt): void
  export default math_plugin
}

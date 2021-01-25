/* eslint-disable @typescript-eslint/no-var-requires */
const { LiteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js')

class MyAdaptor extends LiteAdaptor {
  nodeSize(node) {
    const cjk = this.options.cjkWidth
    const width = this.options.normalWidth
    const text = this.textContent(node)
    let w = 0
    for (const c of text.split('')) {
      w += c.codePointAt(0) > 128 ? cjk : width
    }
    return [w, 0]
  }
}

MyAdaptor.OPTIONS = {
  ...LiteAdaptor.OPTIONS,
  cjkWidth: 1,
  normalWidth: 0.6
}

/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
  mathjax: require('mathjax-full/js/mathjax').mathjax,
  TeX: require('mathjax-full/js/input/tex').TeX,
  SVG: require('mathjax-full/js/output/svg').SVG,
  AllPackages: require('mathjax-full/js/input/tex/AllPackages').AllPackages,
  MyAdaptor,
  RegisterHTMLHandler: require('mathjax-full/js/handlers/html')
    .RegisterHTMLHandler
}

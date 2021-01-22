/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = {
  mathjax: require('mathjax-full/js/mathjax').mathjax,
  TeX: require('mathjax-full/js/input/tex').TeX,
  SVG: require('mathjax-full/js/output/svg').SVG,
  AllPackages: require('mathjax-full/js/input/tex/AllPackages').AllPackages,
  liteAdaptor: require('mathjax-full/js/adaptors/liteAdaptor').liteAdaptor,
  RegisterHTMLHandler: require('mathjax-full/js/handlers/html')
    .RegisterHTMLHandler
}

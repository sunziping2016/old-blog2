import chalk from 'chalk'
import prism from 'prismjs'
import escapeHtml from 'escape-html'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const loadLanguages = require('prismjs/components/index')

// required to make embedded highlighting work...
loadLanguages(['markup', 'css', 'javascript'])

function wrap(code: string, lang: string): string {
  if (lang === 'text') {
    code = escapeHtml(code)
  }
  return `<pre v-pre><code>${code}</code></pre>`
}

function getLangCodeFromExtension(extension: string): string {
  const extensionMap: Record<string, string> = {
    vue: 'markup',
    html: 'markup',
    md: 'markdown',
    rb: 'ruby',
    ts: 'typescript',
    py: 'python',
    sh: 'bash',
    yml: 'yaml',
    styl: 'stylus',
    kt: 'kotlin',
    rs: 'rust'
  }

  return extensionMap[extension] || extension
}

export function highlight(str: string, lang: string): string {
  if (!lang || lang === 'text') {
    return wrap(str, 'text')
  }
  lang = lang.toLowerCase()
  const rawLang = lang
  lang = getLangCodeFromExtension(lang)
  if (!prism.languages[lang]) {
    try {
      loadLanguages([lang])
    } catch (e) {
      console.warn(
        chalk.yellow(
          `[vitepress] Syntax highlight for language "${lang}" is not supported.`
        )
      )
    }
  }
  if (prism.languages[lang]) {
    const code = prism.highlight(str, prism.languages[lang], lang)
    return wrap(code, rawLang)
  }
  return wrap(str, 'text')
}

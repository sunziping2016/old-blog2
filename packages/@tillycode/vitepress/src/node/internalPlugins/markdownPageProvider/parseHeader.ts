import emojiData from 'markdown-it-emoji/lib/data/full.json'

const emojiDataTyped = emojiData as Record<string, string>

const parseEmojis = (str: string) => {
  return String(str).replace(
    /:(.+?):/g,
    (placeholder, key) => emojiDataTyped[key] || placeholder
  )
}

const unescapeHtml = (html: string) =>
  String(html)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x3A;/g, ':')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

const removeMarkdownTokens = (str: string) =>
  String(str)
    .replace(/(\[(.[^\]]+)]\((.[^)]+)\))/g, '$2') // []()
    .replace(/(`|\*{1,3}|_)(.*?[^\\])\1/g, '$2') // `{t}` | *{t}* | **{t}** | ***{t}*** | _{t}_
    .replace(/(\\)([*_`!<$])/g, '$2') // remove escape char '\'

const trim = (str: string) => str.trim()

// This method remove the raw HTML but reserve the HTML wrapped by `<code>`.
// e.g.
// Input: "<a> b",   Output: "b"
// Input: "`<a>` b", Output: "`<a>` b"
const removeNonCodeWrappedHTML = (str: string) => {
  return String(str).replace(/(^|[^><`\\])<.*>([^><`]|$)/g, '$1$2')
}

const compose = (...processors: ((str: string) => string)[]) => {
  if (processors.length === 0) return (input: string) => input
  if (processors.length === 1) return processors[0]
  return processors.reduce((prev, next) => {
    return (str) => next(prev(str))
  })
}

// Unescape html, parse emojis and remove some md tokens.
export const parseHeader = compose(
  unescapeHtml,
  parseEmojis,
  removeMarkdownTokens,
  trim
)

export const deeplyParseHeader = compose(removeNonCodeWrappedHTML, parseHeader)

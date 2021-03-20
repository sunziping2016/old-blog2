import MarkdownIt from 'markdown-it'
import { MarkdownEnv, MarkdownItWithData } from './index'
import Token from 'markdown-it/lib/token'
import url from 'url'

const indexRE = /(^|.*\/)(index|readme.md)(#?.*)$/i

export function convertRouterLinkPlugin(
  md: MarkdownIt,
  externalAttrs: Record<string, string>
): void {
  let hasOpenRouterLink = false
  let hasOpenExternalLink = false

  md.renderer.rules.link_open = (
    tokens,
    idx,
    options,
    env: MarkdownEnv,
    self
  ) => {
    const { relativePath } = env
    const token = tokens[idx]
    if (token.attrs !== null) {
      const hrefIndex = token.attrIndex('href')
      if (hrefIndex >= 0) {
        const link = token.attrs[hrefIndex]
        const href = link[1]
        const isExternal = /^https?:/.test(href)
        const isSourceLink = /(\/|\.md|\.html)(#.*)?$/.test(href)
        if (isExternal) {
          Object.entries(externalAttrs).forEach(([key, val]) => {
            token.attrSet(key, val)
          })
          if (/_blank/i.test(externalAttrs['target'])) {
            hasOpenExternalLink = true
          }
        } else if (isSourceLink) {
          hasOpenRouterLink = true
          tokens[idx] = toRouterLink(token, link, relativePath)
        }
      }
    }
    return self.renderToken(tokens, idx, options)
  }

  function toRouterLink(
    token: Token,
    link: [string, string],
    relativePath?: string
  ): Token {
    link[0] = 'to'
    let to = link[1]

    // convert link to filename and export it for existence check
    const data = (md as MarkdownItWithData).__data
    const links = data.links || (data.links = [])
    links.push(to)

    // relative path usage.
    if (!to.startsWith('/')) {
      to = relativePath
        ? url.resolve('/' + relativePath, to)
        : ensureBeginningDotSlash(to)
    }

    // Sun Ziping: customized for my vitepress
    const indexMatch = to.match(indexRE)
    if (indexMatch) {
      to = indexMatch[1] + indexMatch[3]
    }

    // markdown-it encodes the uri
    link[1] = decodeURI(to)

    return Object.create(token, {
      tag: { value: 'RouterLink' }
    })
  }

  md.renderer.rules.link_close = (
    tokens,
    idx,
    options,
    env: MarkdownEnv,
    self
  ) => {
    const token = tokens[idx]
    if (hasOpenRouterLink) {
      token.tag = 'RouterLink'
      hasOpenRouterLink = false
    }
    if (hasOpenExternalLink) {
      hasOpenExternalLink = false
      // add OutBoundLink to the end of this link if it opens in _blank.
      return '<OutboundLink/>' + self.renderToken(tokens, idx, options)
    }
    return self.renderToken(tokens, idx, options)
  }
}

const beginningSlashRE = /^\.\//

function ensureBeginningDotSlash(path: string): string {
  if (beginningSlashRE.test(path)) {
    return path
  }
  return './' + path
}

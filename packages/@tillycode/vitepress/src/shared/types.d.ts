export type HeadConfig =
  | [string, Record<string, string>]
  | [string, Record<string, string>, string]

export interface LocaleConfig {
  lang: string
  title?: string
  description?: string
  head?: HeadConfig[]
  label?: string
  selectText?: string
}

export interface SiteData {
  base: string
  lang: string
  title: string
  description: string
  head: HeadConfig[]
  locales: Record<string, LocaleConfig>
}

// All are retrieved when the initial page are loaded. Necessary for router
export interface RouterSettings {
  routerPath: string
  extraRouterPaths?: Array<{
    path: string
    type: 'alias' | 'redirect'
  }>
  layout: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>
}

export interface Header {
  level: number
  title: string
  slug: string
}

export interface MarkdownPageData {
  title: string
  headers: Header[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  frontmatter: Record<string, any>
  lastUpdated?: number
}

export interface UserConfig {
  base?: string
  lang?: string
  title?: string
  description?: string
}

export interface SiteData {
  base: string
  lang: string
  title: string
  description: string
}

export interface PageData {
  relativePath: string
  title: string
  description: string
  headers: Header[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  frontmatter: Record<string, any>
  lastUpdated: number
}

export interface Header {
  level: number
  title: string
  slug: string
}

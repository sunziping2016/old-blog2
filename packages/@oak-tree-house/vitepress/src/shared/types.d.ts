export interface SiteData<T = never> {
  base: string
  lang: string
  title: string
  description: string
  themeConfig?: T
  pages: string[]
}

export interface PageData {
  relativePath: string
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  frontmatter: Record<string, any>
  lastUpdated: number
}

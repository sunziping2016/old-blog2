import { ComponentOptions } from 'vue'

export interface SiteData {
  base: string
  title: string
  description: string
}

export interface PageData {
  relativePath: string
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  frontmatter: Record<string, any>
  lastUpdated: number
}

export interface Header {
  level: number
  title: string
  slug: string
}

export interface Theme {
  Layout: ComponentOptions
  NotFound?: ComponentOptions
}

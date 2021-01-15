export interface BlogDataItem {
  path: string
  title: string
  dirname?: string
  keys?: string[]
  lengthPerPage: number
  values: Record<
    string,
    {
      totalItems: number
      totalPages: number
    }
  >
}

export type BlogData = Record<string, BlogDataItem>

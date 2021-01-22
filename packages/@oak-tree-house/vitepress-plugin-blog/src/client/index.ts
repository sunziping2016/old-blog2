import { computed, ref, Ref, ComputedRef, ComponentOptions, watch } from 'vue'
import { BlogData, BlogDataItem } from '@types'
import { PageData } from '@oak-tree-house/pluggable-vitepress/dist/client/index'
import { NavigationFailure, useRouter } from 'vue-router'

export const blogData = ref<BlogData>()
export const blogDataLoading = ref<boolean>(true)

import(/* @vite-ignore */ `/@blogData?t=${Date.now()}`)
  .then((data) => {
    blogData.value = data.default
  })
  .catch((err) => {
    console.error(err)
  })
  .then(() => {
    blogDataLoading.value = false
  })
if (import.meta.hot) {
  import.meta.hot?.on('plugin-blog:blogData', ({ blogData: newBlogData }) => {
    blogData.value = newBlogData
  })
}

export function useIndexKey(
  blogId: Ref<string>
): {
  classifier: ComputedRef<BlogDataItem | undefined>
} {
  const classifier = computed(
    () => blogData.value && blogData.value[blogId.value]
  )
  return {
    classifier
  }
}

export function useIndexPost(
  blogId: Ref<string>,
  blogKey: Ref<string>,
  blogPage: Ref<number>
): {
  classifier: ComputedRef<BlogDataItem | undefined>
  classifierKey: ComputedRef<
    | {
        totalItems: number
        totalPages: number
      }
    | undefined
  >
  basePath: ComputedRef<string | undefined>
  prevLink: ComputedRef<string | undefined>
  nextLink: ComputedRef<string | undefined>
  goPrevLink: () => Promise<NavigationFailure | void | undefined> | undefined
  goNextLink: () => Promise<NavigationFailure | void | undefined> | undefined
  pages: Ref<
    Array<{
      excerpt: ComponentOptions
      pageData: PageData
    }>
  >
  reloadPages: () => Promise<void> | undefined
  pagesLoading: Ref<boolean>
} {
  const { classifier } = useIndexKey(blogId)
  const classifierKey = computed(
    () => classifier.value && classifier.value.values[blogKey.value]
  )
  const basePath = computed(() =>
    classifier.value === undefined
      ? undefined
      : classifier.value.keys !== undefined
      ? `${classifier.value.path}${blogKey.value}/`
      : classifier.value.path
  )
  const prevLink = computed(() =>
    basePath.value === undefined
      ? undefined
      : blogPage.value === 1
      ? basePath.value
      : blogPage.value > 1
      ? `${basePath.value}page/${blogPage.value - 1}/`
      : undefined
  )
  const nextLink = computed(() =>
    basePath.value === undefined || classifierKey.value === undefined
      ? undefined
      : blogPage.value + 1 < classifierKey.value.totalPages
      ? `${basePath.value}page/${blogPage.value + 1}/`
      : undefined
  )
  const router = useRouter()
  const goPrevLink = () => {
    if (prevLink.value !== undefined) {
      return router.push(prevLink.value)
    }
  }
  const goNextLink = () => {
    if (nextLink.value !== undefined) {
      return router.push(nextLink.value)
    }
  }
  const pages = ref<
    Array<{
      excerpt: ComponentOptions
      pageData: PageData
    }>
  >([])
  const pagesLoading = ref<boolean>(false)
  const reloadPages = () => {
    if (pagesLoading.value) {
      return
    }
    pagesLoading.value = true
    return import(
      /* @vite-ignore */ `/@blogData/${blogId.value}/${blogKey.value}/${blogPage.value}?` +
        `t=${Date.now()}`
    )
      .then((data) => {
        pages.value = data.default
      })
      .catch((err) => {
        console.error(err)
      })
      .then(() => {
        pagesLoading.value = false
      })
  }
  if (import.meta.hot) {
    import.meta.hot?.on('plugin-blog:blogData', ({ updates }) => {
      const value =
        updates[blogId.value] && updates[blogId.value][blogKey.value]
      if (value !== undefined && value <= blogPage.value) {
        reloadPages()
      }
    })
  }
  watch([blogId, blogKey, blogPage], reloadPages)
  reloadPages()
  return {
    classifier,
    classifierKey,
    basePath,
    prevLink,
    nextLink,
    goPrevLink,
    goNextLink,
    pages,
    pagesLoading,
    reloadPages
  }
}

<template>
  <div>
    <div v-for="page of pages" :key="page.pageData.relativePath">
      <router-link :to="`/${page.pageData.relativePath.slice(0, -3)}`">
        <h3>{{ page.pageData.title }}</h3>
      </router-link>
      <component :is="page.excerpt"></component>
    </div>
    <button :disabled="prevLink === undefined" @click="goPrevLink">Prev</button>
    <button :disabled="nextLink === undefined" @click="goNextLink">Next</button>
  </div>
</template>

<script lang="ts">
import {
  ComponentOptions,
  defineComponent,
  ref,
  computed,
  watch,
  toRefs
} from 'vue'
import { useRouter } from 'vue-router'
import { PageData } from '@oak-tree-house/pluggable-vitepress/dist/client'
import { BlogData } from '@types'

export default defineComponent({
  props: {
    blogId: {
      type: String,
      required: true
    },
    blogKey: {
      type: String,
      required: true
    },
    blogPage: {
      type: Number,
      default: 0
    }
  },
  setup(props: { blogId: string; blogKey: string; blogPage: number }) {
    const { blogId, blogKey, blogPage } = toRefs(props)
    const pages = ref<
      Array<{
        excerpt: ComponentOptions
        pageData: PageData
      }>
    >([])
    const blogData = ref<BlogData>()
    // noinspection TypeScriptCheckImport
    import(/* @vite-ignore */ `/@blogData?t=${Date.now()}`).then((data) => {
      blogData.value = data.default
    })
    const classifier = computed(
      () => blogData.value && blogData.value[blogId.value]
    )
    const basePath = computed<string | undefined>(() =>
      classifier.value !== undefined
        ? classifier.value.keys === undefined
          ? classifier.value.path
          : `${classifier.value.path}${blogKey.value}/`
        : undefined
    )
    const totalPages = computed(() =>
      classifier.value !== undefined &&
      classifier.value.values[blogKey.value] !== undefined
        ? classifier.value.values[blogKey.value].totalPages
        : undefined
    )
    const prevLink = computed<string | undefined>(() =>
      basePath.value !== undefined
        ? blogPage.value === 1
          ? basePath.value
          : blogPage.value > 1
          ? `${basePath.value}page/${blogPage.value - 1}/`
          : undefined
        : undefined
    )
    const nextLink = computed<string | undefined>(() =>
      basePath.value !== undefined && totalPages.value !== undefined
        ? blogPage.value + 1 < totalPages.value
          ? `${basePath.value}page/${blogPage.value + 1}/`
          : undefined
        : undefined
    )
    const reloadPages = () => {
      return import(
        /* @vite-ignore */ `/@blogData/${blogId.value}/${blogKey.value}/${blogPage.value}?` +
          `t=${Date.now()}`
      ).then((data) => {
        pages.value = data.default
      })
    }
    watch([blogId, blogKey, blogPage], reloadPages)
    reloadPages()
    const router = useRouter()
    const goPrevLink = () => {
      if (prevLink.value !== undefined) {
        router.push(prevLink.value)
      }
    }
    const goNextLink = () => {
      if (nextLink.value !== undefined) {
        router.push(nextLink.value)
      }
    }
    if (import.meta.hot) {
      import.meta.hot?.on(
        'plugin-blog:blogData',
        ({ updates, blogData: newBlogData }) => {
          blogData.value = newBlogData
          const value =
            updates[blogId.value] && updates[blogId.value][blogKey.value]
          if (value !== undefined && value <= blogPage.value) {
            reloadPages()
          }
        }
      )
    }
    return {
      pages,
      prevLink,
      nextLink,
      goPrevLink,
      goNextLink
    }
  }
})
</script>

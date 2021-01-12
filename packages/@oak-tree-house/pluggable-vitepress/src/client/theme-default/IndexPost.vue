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
import { ComponentOptions, defineComponent, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PageData } from '../../shared/config'
import blogData from '@blogData'
import { BlogData } from '../app/router'

const blogDataTyped: BlogData = blogData

export default defineComponent({
  setup() {
    const pages = ref<
      Array<{
        excerpt: ComponentOptions
        pageData: PageData
      }>
    >([])
    const route = useRoute()
    const id = computed(() => route.meta.id as string)
    const key = computed(() => route.meta.key as string)
    const page = computed<number>(() =>
      parseInt((route.params.page as string) || '0', 10)
    )
    const classifier = blogDataTyped[id.value]
    const basePath =
      classifier.keys === undefined
        ? classifier.path
        : `${classifier.path}${key.value}/`
    const prevLink = computed<string | undefined>(() =>
      page.value === 1
        ? basePath
        : page.value > 1
        ? `${basePath}page/${page.value - 1}/`
        : undefined
    )
    const nextLink = computed<string | undefined>(() =>
      page.value + 1 < classifier.totalPages[key.value]
        ? `${basePath}page/${page.value + 1}/`
        : undefined
    )
    const reloadPages = () => {
      console.log('reloading', id.value, key.value, page.value)
      return import(
        /* @vite-ignore */ `/@blogData/${id.value}/${key.value}/${page.value}?` +
          `t=${Date.now()}`
      ).then((data) => {
        pages.value = data.default.value
      })
    }
    watch(page, reloadPages)
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
      import.meta.hot?.on('plugin-blog:blogData', ({ updates }) => {
        const value = updates[id.value] && updates[id.value][key.value]
        if (value !== undefined && value <= page.value) {
          console.log('about to reload', value)
          reloadPages()
        }
      })
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

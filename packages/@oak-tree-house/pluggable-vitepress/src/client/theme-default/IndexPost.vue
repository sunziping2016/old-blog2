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
  markRaw,
  computed,
  watchEffect
} from 'vue'
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
    const id = route.meta.id as string
    const key = route.meta.key as string
    const page = computed<number>(() => parseInt(route.params.page || '0', 10))
    const classifier = blogDataTyped[id]
    const basePath =
      classifier.keys === undefined
        ? classifier.path
        : `${classifier.path}${key}/`
    const prevLink = computed<string | undefined>(() =>
      page.value === 1
        ? basePath
        : page.value > 1
        ? `${basePath}page/${page.value - 1}/`
        : undefined
    )
    const nextLink = computed<string | undefined>(() =>
      page.value + 1 < classifier.totalPages[key]
        ? `${basePath}page/${page.value + 1}/`
        : undefined
    )
    watchEffect(() => {
      // noinspection TypeScriptCheckImport
      import(/* @vite-ignore */ `/@blogData/${id}/${key}/${page.value}`).then(
        (data) => {
          pages.value = data.default.map(({ excerpt, pageData }) => ({
            excerpt: markRaw(excerpt),
            pageData
          }))
        }
      )
    })
    const router = useRouter()
    const goPrevLink = () => router.push(prevLink.value)
    const goNextLink = () => router.push(nextLink.value)
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

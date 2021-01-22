<template>
  <div>
    <div v-if="classifier !== undefined && classifierKey !== undefined">
      {{ classifier.title }}
      Page {{ blogPage + 1 }} / {{ classifierKey.totalPages }}
    </div>
    <div v-if="!pagesLoading">
      <div v-for="page of pages" :key="page.pageData.relativePath">
        <router-link :to="`/${page.pageData.relativePath.slice(0, -3)}`">
          <h3>{{ page.pageData.title }}</h3>
        </router-link>
        <component :is="page.excerpt"></component>
      </div>
      <button :disabled="prevLink === undefined" @click="goPrevLink">
        Prev
      </button>
      <button :disabled="nextLink === undefined" @click="goNextLink">
        Next
      </button>
    </div>
    <div v-else>Loading...</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue'
import { useIndexPost } from './index'

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
    return useIndexPost(blogId, blogKey, blogPage)
  }
})
</script>

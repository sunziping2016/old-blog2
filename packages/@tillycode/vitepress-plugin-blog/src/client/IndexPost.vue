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

<script setup lang="ts">
import { defineProps, toRefs } from 'vue'
import { useIndexPost } from './index'

const props = defineProps({
  blogId: {
    type: String,
    required: true
  },
  blogKey: {
    type: String,
    default: 'all'
  },
  blogPage: {
    type: Number,
    default: 0
  }
})

const { blogId, blogKey, blogPage } = toRefs(props)

const {
  classifier,
  classifierKey,
  pagesLoading,
  pages,
  prevLink,
  nextLink,
  goPrevLink,
  goNextLink
} = useIndexPost(blogId, blogKey, blogPage)
</script>

<style scoped>
h3 {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding-top: 0;
  padding-bottom: 0;
}
</style>

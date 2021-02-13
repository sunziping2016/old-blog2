<template>
  <div class="content">
    <Content />
  </div>
  <template v-if="!pageLoading">
    <PageFooter />
    <NextAndPrevLinks />
  </template>
</template>

<script setup lang="ts">
import PageFooter from '../components/PageFooter.vue'
import NextAndPrevLinks from '../components/NextAndPrevLinks.vue'
import { usePage } from '@oak-tree-house/vitepress/dist/client/app/page'

const { pageLoading } = usePage()
</script>

<style scoped>
.content {
  padding-bottom: 1.5rem;
}
</style>

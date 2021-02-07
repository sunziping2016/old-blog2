<template>
  <p v-if="hasLastUpdated" class="last-updated">
    <span class="prefix">{{ prefix }}:</span>
    <span class="datetime">{{ datetime }}</span>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSiteData } from '@oak-tree-house/pluggable-vitepress/dist/client/app/siteData'
import { usePageData } from '@oak-tree-house/pluggable-vitepress/dist/client/app/pageData'
import type { Config } from '../config'

const { themeConfig } = useSiteData<Config>()
const { pageData } = usePageData()

const hasLastUpdated = computed(() => {
  const lu = themeConfig.value && themeConfig.value.lastUpdated

  return lu !== undefined && lu !== false
})

const prefix = computed(() => {
  const p = themeConfig.value && themeConfig.value.lastUpdated
  return p === true ? 'Last Updated' : p
})

const datetime = computed(() => {
  return pageData.value === undefined
    ? ''
    : new Date(pageData.value.lastUpdated).toLocaleString('en-US')
})
</script>

<style scoped>
.last-updated {
  display: inline-block;
  margin: 0;
  line-height: 1.4;
  font-size: 0.9rem;
  color: var(--c-text-light);
}

@media (min-width: 960px) {
  .last-updated {
    font-size: 1rem;
  }
}

.prefix {
  display: inline-block;
  font-weight: 500;
}

.datetime {
  display: inline-block;
  margin-left: 6px;
  font-weight: 400;
}
</style>

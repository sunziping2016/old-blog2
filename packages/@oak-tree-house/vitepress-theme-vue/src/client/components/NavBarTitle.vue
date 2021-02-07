<template>
  <router-link
    class="nav-bar-title"
    :to="siteData.base"
    :aria-label="`${siteData.title}, back to home`"
  >
    <img
      v-if="themeConfig && themeConfig.logo"
      class="logo"
      :src="withBase(themeConfig.logo)"
      alt="Logo"
    />
    {{ siteData.title }}
  </router-link>
</template>

<script setup lang="ts">
import { useSiteData } from '@oak-tree-house/pluggable-vitepress/dist/client/app/siteData'
import type { Config } from '../config'

const { siteData, themeConfig, withBase } = useSiteData<Config>()
</script>

<style scoped>
.nav-bar-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--c-text);
}

.nav-bar-title:hover {
  text-decoration: none;
}

.logo {
  margin-right: .75rem;
  height: 1.3rem;
  vertical-align: bottom;
}
</style>

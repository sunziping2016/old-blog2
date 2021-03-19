<template>
  <div class="theme" :class="pageClasses">
    <NavBar v-if="showNavbar" @toggle="toggleSidebar">
      <template #search>
        <slot name="navbar-search">
          <AlgoliaSearchBox
            v-if="themeConfig && themeConfig.algolia"
            :options="themeConfig.algolia"
          />
        </slot>
      </template>
    </NavBar>
    <SideBar :open="openSideBar" />
    <Page />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import { usePageData } from '@tillycode/vitepress/dist/client/app/pageData'
import { useSiteData } from '@tillycode/vitepress/dist/client/app/siteData'
import type { Config } from '../config'
import { useRoute } from 'vue-router'

// components
import NavBar from '../components/NavBar.vue'
import SideBar from '../components/SideBar.vue'
import Page from '../components/Page.vue'
import { useSideBar } from '../composables/sideBar'

const route = useRoute()
const { siteData, themeConfig } = useSiteData<Config>()
const { frontmatter } = usePageData()

const AlgoliaSearchBox = defineAsyncComponent(
  () => import('../components/AlgoliaSearchBox.vue')
)

// navbar
const showNavbar = computed(() => {
  if (!frontmatter.value || !themeConfig.value) {
    return true
  }
  if (
    frontmatter.value.navbar === false ||
    themeConfig.value.navbar === false
  ) {
    return false
  }
  return !!(
    siteData.value.title ||
    themeConfig.value.logo ||
    themeConfig.value.repo ||
    themeConfig.value.nav
  )
})

// sidebar
const openSideBar = ref(false)

const sideBar = useSideBar()
const showSidebar = computed(() => {
  return sideBar.value.length > 0
})

const toggleSidebar = (to?: boolean) => {
  openSideBar.value = typeof to === 'boolean' ? to : !openSideBar.value
}

const hideSidebar = toggleSidebar.bind(null, false)
// close the sidebar when navigating to a different location
watch(
  computed(() => route.path),
  hideSidebar
)

// page classes
const pageClasses = computed(() => {
  return [
    {
      'no-navbar': !showNavbar.value,
      'sidebar-open': openSideBar.value,
      'no-sidebar': !showSidebar.value
    }
  ]
})
</script>

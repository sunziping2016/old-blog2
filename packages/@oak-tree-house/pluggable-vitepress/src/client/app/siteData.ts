import initialSiteData from '@siteData'
import { ref } from 'vue'

export const siteData = ref(initialSiteData)

if (import.meta.hot) {
  import.meta.hot?.on('vitepress:siteData', ({ siteData: newSiteData }) => {
    siteData.value = newSiteData
  })
}

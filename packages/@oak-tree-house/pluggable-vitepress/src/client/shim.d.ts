declare const __VP_HASH_MAP__: Record<string, string>

declare module '*.vue' {
  import { ComponentOptions } from 'vue'
  const comp: ComponentOptions
  export default comp
}

declare module '@siteData' {
  import { SiteData } from '@types'
  const data: SiteData
  export default data
}

declare module '@enhanceApps' {
  import { App } from 'vue'
  import { Router } from 'vue-router'
  import { SiteData } from '@types'
  function enhanceApps(
    app: App,
    router: Router,
    siteData: SiteData,
    isServer: boolean
  ): Promise<void>
  export default enhanceApps
}

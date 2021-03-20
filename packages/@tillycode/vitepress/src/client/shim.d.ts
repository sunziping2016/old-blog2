declare const __VP_HASH_MAP__: Record<string, string>

declare module '*.vue' {
  import { ComponentOptions } from 'vue'
  const comp: ComponentOptions
  export default comp
}

declare module '@md/data/*' {
  import { Ref } from 'vue'
  import { MarkdownPageData } from '@types'
  const data: Ref<MarkdownPageData>
  export default data
}

declare module '@md/excerpt/*' {
  import { ComponentOptions } from 'vue'
  const comp: ComponentOptions
  export default comp
}

declare module '@md/content/*' {
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
  import { App, Ref } from 'vue'
  import { Router } from 'vue-router'
  import { SiteData } from '@types'
  function enhanceApps(
    app: App,
    router: Router,
    siteData: Ref<SiteData>,
    isServer: boolean
  ): Promise<void>
  export default enhanceApps
}

declare module '@theme/*' {
  import { ComponentOptions } from 'vue'
  const comp: ComponentOptions
  export default comp
}

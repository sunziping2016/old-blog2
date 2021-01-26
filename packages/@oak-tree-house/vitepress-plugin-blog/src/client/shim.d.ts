declare const __VP_HASH_MAP__: Record<string, string>

declare module '*.vue' {
  import { ComponentOptions } from 'vue'
  const comp: ComponentOptions
  export default comp
}

declare module '@blogData' {
  import { BlogData } from '@types'
  const data: BlogData
  export default data
}

declare module '@blog/post' {
  import { ComponentOptions } from 'vue'
  const comp: ComponentOptions
  export default comp
}

declare module '@blog/key' {
  import { ComponentOptions } from 'vue'
  const comp: ComponentOptions
  export default comp
}

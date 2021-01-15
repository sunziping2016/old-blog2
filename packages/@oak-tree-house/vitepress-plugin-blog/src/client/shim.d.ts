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

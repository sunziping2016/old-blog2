declare module '*.vue' {
  import { ComponentOptions } from 'vue'
  const comp: ComponentOptions
  export default comp
}

declare module '@siteData' {
  const data: never
  export default data
}

declare module '@blogData' {
  const data: never
  export default data
}

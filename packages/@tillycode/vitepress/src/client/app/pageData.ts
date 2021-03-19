// import { computed, ref, Ref, watch } from 'vue'
// // noinspection ES6PreferShortImport
// import { PageData } from '../../shared/types'
// import { inBrowser } from './utils'
// import { usePage } from './page'
//
// export function usePageData(): {
//   pageData: Ref<PageData | undefined>
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   frontmatter: Ref<Record<string, any> | undefined>
//   pageDataLoading: Ref<boolean>
// } {
//   const { routePath, hasPage, pageDataPath } = usePage()
//   const pageData = ref<Ref<PageData>>()
//   const pageDataLoading = ref<boolean>(hasPage.value)
//   const reloadPageData = (): void | Promise<void> => {
//     if (!hasPage.value) {
//       pageData.value = undefined
//       pageDataLoading.value = false
//     } else if (inBrowser) {
//       pageData.value = undefined
//       pageDataLoading.value = true
//       return import(/* @vite-ignore */ pageDataPath.value)
//         .then(({ default: newPageData }) => {
//           pageData.value = newPageData
//         })
//         .catch((err) => {
//           console.error(err)
//         })
//         .then(() => {
//           pageDataLoading.value = false
//         })
//     } else {
//       pageData.value = undefined
//       pageDataLoading.value = true
//       Promise.resolve().then(() => {
//         // eslint-disable-next-line @typescript-eslint/no-var-requires
//         pageData.value = require(pageDataPath.value).default
//         pageDataLoading.value = false
//       })
//     }
//   }
//   watch(routePath, reloadPageData)
//   reloadPageData()
//   return {
//     pageData: computed(() => pageData.value && pageData.value.value),
//     frontmatter: computed(
//       () => pageData.value && pageData.value.value.frontmatter
//     ),
//     pageDataLoading
//   }
// }

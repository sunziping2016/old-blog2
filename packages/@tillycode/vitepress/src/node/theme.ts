// import path from 'path'
// import { SiteConfig } from './config'
//
// export interface VitepressThemeOption {
//   enhanceAppFile?: string
// }
//
// export type VitepressThemeContext = SiteConfig
//
// export type AsyncVitepressTheme<Options> = (
//   themeOptions: Options | undefined,
//   context: VitepressThemeContext
// ) => Promise<VitepressThemeOption>
//
// export type SyncVitepressTheme<Options> = (
//   themeOptions: Options | undefined,
//   context: VitepressThemeContext
// ) => VitepressThemeOption
//
// export type RawVitepressTheme = VitepressThemeOption
//
// export type VitepressTheme<Options> =
//   | SyncVitepressTheme<Options>
//   | AsyncVitepressTheme<Options>
//   | RawVitepressTheme
//
// export class ThemeApi {
//   private readonly theme: VitepressThemeOption
//
//   constructor(theme?: VitepressThemeOption) {
//     this.theme = theme || {}
//   }
//
//   static async loadTheme(
//     themePath: string | undefined,
//     themeConfig: never | undefined,
//     context: VitepressThemeContext,
//     pathRelativeTo: string
//   ): Promise<ThemeApi> {
//     if (themePath === undefined) {
//       return new ThemeApi()
//     }
//     const name = themePath || path.resolve(__dirname, '../client/theme-default')
//     // eslint-disable-next-line @typescript-eslint/no-var-requires
//     const theme: VitepressTheme<never> = require(name.startsWith('.')
//       ? path.resolve(pathRelativeTo, name)
//       : name).default
//     if (typeof theme === 'function') {
//       const result = theme(themeConfig, context)
//       if ('then' in result && typeof result.then === 'function') {
//         return new ThemeApi(await result)
//       } else {
//         return new ThemeApi(result as VitepressThemeOption)
//       }
//     } else {
//       return new ThemeApi(theme)
//     }
//   }
//
//   collectEnhanceAppFiles(): string[] {
//     const results: string[] = []
//     if (this.theme.enhanceAppFile !== undefined) {
//       results.push(this.theme.enhanceAppFile)
//     }
//     return results
//   }
//
//   queryView(view: string): string | undefined {
//     return this.theme.views && this.theme.views[view]
//   }
// }

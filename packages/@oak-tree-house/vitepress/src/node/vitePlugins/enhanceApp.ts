import { Plugin } from 'vite'

export const ENHANCE_APPS_ID = '@enhanceApps'
export const ENHANCE_APPS_REQUEST_PATH = '/' + ENHANCE_APPS_ID

export default function createEnhanceAppPlugin(enhanceApps: string[]): Plugin {
  const content: string =
    enhanceApps
      .map((x, index) => `import enhanceApp${index} from "/@fs/${x}"\n`)
      .join('') +
    '\n' +
    'export default async function enhanceApps(app, router, siteData, isServer) {\n' +
    enhanceApps
      .map(
        (x, index) =>
          `  await enhanceApp${index}(app, router, siteData, isServer)\n`
      )
      .join('') +
    '}\n'
  return {
    name: 'enhance-app',
    config() {
      return {
        alias: [
          {
            find: ENHANCE_APPS_ID,
            replacement: ENHANCE_APPS_REQUEST_PATH
          }
        ]
      }
    },
    resolveId(id) {
      if (id === ENHANCE_APPS_REQUEST_PATH) {
        return ENHANCE_APPS_REQUEST_PATH
      }
    },
    load(id) {
      if (id === ENHANCE_APPS_REQUEST_PATH) {
        return content
      }
    }
  }
}

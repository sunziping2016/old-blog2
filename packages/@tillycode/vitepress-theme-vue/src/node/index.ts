import { VitepressTheme } from '@tillycode/vitepress'
import path from 'path'

interface ThemeVueOptions {
  algolia?: {
    apiKey: string
    indexName: string
  }
}

type ThemeVue = VitepressTheme<ThemeVueOptions>

const theme: ThemeVue = () => {
  return {
    enhanceAppFile: path.resolve(__dirname, '../client/enhanceApp.js'),
    views: {
      GlobalLayout: path.resolve(__dirname, '../client/views/GlobalLayout.vue'),
      Layout: path.resolve(__dirname, '../client/views/Layout.vue')
    }
  }
}

export default theme

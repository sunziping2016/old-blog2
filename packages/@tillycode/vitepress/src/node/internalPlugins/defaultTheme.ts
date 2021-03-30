import path from 'path'
import { VitepressPluginOption } from '../plugin'
import globby from 'globby'

const DEFAULT_THEME_PATH = '../../client/defaultTheme'

export default async function defaultThemePlugin(): Promise<VitepressPluginOption> {
  const layoutFiles: Record<string, string> = {}
  for (const file of await globby(['*.vue'], {
    cwd: path.resolve(__dirname, DEFAULT_THEME_PATH)
  })) {
    layoutFiles[file.slice(0, -4)] = path.resolve(
      __dirname,
      DEFAULT_THEME_PATH,
      file
    )
  }
  return {
    name: '@internal/default-theme',
    layoutFiles
  }
}

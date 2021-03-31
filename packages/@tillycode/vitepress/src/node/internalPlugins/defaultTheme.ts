import path from 'path'
import { VitepressPluginOption } from '../plugin'
import globby from 'globby'

const DEFAULT_THEME_PATH = '../../client/defaultTheme'

export default async function defaultThemePlugin(): Promise<VitepressPluginOption> {
  const layoutFiles: Record<string, string> = {}
  for (const file of await globby(['*.vue', '*.js'], {
    cwd: path.resolve(__dirname, DEFAULT_THEME_PATH)
  })) {
    layoutFiles[file.slice(0, file.lastIndexOf('.'))] = path.resolve(
      __dirname,
      DEFAULT_THEME_PATH,
      file
    )
  }
  console.log(layoutFiles)
  return {
    name: '@internal/default-theme',
    layoutFiles
  }
}

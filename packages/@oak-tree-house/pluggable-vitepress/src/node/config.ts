import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'

export type UserConfigPlugins =
  | { [name: string]: never }
  | Array<[string, never] | string>

export interface UserConfig {
  base?: string
  title?: string
  description?: string
  plugins?: UserConfigPlugins
  theme?: string
  themeConfig?: never
}

export function resolvePath(root: string, file: string): string {
  return path.resolve(root, `.vitepress`, file)
}

export async function resolveUserConfig(
  configPath: string
): Promise<UserConfig> {
  const hasUserConfig = await fs.pathExists(configPath)
  delete require.cache[configPath]
  const userConfig: UserConfig = hasUserConfig ? require(configPath) : {}
  if (hasUserConfig) {
    console.info(`loaded config at ${chalk.yellow(configPath)}`)
  } else {
    console.info(`no config file found.`)
  }
  return userConfig
}

import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import { SiteData } from '../shared/types'

export type UserConfigPlugins =
  | { [name: string]: never }
  | Array<[string, never] | string>

export interface UserConfig {
  base?: string
  lang?: string
  title?: string
  description?: string
  plugins?: UserConfigPlugins
  theme?: string
  themeConfig?: never
}

export interface SiteConfig {
  root: string
  userConfig: UserConfig
  siteData: SiteData
  tempDir: string
  outDir: string
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

export async function resolveSiteConfig(root: string): Promise<SiteConfig> {
  const userConfig = await resolveUserConfig(resolvePath(root, 'config.js'))
  return {
    root,
    userConfig,
    siteData: {
      title: userConfig.title || 'VitePress',
      lang: userConfig.lang || 'en',
      description: userConfig.description || 'A VitePress site',
      base: userConfig.base ? userConfig.base.replace(/([^/])$/, '$1/') : '/'
    },
    tempDir: resolvePath(root, 'temp'),
    outDir: resolvePath(root, 'dist')
  }
}

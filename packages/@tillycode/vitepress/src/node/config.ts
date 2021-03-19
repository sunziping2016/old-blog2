import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import winston from 'winston'
import { HeadConfig, LocaleConfig, SiteData } from '../shared/types'
import { VitepressPlugin, VitepressPluginOption } from './plugin'

export type UserConfigPlugins =
  | { [name: string]: never }
  | Array<
      [string | VitepressPlugin<never>, never] | string | VitepressPlugin<never>
    >

export interface UserConfig extends VitepressPluginOption {
  lang?: string
  base?: string
  title?: string
  description?: string
  head?: HeadConfig[]
  locales?: Record<string, LocaleConfig>
}

export interface SiteConfig {
  isProd: boolean
  sourceDir: string
  vitepressDir: string
  tempDir: string
  outDir: string
  userConfig: UserConfig
  siteData: SiteData
}

function resolvePath(root: string, file: string): string {
  return path.resolve(root, `.vitepress`, file)
}

export async function resolveUserConfig(
  configPath: string
): Promise<UserConfig> {
  const hasUserConfig = await fs.pathExists(configPath)
  delete require.cache[configPath]
  const userConfig: UserConfig = hasUserConfig ? require(configPath) : {}
  if (hasUserConfig) {
    winston.info(`loaded config at ${chalk.green(configPath)}`)
  } else {
    winston.info(`no config file found.`)
  }
  return userConfig
}

export async function resolveSiteConfig(root: string): Promise<SiteConfig> {
  const userConfig = await resolveUserConfig(resolvePath(root, 'config.js'))
  return {
    isProd: process.env.NODE_ENV === 'production',
    sourceDir: root,
    vitepressDir: resolvePath(root, '.'),
    tempDir: resolvePath(root, '.temp'),
    outDir: resolvePath(root, 'dist'),
    userConfig,
    siteData: {
      title: userConfig.title || 'VitePress',
      lang: userConfig.lang || 'en',
      description: userConfig.description || 'A VitePress site',
      base: userConfig.base ? userConfig.base.replace(/([^/])$/, '$1/') : '/',
      head: userConfig.head || [],
      locales: userConfig.locales || {}
    }
  }
}

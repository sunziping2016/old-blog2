import { computed, Ref } from 'vue'
import type { Config } from '../config'
import { useSiteData } from '@oak-tree-house/pluggable-vitepress/dist/client/app/siteData'

export const platforms = ['GitHub', 'GitLab', 'Bitbucket'].map((platform) => {
  return [platform, new RegExp(platform, 'i')] as const
})

export function useRepo(): Ref<{
  text: string
  link: string
} | null> {
  const { themeConfig } = useSiteData<Config>()

  return computed(() => {
    if (!themeConfig.value) {
      return null
    }
    const name = themeConfig.value.docsRepo || themeConfig.value.repo

    if (!name) {
      return null
    }

    const link = getRepoUrl(name)
    const text = getRepoText(link, themeConfig.value.repoLabel)

    return { text, link }
  })
}

function getRepoUrl(repo: string): string {
  // if the full url is not provided, default to GitHub repo
  return /^https?:/.test(repo) ? repo : `https://github.com/${repo}`
}

function getRepoText(url: string, text?: string): string {
  if (text) {
    return text
  }

  // if no label is provided, deduce it from the repo url
  const hosts = url.match(/^https?:\/\/[^/]+/)

  if (!hosts) {
    return 'Source'
  }

  const platform = platforms.find(([, re]) => re.test(hosts[0]))

  if (platform && platform[0]) {
    return platform[0]
  }

  return 'Source'
}

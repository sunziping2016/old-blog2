import { computed, Ref } from 'vue'
import { endingSlashRE, isNullish, isExternal } from '../utils'
import { useSiteData } from '@tillycode/vitepress/dist/client/app/siteData'
import { usePageData } from '@tillycode/vitepress/dist/client/app/pageData'
import { Config } from '../config'

const bitbucketRE = /bitbucket.org/

export function useEditLink(): {
  url: Ref<string | null>
  text: Ref<string>
} {
  const { themeConfig } = useSiteData<Config>()
  const { pageData, frontmatter } = usePageData()

  const url = computed(() => {
    const showEditLink =
      frontmatter.value && !isNullish(frontmatter.value.editLink)
        ? frontmatter.value.editLink
        : themeConfig.value && themeConfig.value.editLinks

    const { repo, docsDir = '', docsBranch = 'master', docsRepo = repo } =
      themeConfig.value || ({} as Config)

    const relativePath = pageData.value && pageData.value.relativePath

    if (!showEditLink || !relativePath || !repo || !docsRepo) {
      return null
    }

    return createUrl(repo, docsRepo, docsDir, docsBranch, relativePath)
  })

  const text = computed(() => {
    return (
      (themeConfig.value && themeConfig.value.editLinkText) || 'Edit this page'
    )
  })

  return {
    url,
    text
  }
}

function createUrl(
  repo: string,
  docsRepo: string,
  docsDir: string,
  docsBranch: string,
  path: string
): string {
  return bitbucketRE.test(repo)
    ? createBitbucketUrl(repo, docsRepo, docsDir, docsBranch, path)
    : createGitHubUrl(repo, docsRepo, docsDir, docsBranch, path)
}

function createGitHubUrl(
  repo: string,
  docsRepo: string,
  docsDir: string,
  docsBranch: string,
  path: string
): string {
  const base = isExternal(docsRepo)
    ? docsRepo
    : `https://github.com/${docsRepo}`

  return (
    base.replace(endingSlashRE, '') +
    `/edit` +
    `/${docsBranch}/` +
    (docsDir ? docsDir.replace(endingSlashRE, '') + '/' : '') +
    path
  )
}

function createBitbucketUrl(
  repo: string,
  docsRepo: string,
  docsDir: string,
  docsBranch: string,
  path: string
): string {
  const base = isExternal(docsRepo) ? docsRepo : repo

  return (
    base.replace(endingSlashRE, '') +
    `/src` +
    `/${docsBranch}/` +
    (docsDir ? docsDir.replace(endingSlashRE, '') + '/' : '') +
    path +
    `?mode=edit&spa=0&at=${docsBranch}&fileviewer=file-view-default`
  )
}

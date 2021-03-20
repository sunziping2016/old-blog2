import path from 'path'
import slash from 'slash'
import hash from 'hash-sum'
import { parse, SFCDescriptor } from '@vue/compiler-sfc'
import { CompilerError } from '@vue/compiler-core'

const cache = new Map<string, SFCDescriptor>()
const prevCache = new Map<string, SFCDescriptor | undefined>()

export function createDescriptor(
  filename: string,
  variant: string,
  source: string,
  root: string,
  isProduction: boolean | undefined
): {
  descriptor: SFCDescriptor
  errors: (CompilerError | SyntaxError)[]
} {
  const { descriptor, errors } = parse(source, {
    filename,
    sourceMap: true
  })

  // ensure the path is normalized in a way that is consistent inside
  // project (relative to root) and on different systems.
  const normalizedPath = slash(path.normalize(path.relative(root, filename)))
  descriptor.id = hash(normalizedPath + variant + (isProduction ? source : ''))

  cache.set(`${filename}:${variant}`, descriptor)
  return { descriptor, errors }
}

export function getPrevDescriptor(
  filename: string,
  variant: string
): SFCDescriptor | undefined {
  return prevCache.get(`${filename}:${variant}`)
}

export function setPrevDescriptor(
  filename: string,
  variant: string,
  entry: SFCDescriptor
): void {
  prevCache.set(`${filename}:${variant}`, entry)
}

export function getDescriptor(
  filename: string,
  variant: string,
  errorOnMissing?: true
): SFCDescriptor
export function getDescriptor(
  filename: string,
  variant: string,
  errorOnMissing: false
): SFCDescriptor | undefined
export function getDescriptor(
  filename: string,
  variant: string,
  errorOnMissing = true
): SFCDescriptor | undefined {
  if (cache.has(`${filename}:${variant}`)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return cache.get(`${filename}:${variant}`)!
  }
  if (errorOnMissing) {
    throw new Error(
      `${filename}:${variant} has no corresponding SFC entry in the cache. ` +
        `This is a @vitejs/plugin-vue internal error, please open an issue.`
    )
  }
}

export function setDescriptor(
  filename: string,
  variant: string,
  entry: SFCDescriptor
): void {
  cache.set(`${filename}:${variant}`, entry)
}

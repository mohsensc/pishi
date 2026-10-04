import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'

const candidateSuffixes = ['.ts', '.tsx', '/index.ts']

function isBareRelative(specifier: string): boolean {
  return (specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier)
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (isBareRelative(specifier) && context.parentURL) {
      for (const suffix of candidateSuffixes) {
        const candidate = new URL(`${specifier}${suffix}`, context.parentURL)
        if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context)
      }
    }
    return nextResolve(specifier, context)
  },
})

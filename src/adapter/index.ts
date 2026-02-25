import type * as Types from '@adapter/Types.ts'

/**
 * Platform storage adapter.
 * @description Picks Deno, Node, or browser impl by runtime.
 * @returns FileStorage for current runtime
 */
export async function getDefaultStorage(): Promise<Types.FileStorage> {
  if (typeof Deno !== 'undefined') {
    const { createDeno } = await import('@adapter/Deno.ts')
    return createDeno()
  }
  const globalScope = globalThis as { process?: { versions?: { node?: string } } }
  if (typeof globalScope.process !== 'undefined' && globalScope.process.versions?.node) {
    const { createNode } = await import('@adapter/Node.ts')
    return createNode()
  }
  const { createBrowser } = await import('@adapter/Browser.ts')
  return createBrowser()
}

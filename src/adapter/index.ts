import type * as Types from '@adapter/Types.ts'

/**
 * Default storage by runtime.
 * @description Picks Bun, Deno, Node, or browser by runtime.
 * @returns FileStorage for current runtime
 */
export async function getDefaultStorage(): Promise<Types.FileStorage> {
  if (typeof (globalThis as { Bun?: unknown }).Bun !== 'undefined') {
    const { createBun } = await import('@adapter/Bun.ts')
    return createBun()
  }
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

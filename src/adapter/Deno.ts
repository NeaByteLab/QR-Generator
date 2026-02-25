import type * as Types from '@adapter/Types.ts'

/**
 * Deno file storage adapter.
 * @description Writes via Deno.writeTextFile and writeFile.
 * @returns FileStorage for Deno runtime
 * @throws {Error} When Deno runtime is not available
 */
export function createDeno(): Types.FileStorage {
  const denoRuntime = (globalThis as { Deno?: typeof Deno }).Deno
  if (!denoRuntime) {
    throw new Error('Adapter: Deno runtime required')
  }
  return {
    async writeFile(filePath: string, fileContent: string | Uint8Array): Promise<void> {
      if (typeof fileContent === 'string') {
        await denoRuntime.writeTextFile(filePath, fileContent)
        return
      }
      await denoRuntime.writeFile(filePath, fileContent)
    }
  }
}

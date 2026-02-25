import type * as Types from '@adapter/Types.ts'

/** Bun.write function signature for file I/O. */
type BunWrite = (path: string, data: string | Uint8Array) => Promise<number>

/**
 * Bun file storage adapter.
 * @description Writes via Bun.write; uses globalThis for lint.
 * @returns FileStorage for Bun runtime
 * @throws {Error} When Bun runtime is not available
 */
export function createBun(): Types.FileStorage {
  const bunWriteFn = (globalThis as { Bun?: { write: BunWrite } }).Bun?.write
  if (!bunWriteFn) {
    throw new Error('Adapter: Bun runtime required')
  }
  return {
    async writeFile(filePath: string, fileContent: string | Uint8Array): Promise<void> {
      await bunWriteFn(filePath, fileContent)
    }
  }
}

import type * as Types from '@adapter/Types.ts'
import { writeFile } from 'node:fs/promises'

/**
 * Node file storage adapter.
 * @description Writes via fs.promises.writeFile.
 * @returns FileStorage for Node runtime
 * @throws {Error} When Node runtime is not available
 */
export function createNode(): Types.FileStorage {
  const processRef = (globalThis as { process?: { versions?: { node?: string } } }).process
  if (!processRef?.versions?.node) {
    throw new Error('Adapter: Node runtime required')
  }
  return {
    async writeFile(filePath: string, fileContent: string | Uint8Array): Promise<void> {
      await writeFile(filePath, fileContent)
    }
  }
}

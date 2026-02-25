import type * as Types from '@adapter/Types.ts'
import { writeFile } from 'node:fs/promises'

/**
 * Node file storage adapter.
 * @description Writes via fs.promises.writeFile.
 * @returns FileStorage using Node fs.promises
 */
export function createNode(): Types.FileStorage {
  return {
    async writeFile(filePath: string, fileContent: string | Uint8Array): Promise<void> {
      await writeFile(filePath, fileContent)
    }
  }
}

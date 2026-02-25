import type * as Types from '@adapter/Types.ts'

/**
 * Deno file storage adapter.
 * @description Writes via Deno.writeTextFile and writeFile.
 * @returns FileStorage using Deno write APIs
 */
export function createDeno(): Types.FileStorage {
  return {
    async writeFile(filePath: string, fileContent: string | Uint8Array): Promise<void> {
      if (typeof fileContent === 'string') {
        await Deno.writeTextFile(filePath, fileContent)
        return
      }
      await Deno.writeFile(filePath, fileContent)
    }
  }
}

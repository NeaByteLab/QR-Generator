/**
 * File write adapter per platform.
 * @description Backend path write or browser download.
 */
export interface FileStorage {
  /** Writes to path or triggers download */
  writeFile(filePath: string, fileContent: string | Uint8Array): Promise<void>
}

import type * as Types from '@adapter/Types.ts'

/**
 * Browser download-only storage adapter.
 * @description Triggers download; path as filename. No filesystem.
 * @returns FileStorage that triggers browser download
 */
export function createBrowser(): Types.FileStorage {
  const domDocument = globalThis.document
  return {
    async writeFile(filePath: string, fileContent: string | Uint8Array): Promise<void> {
      await Promise.resolve()
      const downloadFileName = filePath.split(/[/\\]/).pop() ?? 'download'
      const mimeType = downloadFileName.endsWith('.svg')
        ? 'image/svg+xml'
        : downloadFileName.endsWith('.png')
        ? 'image/png'
        : 'text/plain;charset=utf-8'
      const fileBlob = typeof fileContent === 'string'
        ? new Blob([fileContent], { type: mimeType })
        : new Blob([fileContent as BlobPart], { type: 'application/octet-stream' })
      const blobObjectUrl = URL.createObjectURL(fileBlob)
      const downloadAnchorElement = domDocument.createElement('a')
      downloadAnchorElement.href = blobObjectUrl
      downloadAnchorElement.download = downloadFileName
      downloadAnchorElement.rel = 'noopener'
      domDocument.body.appendChild(downloadAnchorElement)
      downloadAnchorElement.click()
      domDocument.body.removeChild(downloadAnchorElement)
      URL.revokeObjectURL(blobObjectUrl)
    }
  }
}

import type * as Types from '@app/Types.ts'
import QRCode from '@app/core/index.ts'

/**
 * QR code module matrix generator.
 * @description Binary matrix from value using local encoder (no third-party qrcode).
 */
export class Matrix {
  /**
   * Generate QR matrix from value.
   * @description Encodes value, returns 2D module array (1/0).
   * @param value - Content to encode
   * @param level - Error correction level
   * @returns QR module matrix
   */
  static generate(value: string, level: Types.ErrorLevel): Types.QRMatrix {
    const qr = QRCode.create(0, level)
    qr.addData(value, 'Byte')
    qr.make()
    const n = qr.getModuleCount()
    const matrix: Types.QRMatrix = []
    for (let r = 0; r < n; r++) {
      const row: (1 | 0)[] = []
      for (let c = 0; c < n; c++) {
        row.push(qr.isDark(r, c) ? 1 : 0)
      }
      matrix.push(row)
    }
    return matrix
  }
}

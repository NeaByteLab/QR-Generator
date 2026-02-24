import type * as Types from '@app/Types.ts'
import * as QrCode from 'qrcode'

/**
 * QR code module matrix generator.
 * @description Binary matrix from value using qrcode lib.
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
    const rawData = Array.prototype.slice.call(
      (QrCode.default ?? QrCode).create(value, { errorCorrectionLevel: level }).modules.data,
      0
    )
    const sideLength = Math.sqrt(rawData.length)
    return rawData.reduce((matrixRows: Types.QRMatrix, cellValue: number, cellIndex: number) => {
      if (cellIndex % sideLength === 0) {
        matrixRows.push([cellValue as 1 | 0])
      } else {
        const lastRow = matrixRows[matrixRows.length - 1]
        if (lastRow) {
          lastRow.push(cellValue as 1 | 0)
        }
      }
      return matrixRows
    }, []) as Types.QRMatrix
  }
}

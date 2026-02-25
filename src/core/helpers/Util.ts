import type * as Types from '@app/core/Types.ts'
import * as Helpers from '@app/core/helpers/index.ts'

/**
 * QR utilities (BCH, mask, pattern, length, lost point).
 * @description Type info/number BCH, mask patterns, layout.
 */
export class Util {
  /** Alignment pattern row/col positions per version */
  private static readonly patternPositionTable = [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170]
  ]
  /** BCH generator for format (type info) */
  private static readonly bchGeneratorTypeInfo = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) |
    (1 << 2) | (1 << 1) | (1 << 0)
  /** BCH generator for version (type number) */
  private static readonly bchGeneratorTypeNumber = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) |
    (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0)
  /** XOR mask for type info bits */
  private static readonly bchTypeInfoMask = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1)

  /**
   * BCH encode format to 15 bits.
   * @description Encodes 5-bit data to 15-bit with BCH.
   * @param data - 5-bit format value
   * @returns 15-bit encoded value
   */
  static getBCHTypeInfo(data: number): number {
    let encodedValue = data << 10
    while (Util.getBCHDigit(encodedValue) - Util.getBCHDigit(Util.bchGeneratorTypeInfo) >= 0) {
      encodedValue ^= Util.bchGeneratorTypeInfo <<
        (Util.getBCHDigit(encodedValue) - Util.getBCHDigit(Util.bchGeneratorTypeInfo))
    }
    return ((data << 10) | encodedValue) ^ Util.bchTypeInfoMask
  }

  /**
   * BCH encode version to 18 bits.
   * @description Encodes 6-bit version to 18-bit.
   * @param data - Version 1..40 (6 bits)
   * @returns 18-bit encoded value
   */
  static getBCHTypeNumber(data: number): number {
    let encodedValue = data << 12
    while (Util.getBCHDigit(encodedValue) - Util.getBCHDigit(Util.bchGeneratorTypeNumber) >= 0) {
      encodedValue ^= Util.bchGeneratorTypeNumber <<
        (Util.getBCHDigit(encodedValue) - Util.getBCHDigit(Util.bchGeneratorTypeNumber))
    }
    return (data << 12) | encodedValue
  }

  /**
   * Error correction polynomial for RS.
   * @description Product of (x - alpha^i) for i in 0..n-1.
   * @param errorCorrectLength - EC codeword count
   * @returns Galois polynomial
   */
  static getErrorCorrectPolynomial(errorCorrectLength: number): Types.GaloisPolynomial {
    let resultPolynomial: Types.GaloisPolynomial = Helpers.Math.Polynomial.create([1], 0)
    for (let i = 0; i < errorCorrectLength; i += 1) {
      resultPolynomial = resultPolynomial.multiply(
        Helpers.Math.Polynomial.create([1, Helpers.Math.galoisExp(i)], 0)
      )
    }
    return resultPolynomial
  }

  /**
   * Bit length for segment length field.
   * @description 10/9/8/8 for 1-9, 12/11/16/10 for 10-26, etc.
   * @param mode - Encoding mode
   * @param typeNumber - Version 1..40
   * @returns Bit length for length field
   * @throws {Error} Invalid mode or type number
   */
  static getLengthInBits(mode: number, typeNumber: number): number {
    if (1 <= typeNumber && typeNumber < 10) {
      switch (mode) {
        case Helpers.Global.QRMode.MODE_NUMBER:
          return 10
        case Helpers.Global.QRMode.MODE_ALPHA_NUM:
          return 9
        case Helpers.Global.QRMode.MODE_8BIT_BYTE:
          return 8
        case Helpers.Global.QRMode.MODE_KANJI:
          return 8
        default:
          throw new Error(`Util.getLengthInBits: invalid mode ${mode}`)
      }
    } else if (typeNumber < 27) {
      switch (mode) {
        case Helpers.Global.QRMode.MODE_NUMBER:
          return 12
        case Helpers.Global.QRMode.MODE_ALPHA_NUM:
          return 11
        case Helpers.Global.QRMode.MODE_8BIT_BYTE:
          return 16
        case Helpers.Global.QRMode.MODE_KANJI:
          return 10
        default:
          throw new Error(`Util.getLengthInBits: invalid mode ${mode}`)
      }
    } else if (typeNumber < 41) {
      switch (mode) {
        case Helpers.Global.QRMode.MODE_NUMBER:
          return 14
        case Helpers.Global.QRMode.MODE_ALPHA_NUM:
          return 13
        case Helpers.Global.QRMode.MODE_8BIT_BYTE:
          return 16
        case Helpers.Global.QRMode.MODE_KANJI:
          return 12
        default:
          throw new Error(`Util.getLengthInBits: invalid mode ${mode}`)
      }
    } else {
      throw new Error(`Util.getLengthInBits: invalid type number ${typeNumber}`)
    }
  }

  /**
   * Mask evaluation penalty (lost point).
   * @description Sum of penalties for best-mask selection.
   * @param qrcode - Module grid to score
   * @returns Lost point value (lower is better)
   */
  static getLostPoint(qrcode: Types.QRModuleGrid): number {
    const moduleCount = qrcode.getModuleCount()
    let lostPoint = 0
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        let sameCount = 0
        const dark = qrcode.isDark(row, col)
        for (let r = -1; r <= 1; r += 1) {
          if (row + r < 0 || moduleCount <= row + r) {
            continue
          }
          for (let c = -1; c <= 1; c += 1) {
            if (col + c < 0 || moduleCount <= col + c) {
              continue
            }
            if (r === 0 && c === 0) {
              continue
            }
            if (dark === qrcode.isDark(row + r, col + c)) {
              sameCount += 1
            }
          }
        }
        if (sameCount > 5) {
          lostPoint += 3 + sameCount - 5
        }
      }
    }
    for (let row = 0; row < moduleCount - 1; row += 1) {
      for (let col = 0; col < moduleCount - 1; col += 1) {
        let darkCellCount = 0
        if (qrcode.isDark(row, col)) {
          darkCellCount += 1
        }
        if (qrcode.isDark(row + 1, col)) {
          darkCellCount += 1
        }
        if (qrcode.isDark(row, col + 1)) {
          darkCellCount += 1
        }
        if (qrcode.isDark(row + 1, col + 1)) {
          darkCellCount += 1
        }
        if (darkCellCount === 0 || darkCellCount === 4) {
          lostPoint += 3
        }
      }
    }
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount - 6; col += 1) {
        if (
          qrcode.isDark(row, col) &&
          !qrcode.isDark(row, col + 1) &&
          qrcode.isDark(row, col + 2) &&
          qrcode.isDark(row, col + 3) &&
          qrcode.isDark(row, col + 4) &&
          !qrcode.isDark(row, col + 5) &&
          qrcode.isDark(row, col + 6)
        ) {
          lostPoint += 40
        }
      }
    }
    for (let col = 0; col < moduleCount; col += 1) {
      for (let row = 0; row < moduleCount - 6; row += 1) {
        if (
          qrcode.isDark(row, col) &&
          !qrcode.isDark(row + 1, col) &&
          qrcode.isDark(row + 2, col) &&
          qrcode.isDark(row + 3, col) &&
          qrcode.isDark(row + 4, col) &&
          !qrcode.isDark(row + 5, col) &&
          qrcode.isDark(row + 6, col)
        ) {
          lostPoint += 40
        }
      }
    }
    let darkCount = 0
    for (let col = 0; col < moduleCount; col += 1) {
      for (let row = 0; row < moduleCount; row += 1) {
        if (qrcode.isDark(row, col)) {
          darkCount += 1
        }
      }
    }
    const ratio = Math.abs((100 * darkCount) / moduleCount / moduleCount - 50) / 5
    lostPoint += ratio * 10
    return lostPoint
  }

  /**
   * Get mask predicate for pattern index.
   * @description Returns (row,col) -> flip bit.
   * @param maskPattern - Pattern 0..7
   * @returns Mask function
   * @throws {Error} Invalid mask pattern
   */
  static getMaskFunction(maskPattern: number): (rowIndex: number, colIndex: number) => boolean {
    const strategy = Util.maskPatternRegistry[maskPattern]
    if (strategy === undefined) {
      throw new Error(`Util.getMaskFunction: invalid mask pattern ${maskPattern}`)
    }
    return strategy
  }

  /**
   * Alignment pattern positions for version.
   * @description Row/col centers for alignment patterns.
   * @param typeNumber - Version 1..40
   * @returns Array of center positions
   * @throws {Error} Type number out of range
   */
  static getPatternPosition(typeNumber: number): number[] {
    const positionList = Util.patternPositionTable[typeNumber - 1]
    if (positionList === undefined) {
      throw new Error(
        `Util.getPatternPosition: pattern position out of range for typeNumber ${typeNumber}`
      )
    }
    return positionList
  }

  /**
   * BCH value bit length (msb position).
   * @description Counts leading bits for BCH division.
   * @param inputValue - Non-negative integer
   * @returns Bit position of highest set bit (0 if zero)
   */
  private static getBCHDigit(inputValue: number): number {
    let digitCount = 0
    while (inputValue !== 0) {
      digitCount += 1
      inputValue >>>= 1
    }
    return digitCount
  }

  /** Mask pattern index to (row,col) -> boolean. */
  private static readonly maskPatternRegistry: Record<
    number,
    (rowIndex: number, colIndex: number) => boolean
  > = {
    [Helpers.Global.QRMask.PATTERN000]: (rowIndex, colIndex) => (rowIndex + colIndex) % 2 === 0,
    [Helpers.Global.QRMask.PATTERN001]: (rowIndex) => rowIndex % 2 === 0,
    [Helpers.Global.QRMask.PATTERN010]: (_rowIndex, colIndex) => colIndex % 3 === 0,
    [Helpers.Global.QRMask.PATTERN011]: (rowIndex, colIndex) => (rowIndex + colIndex) % 3 === 0,
    [Helpers.Global.QRMask.PATTERN100]: (rowIndex, colIndex) =>
      (Math.floor(rowIndex / 2) + Math.floor(colIndex / 3)) % 2 === 0,
    [Helpers.Global.QRMask.PATTERN101]: (rowIndex, colIndex) =>
      ((rowIndex * colIndex) % 2) + ((rowIndex * colIndex) % 3) === 0,
    [Helpers.Global.QRMask.PATTERN110]: (rowIndex, colIndex) =>
      (((rowIndex * colIndex) % 2) + ((rowIndex * colIndex) % 3)) % 2 === 0,
    [Helpers.Global.QRMask.PATTERN111]: (rowIndex, colIndex) =>
      (((rowIndex * colIndex) % 3) + ((rowIndex + colIndex) % 2)) % 2 === 0
  }
}

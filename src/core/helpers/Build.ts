import type * as Types from '@app/core/Types.ts'
import * as Helpers from '@app/core/helpers/index.ts'

/**
 * QR matrix construction (patterns, timing, data).
 * @description Builds module grid from type, level, and data.
 */
export class Build {
  /**
   * Build full QR matrix with data.
   * @description Allocates grid, patterns, timing, type info, maps data.
   * @param typeNumber - Version 1..40
   * @param errorCorrectionLevelValue - Level index
   * @param dataSegmentList - Data segments
   * @param encodedDataCache - Cached codewords or null
   * @param test - If true do not write type/mask bits
   * @param maskPattern - Mask pattern 0..7
   * @returns Grid, module count, and encoded cache
   */
  static buildMatrix(
    typeNumber: number,
    errorCorrectionLevelValue: number,
    dataSegmentList: Types.QRDataSegment[],
    encodedDataCache: number[] | null,
    test: boolean,
    maskPattern: number
  ): Types.MatrixBuildResult {
    const moduleCountValue = typeNumber * 4 + 17
    const moduleGrid = Build.allocateGrid(moduleCountValue)
    Build.setupPositionProbePattern(0, 0, moduleGrid, moduleCountValue)
    Build.setupPositionProbePattern(moduleCountValue - 7, 0, moduleGrid, moduleCountValue)
    Build.setupPositionProbePattern(0, moduleCountValue - 7, moduleGrid, moduleCountValue)
    Build.setupPositionAdjustPattern(moduleGrid, typeNumber)
    Build.setupTimingPattern(moduleGrid, moduleCountValue)
    Build.setupTypeInfo(test, maskPattern, moduleGrid, errorCorrectionLevelValue, moduleCountValue)
    if (typeNumber >= 7) {
      Build.setupTypeNumber(test, moduleGrid, typeNumber, moduleCountValue)
    }
    let finalEncodedData = encodedDataCache
    if (finalEncodedData === null) {
      finalEncodedData = Helpers.Encode.createData(
        typeNumber,
        errorCorrectionLevelValue,
        dataSegmentList
      )
    }
    Build.mapData(finalEncodedData, maskPattern, moduleGrid, moduleCountValue)
    return {
      moduleGrid,
      moduleCountValue,
      encodedDataCache: finalEncodedData
    }
  }

  /**
   * Map codeword bits into grid with mask.
   * @description Zigzag placement skipping finder/align/timing.
   * @param codewordData - Interleaved codewords
   * @param maskPattern - Mask 0..7
   * @param grid - Module grid to fill
   * @param moduleCount - Grid side length
   */
  static mapData(
    codewordData: number[],
    maskPattern: number,
    grid: (boolean | null)[][],
    moduleCount: number
  ): void {
    let rowIncrement = -1
    let currentRow = moduleCount - 1
    let bitIndex = 7
    let byteIndex = 0
    const maskFunction = Helpers.Util.getMaskFunction(maskPattern)
    for (let currentCol = moduleCount - 1; currentCol > 0; currentCol -= 2) {
      if (currentCol === 6) {
        currentCol -= 1
      }
      while (true) {
        for (let colOffset = 0; colOffset < 2; colOffset += 1) {
          if (Build.gridRow(grid, currentRow)[currentCol - colOffset] === null) {
            let isDarkModule = false
            if (byteIndex < codewordData.length) {
              const dataByte = codewordData[byteIndex]
              isDarkModule = dataByte !== undefined && ((dataByte >>> bitIndex) & 1) === 1
            }
            const shouldMask = maskFunction(currentRow, currentCol - colOffset)
            if (shouldMask) {
              isDarkModule = !isDarkModule
            }
            Build.gridRow(grid, currentRow)[currentCol - colOffset] = isDarkModule
            bitIndex -= 1
            if (bitIndex === -1) {
              byteIndex += 1
              bitIndex = 7
            }
          }
        }
        currentRow += rowIncrement
        if (currentRow < 0 || moduleCount <= currentRow) {
          currentRow -= rowIncrement
          rowIncrement = -rowIncrement
          break
        }
      }
    }
  }

  /**
   * Place alignment patterns for version.
   * @description 5×5 pattern at alignment positions.
   * @param grid - Module grid
   * @param typeNumber - Version 1..40
   */
  static setupPositionAdjustPattern(grid: (boolean | null)[][], typeNumber: number): void {
    const positionList = Helpers.Util.getPatternPosition(typeNumber)
    for (let i = 0; i < positionList.length; i += 1) {
      for (let j = 0; j < positionList.length; j += 1) {
        const row = positionList[i]
        const col = positionList[j]
        if (row === undefined || col === undefined) {
          continue
        }
        if (Build.gridRow(grid, row)[col] !== null) {
          continue
        }
        for (let rowOffset = -2; rowOffset <= 2; rowOffset += 1) {
          for (let colOffset = -2; colOffset <= 2; colOffset += 1) {
            if (
              rowOffset === -2 ||
              rowOffset === 2 ||
              colOffset === -2 ||
              colOffset === 2 ||
              (rowOffset === 0 && colOffset === 0)
            ) {
              Build.gridRow(grid, row + rowOffset)[col + colOffset] = true
            } else {
              Build.gridRow(grid, row + rowOffset)[col + colOffset] = false
            }
          }
        }
      }
    }
  }

  /**
   * Place 8×8 finder (position probe) pattern.
   * @description Finder at given row,col.
   * @param row - Top row of finder
   * @param col - Left column of finder
   * @param grid - Module grid
   * @param moduleCount - Grid side length
   */
  static setupPositionProbePattern(
    row: number,
    col: number,
    grid: (boolean | null)[][],
    moduleCount: number
  ): void {
    for (let rowOffset = -1; rowOffset <= 7; rowOffset += 1) {
      if (row + rowOffset <= -1 || moduleCount <= row + rowOffset) {
        continue
      }
      for (let colOffset = -1; colOffset <= 7; colOffset += 1) {
        if (col + colOffset <= -1 || moduleCount <= col + colOffset) {
          continue
        }
        if (
          (0 <= rowOffset && rowOffset <= 6 && (colOffset === 0 || colOffset === 6)) ||
          (0 <= colOffset && colOffset <= 6 && (rowOffset === 0 || rowOffset === 6)) ||
          (2 <= rowOffset && rowOffset <= 4 && 2 <= colOffset && colOffset <= 4)
        ) {
          Build.gridRow(grid, row + rowOffset)[col + colOffset] = true
        } else {
          Build.gridRow(grid, row + rowOffset)[col + colOffset] = false
        }
      }
    }
  }

  /**
   * Place timing pattern (row 6 and col 6).
   * @description Alternating dark/light strip.
   * @param grid - Module grid
   * @param moduleCount - Grid side length
   */
  static setupTimingPattern(grid: (boolean | null)[][], moduleCount: number): void {
    for (let rowIndex = 8; rowIndex < moduleCount - 8; rowIndex += 1) {
      if (Build.gridRow(grid, rowIndex)[6] !== null) {
        continue
      }
      Build.gridRow(grid, rowIndex)[6] = rowIndex % 2 === 0
    }
    for (let colIndex = 8; colIndex < moduleCount - 8; colIndex += 1) {
      if (Build.gridRow(grid, 6)[colIndex] !== null) {
        continue
      }
      Build.gridRow(grid, 6)[colIndex] = colIndex % 2 === 0
    }
  }

  /**
   * Place version (type number) bits.
   * @description 6×3 blocks each side for version ≥7.
   * @param test - If true do not write bits
   * @param grid - Module grid
   * @param typeNumber - Version 7..40
   * @param moduleCount - Grid side length
   */
  static setupTypeNumber(
    test: boolean,
    grid: (boolean | null)[][],
    typeNumber: number,
    moduleCount: number
  ): void {
    const typeBits = Helpers.Util.getBCHTypeNumber(typeNumber)
    for (let i = 0; i < 18; i += 1) {
      const isDarkModule = !test && ((typeBits >> i) & 1) === 1
      Build.gridRow(grid, Math.floor(i / 3))[(i % 3) + moduleCount - 8 - 3] = isDarkModule
    }
    for (let i = 0; i < 18; i += 1) {
      const isDarkModule = !test && ((typeBits >> i) & 1) === 1
      Build.gridRow(grid, (i % 3) + moduleCount - 8 - 3)[Math.floor(i / 3)] = isDarkModule
    }
  }

  /**
   * Place format (type info) bits.
   * @description 15 bits: level and mask pattern.
   * @param test - If true do not write bits
   * @param maskPattern - Mask 0..7
   * @param grid - Module grid
   * @param errorCorrectionLevel - Level index
   * @param moduleCount - Grid side length
   */
  static setupTypeInfo(
    test: boolean,
    maskPattern: number,
    grid: (boolean | null)[][],
    errorCorrectionLevel: number,
    moduleCount: number
  ): void {
    const typeInfoData = (errorCorrectionLevel << 3) | maskPattern
    const typeInfoBits = Helpers.Util.getBCHTypeInfo(typeInfoData)
    for (let i = 0; i < 15; i += 1) {
      const isDarkModule = !test && ((typeInfoBits >> i) & 1) === 1
      if (i < 6) {
        Build.gridRow(grid, i)[8] = isDarkModule
      } else if (i < 8) {
        Build.gridRow(grid, i + 1)[8] = isDarkModule
      } else {
        Build.gridRow(grid, moduleCount - 15 + i)[8] = isDarkModule
      }
    }
    for (let i = 0; i < 15; i += 1) {
      const isDarkModule = !test && ((typeInfoBits >> i) & 1) === 1
      if (i < 8) {
        Build.gridRow(grid, 8)[moduleCount - i - 1] = isDarkModule
      } else if (i < 9) {
        Build.gridRow(grid, 8)[15 - i - 1 + 1] = isDarkModule
      } else {
        Build.gridRow(grid, 8)[15 - i - 1] = isDarkModule
      }
    }
    Build.gridRow(grid, moduleCount - 8)[8] = !test
  }

  /**
   * Allocate empty grid of given size.
   * @description Creates gridSize×gridSize array filled with null.
   * @param gridSize - Side length in modules
   * @returns 2D array of boolean | null
   */
  private static allocateGrid(gridSize: number): (boolean | null)[][] {
    const grid = new Array(gridSize)
    for (let rowIndex = 0; rowIndex < gridSize; rowIndex += 1) {
      grid[rowIndex] = new Array(gridSize)
      for (let colIndex = 0; colIndex < gridSize; colIndex += 1) {
        grid[rowIndex][colIndex] = null
      }
    }
    return grid
  }

  /**
   * Get grid row by index.
   * @description Returns row array for given row index.
   * @param grid - Module grid
   * @param rowIndex - Row index (0-based)
   * @returns Row array
   * @throws {Error} Row index out of range
   */
  private static gridRow(grid: (boolean | null)[][], rowIndex: number): (boolean | null)[] {
    const row = grid[rowIndex]
    if (row === undefined) {
      throw new Error('Build.gridRow: row index out of range')
    }
    return row
  }
}

import type * as Types from '@app/core/Types.ts'
import * as Helpers from '@app/core/helpers/index.ts'

/**
 * QR code factory and instance holder.
 * @description Creates instances that add data, make, and export.
 */
export default class QRCode {
  /**
   * Create QR code instance.
   * @description Allocates instance with type and error level.
   * @param typeNumber - Version 1..40 (0 = auto)
   * @param errorCorrectionLevel - 'L' | 'M' | 'Q' | 'H'
   * @returns QR code instance (addData, make, export)
   * @throws {Error} Invalid error correction level
   */
  static create(typeNumber: number, errorCorrectionLevel: string): Types.QRCodeInstance {
    let currentTypeNumber = typeNumber
    const levelValue = Helpers.Global.QRError[errorCorrectionLevel]
    if (levelValue === undefined) {
      throw new Error(`Invalid error correction level: ${errorCorrectionLevel}`)
    }
    const errorCorrectionLevelValue: number = levelValue
    let moduleGrid: null | (boolean | null)[][] = null
    let moduleCountValue = 0
    let encodedDataCache: null | number[] = null
    const dataSegmentList: Types.QRDataSegment[] = []

    const isTrialRun = true
    const isFinalRun = false

    const addData = function (data: string, mode: string): void {
      const selectedMode = mode || 'Byte'
      const dataSegment = Helpers.Encode.encode(data, selectedMode, Helpers.Byte.stringToBytes)
      dataSegmentList.push(dataSegment)
      encodedDataCache = null
    }

    const createASCII = function (opts?: Types.QRCellLayout): string {
      return Helpers.Format.ascii(instance, opts?.cellSize, opts?.margin)
    }

    const createDataURL = function (opts?: Types.QRCellLayout): string {
      const cellSize = opts?.cellSize ?? 2
      const margin = opts?.margin ?? cellSize * 4
      return Helpers.Format.dataURL(instance, cellSize, margin)
    }

    const createImgTag = function (opts?: Types.QRCellLayout, alt?: string): string {
      const cellSize = opts?.cellSize ?? 2
      const margin = opts?.margin ?? cellSize * 4
      return Helpers.Format.img(instance, cellSize, margin, alt)
    }

    const createSvgTag = function (
      cellSizeOrOpts?: number | Types.QRSvgOptions,
      margin?: number,
      alt?: Types.SvgAccessibilityContent,
      title?: Types.SvgAccessibilityContent
    ): string {
      if (typeof cellSizeOrOpts === 'object') {
        return Helpers.Format.svg(instance, cellSizeOrOpts)
      }
      const cellSize = cellSizeOrOpts ?? 2
      const svgOpts: Types.QRSvgOptions = {
        cellSize,
        margin: typeof margin === 'undefined' ? cellSize * 4 : margin
      }
      if (alt !== undefined) {
        svgOpts.alt = alt
      }
      if (title !== undefined) {
        svgOpts.title = title
      }
      return Helpers.Format.svg(instance, svgOpts)
    }

    const createTableTag = function (opts?: Types.QRCellLayout): string {
      const cellSize = opts?.cellSize ?? 2
      const margin = opts?.margin ?? cellSize * 4
      return Helpers.Format.table(instance, cellSize, margin)
    }

    const getModuleCount = function (): number {
      return moduleCountValue
    }

    const isDark = function (row: number, col: number): boolean {
      if (row < 0 || moduleCountValue <= row || col < 0 || moduleCountValue <= col) {
        throw new Error(`Cell index out of range (row=${row}, col=${col})`)
      }
      const grid = moduleGrid
      if (grid === null) {
        throw new Error('QRCode: call make() before reading modules')
      }
      const moduleRow = grid[row]
      if (moduleRow === undefined) {
        throw new Error('QRCode: row index out of range')
      }
      return moduleRow[col] === true
    }

    const make = function (): void {
      if (currentTypeNumber < 1) {
        let candidateTypeNumber = 1
        for (; candidateTypeNumber < 40; candidateTypeNumber += 1) {
          const rsBlocks = Helpers.Block.getRSBlocks(candidateTypeNumber, errorCorrectionLevelValue)
          const bitBuffer = Helpers.Buffer.create()
          for (let i = 0; i < dataSegmentList.length; i += 1) {
            const segment = dataSegmentList[i]
            if (segment === undefined) {
              throw new Error('QRCode: data list index out of range')
            }
            bitBuffer.put(segment.getMode(), 4)
            bitBuffer.put(
              segment.getLength(),
              Helpers.Util.getLengthInBits(segment.getMode(), candidateTypeNumber)
            )
            segment.write(bitBuffer)
          }
          let totalDataCount = 0
          for (let i = 0; i < rsBlocks.length; i += 1) {
            const rsBlock = rsBlocks[i]
            if (rsBlock === undefined) {
              throw new Error('QRCode: RS block index out of range')
            }
            totalDataCount += rsBlock.dataCount
          }
          if (bitBuffer.getLengthInBits() <= totalDataCount * 8) {
            break
          }
        }
        currentTypeNumber = candidateTypeNumber
      }
      makeImpl(isFinalRun, getBestMaskPattern())
    }

    const renderTo2dContext = function (
      context: CanvasRenderingContext2D,
      cellSize?: number
    ): void {
      Helpers.Format.canvas(instance, context, cellSize)
    }

    const getBestMaskPattern = function (): number {
      let minLostPoint = 0
      let bestMaskPattern = 0
      for (let patternIndex = 0; patternIndex < 8; patternIndex += 1) {
        makeImpl(isTrialRun, patternIndex)
        const lostPoint = Helpers.Util.getLostPoint(instance)
        if (patternIndex === 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint
          bestMaskPattern = patternIndex
        }
      }
      return bestMaskPattern
    }

    const makeImpl = function (test: boolean, maskPattern: number): void {
      const result = Helpers.Build.buildMatrix(
        currentTypeNumber,
        errorCorrectionLevelValue,
        dataSegmentList,
        encodedDataCache,
        test,
        maskPattern
      )
      moduleGrid = result.moduleGrid
      moduleCountValue = result.moduleCountValue
      encodedDataCache = result.encodedDataCache
    }

    const instance: Types.QRCodeInstance = {
      addData,
      createASCII,
      createDataURL,
      createImgTag,
      createSvgTag,
      createTableTag,
      getModuleCount,
      isDark,
      make,
      renderTo2dContext
    }

    return instance
  }
}

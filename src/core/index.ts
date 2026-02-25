import type * as Types from '@app/core/Types.ts'
import * as Helpers from '@app/core/helpers/index.ts'

/**
 * QR code factory and instance holder.
 * @description Creates instances for add-data, make, and export.
 */
export default class QRCode {
  /**
   * Create QR code instance.
   * @description Allocates instance with version and error level.
   * @param typeNumber - Version 1..40 (0 = auto)
   * @param errorCorrectionLevel - L | M | Q | H
   * @returns New instance with addData, make, export methods
   * @throws {Error} When error correction level invalid
   */
  static create(typeNumber: number, errorCorrectionLevel: string): Types.QRCodeInstance {
    let currentTypeNumber = typeNumber
    const levelValue = errorCorrectionLevel in Helpers.Global.QRError
      ? Helpers.Global.QRError[errorCorrectionLevel as keyof typeof Helpers.Global.QRError]
      : undefined
    if (levelValue === undefined) {
      throw new Error(`Invalid error correction level: ${errorCorrectionLevel}`)
    }
    const errorCorrectionLevelValue: number = levelValue
    let moduleGrid: null | (boolean | null)[][] = null
    let moduleCountValue = 0
    let encodedDataCache: null | number[] = Helpers.Global.Default.encodedDataCache
    const dataSegmentList: Types.QRDataSegment[] = []

    /**
     * Add segment to QR data.
     * @description Appends encoded segment for given mode.
     * @param data - Payload string to encode
     * @param mode - Encoding mode (e.g. Byte)
     */
    const addData = function (data: string, mode: string): void {
      const selectedMode = mode || 'Byte'
      const dataSegment = Helpers.Encode.encode(data, selectedMode, Helpers.Byte.stringToBytes)
      dataSegmentList.push(dataSegment)
      encodedDataCache = Helpers.Global.Default.encodedDataCache
    }

    /**
     * Return QR as ASCII art.
     * @description Renders grid as text with optional layout.
     * @param opts - Cell size and margin
     * @returns ASCII string
     */
    const createASCII = function (opts?: Types.QRCellLayout): string {
      return Helpers.Format.ascii(instance, opts?.cellSize, opts?.margin)
    }

    /**
     * Return QR as data URL.
     * @description Renders as PNG data URL string.
     * @param opts - Cell size and margin
     * @returns Data URL string
     */
    const createDataURL = function (opts?: Types.QRCellLayout): string {
      const cellSize = opts?.cellSize ?? 2
      const margin = opts?.margin ?? cellSize * 4
      return Helpers.Format.dataURL(instance, cellSize, margin)
    }

    /**
     * Return QR as img tag.
     * @description Renders as HTML img element string.
     * @param opts - Cell size and margin
     * @param alt - Alt text for image
     * @returns HTML img tag string
     */
    const createImgTag = function (opts?: Types.QRCellLayout, alt?: string): string {
      const cellSize = opts?.cellSize ?? 2
      const margin = opts?.margin ?? cellSize * 4
      return Helpers.Format.img(instance, cellSize, margin, alt)
    }

    /**
     * Return QR as SVG tag.
     * @description Renders as SVG element with optional a11y.
     * @param cellSizeOrOpts - Cell size or full SVG options
     * @param margin - Margin in cells (optional)
     * @param alt - Accessibility description
     * @param title - Accessibility title
     * @returns SVG markup string
     */
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

    /**
     * Return QR as table tag.
     * @description Renders as HTML table element string.
     * @param opts - Cell size and margin
     * @returns HTML table tag string
     */
    const createTableTag = function (opts?: Types.QRCellLayout): string {
      const cellSize = opts?.cellSize ?? 2
      const margin = opts?.margin ?? cellSize * 4
      return Helpers.Format.table(instance, cellSize, margin)
    }

    /**
     * Return grid side length.
     * @description Returns module count (version-dependent).
     * @returns Module count (e.g. 21 for v1)
     */
    const getModuleCount = function (): number {
      return moduleCountValue
    }

    /**
     * Check if module is dark.
     * @description True if cell dark; throws when out of range.
     * @param row - Row index (0-based)
     * @param col - Column index (0-based)
     * @returns True if module is dark
     * @throws {Error} When out of range or make() not called
     */
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

    /**
     * Build QR matrix from data.
     * @description Encodes data, picks version and mask, builds grid.
     */
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
      makeImpl(Helpers.Global.Default.finalRun, getBestMaskPattern())
    }

    /**
     * Draw QR to canvas context.
     * @description Renders grid to 2D context with optional scale.
     * @param context - Canvas 2D rendering context
     * @param cellSize - Pixels per module (optional)
     */
    const renderTo2dContext = function (
      context: CanvasRenderingContext2D,
      cellSize?: number
    ): void {
      Helpers.Format.canvas(instance, context, cellSize)
    }

    /**
     * Pick mask pattern with least penalty.
     * @description Evaluates all eight patterns; returns best index.
     * @returns Mask pattern index 0..7
     */
    const getBestMaskPattern = function (): number {
      let minLostPoint = 0
      let bestMaskPattern = 0
      for (let patternIndex = 0; patternIndex < 8; patternIndex += 1) {
        makeImpl(Helpers.Global.Default.trialRun, patternIndex)
        const lostPoint = Helpers.Util.getLostPoint(instance)
        if (patternIndex === 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint
          bestMaskPattern = patternIndex
        }
      }
      return bestMaskPattern
    }

    /**
     * Build matrix for given mask (trial or final).
     * @description Calls Build.buildMatrix and updates grid/cache.
     * @param test - Trial run (true) or final (false)
     * @param maskPattern - Mask index 0..7
     */
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

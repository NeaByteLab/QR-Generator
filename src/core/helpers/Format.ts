import type * as Types from '@core/Types.ts'
import * as Helpers from '@core/helpers/index.ts'

/**
 * QR export formats (ASCII, canvas, SVG, table).
 * @description Renders module grid to text, image, or markup.
 */
export class Format {
  /**
   * ASCII art from QR grid.
   * @description Block or half-block chars by cellSize.
   * @param qr - Module grid
   * @param cellSize - Module size (default 1)
   * @param margin - Quiet zone (default derived)
   * @returns Multiline string
   */
  static ascii(qr: Types.QRModuleGrid, cellSize?: number, margin?: number): string {
    cellSize = cellSize || 1
    if (cellSize < 2) {
      return Format.#halfASCII(qr, margin)
    }
    cellSize -= 1
    margin = typeof margin === 'undefined' ? cellSize * 2 : margin
    const canvasSize = qr.getModuleCount() * cellSize + margin * 2
    const contentMin = margin
    const contentMax = canvasSize - margin
    const whiteBlock = Array(cellSize + 1).join('██')
    const blackBlock = Array(cellSize + 1).join('  ')
    let asciiOutput = ''
    let rowLineContent = ''
    for (let pixelY = 0; pixelY < canvasSize; pixelY += 1) {
      const moduleRowIndex = Math.floor((pixelY - contentMin) / cellSize)
      rowLineContent = ''
      for (let pixelX = 0; pixelX < canvasSize; pixelX += 1) {
        let isWhiteModule = 1
        if (
          contentMin <= pixelX &&
          pixelX < contentMax &&
          contentMin <= pixelY &&
          pixelY < contentMax &&
          qr.isDark(moduleRowIndex, Math.floor((pixelX - contentMin) / cellSize))
        ) {
          isWhiteModule = 0
        }
        rowLineContent += isWhiteModule ? whiteBlock : blackBlock
      }
      for (let r = 0; r < cellSize; r += 1) {
        asciiOutput += rowLineContent + '\n'
      }
    }
    return asciiOutput.substring(0, asciiOutput.length - 1)
  }

  /**
   * Draw QR on 2D canvas context.
   * @description Fills rects per module (black/white).
   * @param qr - Module grid
   * @param context - Canvas 2D context
   * @param cellSize - Module size (default 2)
   */
  static canvas(
    qr: Types.QRModuleGrid,
    context: CanvasRenderingContext2D,
    cellSize?: number
  ): void {
    cellSize = cellSize || 2
    const moduleSideLength = qr.getModuleCount()
    for (let rowIndex = 0; rowIndex < moduleSideLength; rowIndex += 1) {
      for (let colIndex = 0; colIndex < moduleSideLength; colIndex += 1) {
        context.fillStyle = qr.isDark(rowIndex, colIndex) ? 'black' : 'white'
        context.fillRect(colIndex * cellSize, rowIndex * cellSize, cellSize, cellSize)
      }
    }
  }

  /**
   * GIF data URL from QR grid.
   * @description Renders via GIF.createDataURL.
   * @param qr - Module grid
   * @param cellSize - Module size (default 2)
   * @param margin - Quiet zone (default derived)
   * @returns data:image/gif;base64,... string
   */
  static dataURL(qr: Types.QRModuleGrid, cellSize?: number, margin?: number): string {
    cellSize = cellSize || 2
    margin = typeof margin === 'undefined' ? cellSize * 4 : margin
    const imageSize = qr.getModuleCount() * cellSize + margin * 2
    const contentMin = margin
    const contentMax = imageSize - margin
    return Helpers.GIF.createDataURL(
      imageSize,
      imageSize,
      function (pixelX: number, pixelY: number): number {
        if (
          contentMin <= pixelX &&
          pixelX < contentMax &&
          contentMin <= pixelY &&
          pixelY < contentMax
        ) {
          const moduleColIndex = Math.floor((pixelX - contentMin) / cellSize)
          const moduleRowIndex = Math.floor((pixelY - contentMin) / cellSize)
          return qr.isDark(moduleRowIndex, moduleColIndex) ? 0 : 1
        }
        return 1
      }
    )
  }

  /**
   * HTML img tag with data URL.
   * @description Width/height and optional alt.
   * @param qr - Module grid
   * @param cellSize - Module size (default 2)
   * @param margin - Quiet zone (default derived)
   * @param alt - Alt text (XML-escaped)
   * @returns <img ... /> string
   */
  static img(qr: Types.QRModuleGrid, cellSize?: number, margin?: number, alt?: string): string {
    cellSize = cellSize || 2
    margin = typeof margin === 'undefined' ? cellSize * 4 : margin
    const imageSize = qr.getModuleCount() * cellSize + margin * 2
    let imgTagMarkup = ''
    imgTagMarkup += '<img'
    imgTagMarkup += '\u0020src="'
    imgTagMarkup += Format.dataURL(qr, cellSize, margin)
    imgTagMarkup += '"'
    imgTagMarkup += '\u0020width="'
    imgTagMarkup += imageSize
    imgTagMarkup += '"'
    imgTagMarkup += '\u0020height="'
    imgTagMarkup += imageSize
    imgTagMarkup += '"'
    if (alt) {
      imgTagMarkup += '\u0020alt="'
      imgTagMarkup += Format.#escapeXml(alt)
      imgTagMarkup += '"'
    }
    imgTagMarkup += '/>'
    return imgTagMarkup
  }

  /**
   * SVG markup with optional title/alt.
   * @description Path-based rects, optional scalable viewBox.
   * @param qr - Module grid
   * @param opts - Cell size, margin, scalable, alt, title
   * @returns SVG string
   */
  static svg(qr: Types.QRModuleGrid, opts: Types.QRSvgOptions = {}): string {
    const cellSize = opts.cellSize ?? 2
    const margin = typeof opts.margin === 'undefined' ? cellSize * 4 : opts.margin
    const titleSurrogate = Format.#toSurrogate(opts.title, 'qrcode-title')
    const altSurrogate = Format.#toSurrogate(opts.alt, 'qrcode-description')
    const canvasSize = qr.getModuleCount() * cellSize + margin * 2
    let svgMarkup = ''
    const rectPath = 'l' + cellSize + ',0 0,' + cellSize + ' -' + cellSize + ',0 0,-' + cellSize +
      'z '
    svgMarkup += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"'
    svgMarkup += !opts.scalable ? ' width="' + canvasSize + 'px" height="' + canvasSize + 'px"' : ''
    svgMarkup += ' viewBox="0 0 ' + canvasSize + ' ' + canvasSize + '" '
    svgMarkup += ' preserveAspectRatio="xMinYMin meet"'
    svgMarkup += titleSurrogate.text || altSurrogate.text
      ? ' role="img" aria-labelledby="' +
        Format.#escapeXml([titleSurrogate.id ?? '', altSurrogate.id ?? ''].join(' ').trim()) +
        '"'
      : ''
    svgMarkup += '>'
    svgMarkup += titleSurrogate.text
      ? '<title id="' +
        Format.#escapeXml(titleSurrogate.id ?? '') +
        '">' +
        Format.#escapeXml(titleSurrogate.text ?? '') +
        '</title>'
      : ''
    svgMarkup += altSurrogate.text
      ? '<description id="' +
        Format.#escapeXml(altSurrogate.id ?? '') +
        '">' +
        Format.#escapeXml(altSurrogate.text ?? '') +
        '</description>'
      : ''
    svgMarkup += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>'
    svgMarkup += '<path d="'
    for (let rowIndex = 0; rowIndex < qr.getModuleCount(); rowIndex += 1) {
      const marginRow = rowIndex * cellSize + margin
      for (let colIndex = 0; colIndex < qr.getModuleCount(); colIndex += 1) {
        if (qr.isDark(rowIndex, colIndex)) {
          const marginCol = colIndex * cellSize + margin
          svgMarkup += 'M' + marginCol + ',' + marginRow + rectPath
        }
      }
    }
    svgMarkup += '" stroke="transparent" fill="black"/>'
    svgMarkup += '</svg>'
    return svgMarkup
  }

  /**
   * HTML table markup for QR.
   * @description Table of td cells (black/white).
   * @param qr - Module grid
   * @param cellSize - Module size (default 2)
   * @param margin - Quiet zone (default derived)
   * @returns <table>...</table> string
   */
  static table(qr: Types.QRModuleGrid, cellSize?: number, margin?: number): string {
    cellSize = cellSize || 2
    margin = typeof margin === 'undefined' ? cellSize * 4 : margin
    let tableHtmlString = ''
    tableHtmlString += '<table style="'
    tableHtmlString += ' border-width: 0px; border-style: none;'
    tableHtmlString += ' border-collapse: collapse;'
    tableHtmlString += ' padding: 0px; margin: ' + margin + 'px;'
    tableHtmlString += '">'
    tableHtmlString += '<tbody>'
    for (let rowIndex = 0; rowIndex < qr.getModuleCount(); rowIndex += 1) {
      tableHtmlString += '<tr>'
      for (let colIndex = 0; colIndex < qr.getModuleCount(); colIndex += 1) {
        tableHtmlString += '<td style="'
        tableHtmlString += ' border-width: 0px; border-style: none;'
        tableHtmlString += ' border-collapse: collapse;'
        tableHtmlString += ' padding: 0px; margin: 0px;'
        tableHtmlString += ' width: ' + cellSize + 'px;'
        tableHtmlString += ' height: ' + cellSize + 'px;'
        tableHtmlString += ' background-color: '
        tableHtmlString += qr.isDark(rowIndex, colIndex) ? '#000000' : '#ffffff'
        tableHtmlString += ';'
        tableHtmlString += '"/>'
      }
      tableHtmlString += '</tr>'
    }
    tableHtmlString += '</tbody>'
    tableHtmlString += '</table>'
    return tableHtmlString
  }
  /** Format name to (qr, ...args) -> string | void */
  static readonly registry: Record<
    string,
    (qr: Types.QRModuleGrid, ...args: unknown[]) => string | void
  > = {
    table: (qr, ...args) =>
      Format.table(qr, args[0] as number | undefined, args[1] as number | undefined),
    svg: (qr, ...args) => Format.svg(qr, (args[0] as Types.QRSvgOptions | undefined) ?? {}),
    dataURL: (qr, ...args) =>
      Format.dataURL(qr, args[0] as number | undefined, args[1] as number | undefined),
    img: (qr, ...args) =>
      Format.img(
        qr,
        args[0] as number | undefined,
        args[1] as number | undefined,
        args[2] as string | undefined
      ),
    ascii: (qr, ...args) =>
      Format.ascii(qr, args[0] as number | undefined, args[1] as number | undefined),
    canvas: (qr, ...args) => {
      const context = args[0] as CanvasRenderingContext2D | undefined
      if (context !== undefined) {
        Format.canvas(qr, context, args[1] as number | undefined)
      }
    }
  }

  /**
   * Escape <, >, &, " for XML/HTML.
   * @description Replaces reserved chars with entities.
   * @param inputString - Raw string to escape
   * @returns Escaped string safe for attributes/text
   */
  static #escapeXml(inputString: string): string {
    let escapedString = ''
    for (let i = 0; i < inputString.length; i += 1) {
      const character = inputString.charAt(i)
      switch (character) {
        case '<':
          escapedString += '&lt;'
          break
        case '>':
          escapedString += '&gt;'
          break
        case '&':
          escapedString += '&amp;'
          break
        case '"':
          escapedString += '&quot;'
          break
        default:
          escapedString += character
          break
      }
    }
    return escapedString
  }

  /**
   * Half-block ASCII for cellSize 1.
   * @description Uses ▀▄█ and space for two rows per line.
   * @param qr - Module grid
   * @param margin - Quiet zone (default derived)
   * @returns Multiline half-block string
   */
  static #halfASCII(qr: Types.QRModuleGrid, margin?: number): string {
    const cellSize = 1
    margin = typeof margin === 'undefined' ? cellSize * 2 : margin
    const canvasSize = qr.getModuleCount() * cellSize + margin * 2
    const contentMin = margin
    const contentMax = canvasSize - margin
    const blockChars: Record<string, string> = {
      '██': '█',
      '█ ': '▀',
      ' █': '▄',
      '  ': ' '
    }
    const blockCharsLastLineNoMargin: Record<string, string> = {
      '██': '▀',
      '█ ': '▀',
      ' █': ' ',
      '  ': ' '
    }
    let asciiOutput = ''
    for (let pixelY = 0; pixelY < canvasSize; pixelY += 2) {
      const topRowIndex = Math.floor((pixelY - contentMin) / cellSize)
      const bottomRowIndex = Math.floor((pixelY + 1 - contentMin) / cellSize)
      for (let pixelX = 0; pixelX < canvasSize; pixelX += 1) {
        let blockKey = '█'
        if (
          contentMin <= pixelX &&
          pixelX < contentMax &&
          contentMin <= pixelY &&
          pixelY < contentMax &&
          qr.isDark(topRowIndex, Math.floor((pixelX - contentMin) / cellSize))
        ) {
          blockKey = ' '
        }
        if (
          contentMin <= pixelX &&
          pixelX < contentMax &&
          contentMin <= pixelY + 1 &&
          pixelY + 1 < contentMax &&
          qr.isDark(bottomRowIndex, Math.floor((pixelX - contentMin) / cellSize))
        ) {
          blockKey += ' '
        } else {
          blockKey += '█'
        }
        asciiOutput += margin < 1 && pixelY + 1 >= contentMax
          ? blockCharsLastLineNoMargin[blockKey]
          : blockChars[blockKey]
      }
      asciiOutput += '\n'
    }
    if (canvasSize % 2 && margin > 0) {
      return (
        asciiOutput.substring(0, asciiOutput.length - canvasSize - 1) +
        Array(canvasSize + 1).join('▀')
      )
    }
    return asciiOutput.substring(0, asciiOutput.length - 1)
  }

  /**
   * Normalize alt/title to text and id for SVG.
   * @description String -> { text, id: null }; object -> text and id.
   * @param altOrTitleValue - String or { text, id } or undefined
   * @param defaultId - Fallback id when object has text
   * @returns { text, id } for title/description elements
   */
  static #toSurrogate(
    altOrTitleValue: Types.SvgAccessibilityContent | undefined,
    defaultId: string
  ): { text: string | null; id: string | null } {
    if (altOrTitleValue === undefined) {
      return { text: null, id: null }
    }
    if (typeof altOrTitleValue === 'string') {
      return { text: altOrTitleValue, id: null }
    }
    return {
      text: altOrTitleValue.text ?? null,
      id: altOrTitleValue.text !== null ? (altOrTitleValue.id ?? defaultId) : null
    }
  }
}

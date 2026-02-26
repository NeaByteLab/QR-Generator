import type * as Types from '@app/Types.ts'
import * as Adapter from '@adapter/index.ts'
import * as Matrix from '@app/Matrix.ts'
import * as Transform from '@app/Transform.ts'
import * as Helpers from '@core/helpers/index.ts'

/**
 * Static QR code to SVG API.
 * @description Generates SVG from value, size, color, and optional logo.
 */
export default class QRCode {
  /** Default fill when color option omitted or invalid. */
  static readonly defaultColor = '#000000'
  /** Default background when background option omitted. */
  static readonly defaultBackground = '#ffffff'

  /**
   * Generate ASCII art string.
   * @description Encodes value and returns terminal-style block art.
   * @param options - Value, optional error level, cell size, margin
   * @returns ASCII string (dark/light blocks)
   */
  static toASCII(options: Types.FormatOptions): string {
    const { value, error, cellSize, margin } = options
    const level = error?.level ?? 'H'
    const grid = QRCode.#matrixToGrid(Matrix.Matrix.generate(value, level))
    return Helpers.Format.ascii(grid, cellSize, margin)
  }

  /**
   * Draw QR into 2D canvas context.
   * @description Encodes value and draws modules on given context.
   * @param ctx - Canvas 2D context to draw into
   * @param options - Value, optional error level, cell size
   */
  static toCanvas(ctx: CanvasRenderingContext2D, options: Types.FormatOptions): void {
    const { value, error, cellSize } = options
    const level = error?.level ?? 'H'
    const grid = QRCode.#matrixToGrid(Matrix.Matrix.generate(value, level))
    Helpers.Format.canvas(grid, ctx, cellSize)
  }

  /**
   * Generate data URL (GIF) for image use.
   * @description Encodes value and returns data URL for img src or download.
   * @param options - Value, optional error level, cell size, margin
   * @returns Data URL string (e.g. data:image/gif;base64,...)
   */
  static toDataURL(options: Types.FormatOptions): string {
    const { value, error, cellSize, margin } = options
    const level = error?.level ?? 'H'
    const grid = QRCode.#matrixToGrid(Matrix.Matrix.generate(value, level))
    const cs = cellSize ?? 2
    const m = margin ?? cs * 4
    return Helpers.Format.dataURL(grid, cs, m)
  }

  /**
   * Write SVG to file via platform storage.
   * @description Uses getDefaultStorage; Deno/Node write to path, browser triggers download.
   * @param path - File path or download filename
   * @param options - SVG options (value, size, color, logo)
   */
  static async toFile(path: string, options: Types.SVGOptions): Promise<void> {
    const svg = QRCode.toSVG(options)
    const storage = await Adapter.getDefaultStorage()
    await storage.writeFile(path, svg)
  }

  /**
   * Write SVG to a writable stream (Node/server).
   * @description Calls stream.write(svg) then stream.end() if present.
   * @param stream - Writable stream (Node Writable or adapter with write/end)
   * @param options - SVG options (value, size, color, logo)
   */
  static async toFileStream(
    stream: Types.WritableStreamLike,
    options: Types.SVGOptions
  ): Promise<void> {
    const svg = QRCode.toSVG(options)
    const writeResult = stream.write(svg)
    if (writeResult !== undefined && typeof (writeResult as Promise<void>).then === 'function') {
      await (writeResult as Promise<void>)
    }
    if (typeof stream.end === 'function') {
      const endResult = stream.end()
      if (endResult !== undefined && typeof (endResult as Promise<void>).then === 'function') {
        await (endResult as Promise<void>)
      }
    }
  }

  /**
   * Return HTML img tag with data URL.
   * @description Encodes value and returns img element markup.
   * @param options - Img tag options (value, layout, alt, size)
   * @returns HTML img element string
   */
  static toImgTag(options: Types.ImgTagOptions): string {
    const { value, error, cellSize, margin, alt, width, height } = options
    const errorLevel = error?.level ?? 'H'
    const grid = QRCode.#matrixToGrid(Matrix.Matrix.generate(value, errorLevel))
    const effectiveCellSize = cellSize ?? 2
    const effectiveMargin = margin ?? effectiveCellSize * 4
    const dataURL = Helpers.Format.dataURL(grid, effectiveCellSize, effectiveMargin)
    const imageSize = grid.getModuleCount() * effectiveCellSize + effectiveMargin * 2
    const imgWidth = width ?? imageSize
    const imgHeight = height ?? imageSize
    const altText = alt ?? 'QR code'
    const escapedAltText = altText
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<img src="${dataURL}" width="${imgWidth}" height="${imgHeight}" alt="${escapedAltText}" />`
  }

  /**
   * Build path result from QR options.
   * @description Matrix, shape options, then Transform.toPath.
   * @param options - QR options (value, size, error, finder, module, logo)
   * @returns Path result with cell size and path string
   */
  static toPath(options: Types.QRCodeOptions): Types.PathResult {
    const { value, size, error, finder, module, logo: logoOpts } = options
    const errorLevel = error?.level ?? 'H'
    const matrix = Matrix.Matrix.generate(value, errorLevel)
    const shapeOptions = QRCode.#toShapeOptions(finder, module)
    const logoSize = logoOpts?.size ??
      (logoOpts?.text !== undefined && logoOpts.text !== '' ? 80 : logoOpts?.image ? 80 : 0)
    const logoBorderRadius = logoOpts?.radius ?? 0
    return Transform.Transform.toPath(matrix, size, shapeOptions, logoSize, logoBorderRadius)
  }

  /**
   * Generate PNG data URL from QR options.
   * @description Encodes value to PNG; optional hex color and background.
   * @param options - Value, error, cell size, margin, color, background
   * @returns Promise resolving to PNG data URL
   */
  static async toPNG(options: Types.PNGOptions): Promise<string> {
    const { value, error, cellSize, margin, color, background } = options
    const level = error?.level ?? 'H'
    const grid = QRCode.#matrixToGrid(Matrix.Matrix.generate(value, level))
    const effectiveCellSize = cellSize ?? 2
    const effectiveMargin = margin ?? effectiveCellSize * 4
    return await Helpers.PNG.createDataURL(
      grid,
      effectiveCellSize,
      effectiveMargin,
      color,
      background
    )
  }

  /**
   * Generate SVG string from options.
   * @description Full SVG with path, fill, defs, optional logo.
   * @param options - SVG options (value, size, color, logo)
   * @returns SVG document string
   */
  static toSVG(options: Types.SVGOptions): string {
    const { path: pathData } = QRCode.toPath(options)
    const svgSize = options.size
    const { fill: fillColor, defs: defsMarkup } = QRCode.#resolveColor(options.color)
    const backgroundColor = options.background ?? QRCode.defaultBackground
    const logoOpts = options.logo
    const titleSurrogate = QRCode.#toA11ySurrogate(options.title, 'qrcode-title')
    const altSurrogate = QRCode.#toA11ySurrogate(options.alt, 'qrcode-desc')
    const hasA11y = (titleSurrogate.text ?? altSurrogate.text) !== null
    const ariaLabelledbyIds = [titleSurrogate.id, altSurrogate.id].filter(Boolean).join(' ').trim()
    const a11yAttrs = hasA11y && ariaLabelledbyIds
      ? ` role="img" aria-labelledby="${QRCode.#escapeXml(ariaLabelledbyIds)}"`
      : ''
    let a11yMarkup = ''
    if (titleSurrogate.text) {
      const idAttr = titleSurrogate.id ? ` id="${QRCode.#escapeXml(titleSurrogate.id)}"` : ''
      a11yMarkup += `<title${idAttr}>${QRCode.#escapeXml(titleSurrogate.text)}</title>`
    }
    if (altSurrogate.text) {
      const idAttr = altSurrogate.id ? ` id="${QRCode.#escapeXml(altSurrogate.id)}"` : ''
      a11yMarkup += `<desc${idAttr}>${QRCode.#escapeXml(altSurrogate.text)}</desc>`
    }
    const defsWrapped = defsMarkup ? `<defs>${defsMarkup}</defs>` : ''
    let innerSvg =
      `${defsWrapped}<path fill="${backgroundColor}" d="M0 0h${svgSize}v${svgSize}H0z"/>` +
      `<path fill="${fillColor}" d="${pathData}"/>`
    if (logoOpts?.text !== undefined && logoOpts.text !== '') {
      const logoSize = logoOpts.size ?? 80
      const centerX = svgSize / 2
      const centerY = svgSize / 2
      const escapedText = logoOpts.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
      const fontSize = Math.round(logoSize * 0.5)
      innerSvg += `<g transform="translate(${centerX},${centerY})">` +
        `<text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" fill="${fillColor}">${escapedText}</text>` +
        `</g>`
    }
    const hasImageLogo = logoOpts?.image !== undefined && logoOpts.image !== ''
    if (hasImageLogo && logoOpts && logoOpts.image) {
      const logoSize = logoOpts.size ?? 80
      const imageX = (svgSize - logoSize) / 2
      const imageY = (svgSize - logoSize) / 2
      const imageHref = logoOpts.image
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      innerSvg +=
        `<image xlink:href="${imageHref}" x="${imageX}" y="${imageY}" width="${logoSize}" ` +
        `height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`
    }
    const xlinkNamespaceAttr = hasImageLogo ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : ''
    return (
      `<svg xmlns="http://www.w3.org/2000/svg"${xlinkNamespaceAttr} width="${svgSize}" height="${svgSize}" ` +
      `viewBox="0 0 ${svgSize} ${svgSize}"${a11yAttrs}>${a11yMarkup}${innerSvg}</svg>`
    )
  }

  /**
   * Generate HTML table tag string.
   * @description Encodes value and returns table markup for QR grid.
   * @param options - Value, optional error level, cell size, margin
   * @returns HTML table element string
   */
  static toTableTag(options: Types.FormatOptions): string {
    const { value, error, cellSize, margin } = options
    const level = error?.level ?? 'H'
    const grid = QRCode.#matrixToGrid(Matrix.Matrix.generate(value, level))
    const cs = cellSize ?? 2
    const m = margin ?? cs * 4
    return Helpers.Format.table(grid, cs, m)
  }

  /**
   * Escape string for XML/HTML.
   * @description Replaces &, <, >, " with entity refs.
   * @param rawString - String to escape for XML/HTML
   * @returns Escaped string safe for attributes or content
   */
  static #escapeXml(rawString: string): string {
    return rawString
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  /**
   * Adapter from QRMatrix to grid interface for Format helpers.
   * @description Exposes getModuleCount and isDark for core Format APIs.
   * @param matrix - QR module matrix (1/0)
   * @returns Object compatible with QRModuleGrid
   */
  static #matrixToGrid(matrix: Types.QRMatrix): {
    getModuleCount(): number
    isDark(r: number, c: number): boolean
  } {
    return {
      getModuleCount(): number {
        return matrix.length
      },
      isDark(r: number, c: number): boolean {
        return matrix[r]?.[c] === 1
      }
    }
  }

  /**
   * Resolve color to fill and defs.
   * @description Solid or gradient to fill and defs markup.
   * @param color - Color option (string or gradient)
   * @returns Resolved fill and defs for SVG
   */
  static #resolveColor(color: Types.ColorOption | undefined): Types.ResolvedColor {
    const solidFill = (colorValue: string): Types.ResolvedColor => ({ fill: colorValue, defs: '' })
    const fallbackColor = color ?? QRCode.defaultColor
    if (typeof fallbackColor === 'string') {
      return solidFill(fallbackColor)
    }
    const colorStops = fallbackColor.stops
    if (!colorStops?.length) {
      return solidFill(QRCode.defaultColor)
    }
    if (colorStops.length === 1) {
      const firstStop = colorStops[0]
      const singleColor = typeof firstStop?.color === 'string' ? firstStop.color.trim() : ''
      return solidFill(singleColor || QRCode.defaultColor)
    }
    const gradientId = `qr-g-${(Math.random() * 1e9).toString(36)}`
    const gradientStopMarkup = colorStops
      .map((stopItem) => `<stop offset="${stopItem.offset}" stop-color="${stopItem.color}"/>`)
      .join('')
    if (fallbackColor.type === 'linear') {
      const startX = fallbackColor.x1 ?? 0
      const startY = fallbackColor.y1 ?? 0
      const endX = fallbackColor.x2 ?? 1
      const endY = fallbackColor.y2 ?? 1
      const defsMarkup =
        `<linearGradient id="${gradientId}" x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" ` +
        `gradientUnits="objectBoundingBox">${gradientStopMarkup}</linearGradient>`
      return { fill: `url(#${gradientId})`, defs: defsMarkup }
    }
    const centerX = fallbackColor.cx ?? 0.5
    const centerY = fallbackColor.cy ?? 0.5
    const radius = fallbackColor.r ?? 0.5
    const focusX = fallbackColor.fx
    const focusY = fallbackColor.fy
    let radialAttrs =
      `id="${gradientId}" cx="${centerX}" cy="${centerY}" r="${radius}" gradientUnits="objectBoundingBox"`
    if (focusX !== undefined && focusY !== undefined) {
      radialAttrs += ` fx="${focusX}" fy="${focusY}"`
    }
    const defsMarkup = `<radialGradient ${radialAttrs}>${gradientStopMarkup}</radialGradient>`
    return { fill: `url(#${gradientId})`, defs: defsMarkup }
  }

  /**
   * Normalize title/alt to text and id.
   * @description String or object to surrogate with text and id.
   * @param accessibilityContent - Title or alt (string or object)
   * @param defaultId - Fallback id when content has no id
   * @returns Surrogate with id and text for SVG a11y
   */
  static #toA11ySurrogate(
    accessibilityContent: Types.SvgAccessibilityContent | undefined,
    defaultId: string
  ): { id: string | null; text: string | null } {
    if (accessibilityContent === undefined) {
      return { id: null, text: null }
    }
    if (typeof accessibilityContent === 'string') {
      return { id: defaultId, text: accessibilityContent }
    }
    const text = accessibilityContent.text ?? null
    const id = text !== null ? (accessibilityContent.id ?? defaultId) : null
    return { id, text }
  }

  /**
   * Merge finder and module into ShapeOptions.
   * @description Defaults for module and finder shape, gap.
   * @param finder - Optional finder options
   * @param module - Optional module options
   * @returns Shape options for Transform
   */
  static #toShapeOptions(
    finder?: Types.FinderOptions,
    module?: Types.ModuleOptions
  ): Types.ShapeOptions {
    return {
      module: {
        shape: module?.shape ?? 'rounded',
        gap: module?.gap ?? 0
      },
      finder: {
        shape: finder?.shape ?? 'rounded',
        gap: finder?.gap ?? 0
      }
    }
  }
}

/**
 * Re-export all types from Types.
 * @description Exposes types for consumer convenience.
 */
export type * from '@app/Types.ts'

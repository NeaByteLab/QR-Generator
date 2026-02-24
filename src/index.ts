import type * as Types from '@app/Types.ts'
import * as Matrix from '@app/Matrix.ts'
import * as Transform from '@app/Transform.ts'

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
      `viewBox="0 0 ${svgSize} ${svgSize}">${innerSvg}</svg>`
    )
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

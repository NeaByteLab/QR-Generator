import type * as Types from '@app/Types.ts'
import * as Render from '@app/Render.ts'

/**
 * Matrix to SVG path transformer.
 * @description Renders matrix to path with shapes, logo cutout.
 */
export class Transform {
  /** Default rounded module and finder shape options. */
  static readonly defaultShapes: Types.ShapeOptions = {
    module: { shape: 'rounded', gap: 0 },
    finder: { shape: 'rounded', gap: 0 }
  }

  /**
   * Convert matrix to path and cell size.
   * @description Dark modules as path with shape and logo cutout.
   * @param matrix - QR module matrix
   * @param size - Output size in pixels
   * @param options - Shape options for module and finder
   * @param logoSize - Logo size in pixels (0 = no logo)
   * @param logoBorderRadius - Logo area corner radius
   * @returns Path result with cell size and path string
   */
  static toPath(
    matrix: Types.QRMatrix,
    size: number,
    options: Types.ShapeOptions = Transform.defaultShapes,
    logoSize = 0,
    logoBorderRadius = 0
  ): Types.PathResult {
    const moduleShape = options.module?.shape ?? 'rounded'
    const finderShape = options.finder?.shape ?? 'rounded'
    const moduleGap = options.module?.gap ?? 0
    const finderGap = options.finder?.gap ?? 0
    const cellSize = size / matrix.length
    const matrixLength = matrix.length
    let pathData = ''
    const logoBounds = Transform.#computeLogoAreaBounds(
      logoSize,
      matrixLength,
      cellSize,
      logoBorderRadius
    )
    /**
     * Corner and center points for cell.
     * @description Builds Corners from cell and eye or module gap.
     * @param rowIndex - Row index
     * @param colIndex - Column index
     * @param eyePattern - True when cell in finder pattern
     * @returns Corner and center points for path
     */
    const getCorners = (rowIndex: number, colIndex: number, eyePattern: boolean): Types.Corners => {
      const cellX = colIndex * cellSize
      const cellY = rowIndex * cellSize
      const cellPadding = eyePattern ? finderGap / 2 : moduleGap / 2
      const center = { x: cellX + cellSize / 2, y: cellY + cellSize / 2 }
      const effectiveSize = cellSize - (eyePattern ? finderGap : moduleGap)
      const halfSize = effectiveSize / 2
      return {
        q1: { x: cellX + cellSize - cellPadding, y: cellY + cellPadding },
        q2: { x: cellX + cellSize - cellPadding, y: cellY + cellSize - cellPadding },
        q3: { x: cellX + cellPadding, y: cellY + cellSize - cellPadding },
        q4: { x: cellX + cellPadding, y: cellY + cellPadding },
        d1: { x: cellX + cellSize - cellPadding - halfSize, y: cellY + cellPadding },
        d2: { x: cellX + cellSize - cellPadding, y: cellY + cellSize - cellPadding - halfSize },
        d3: { x: cellX + cellPadding + halfSize, y: cellY + cellSize - cellPadding },
        d4: { x: cellX + cellPadding, y: cellY + cellPadding + halfSize },
        center
      }
    }
    /**
     * Neighbors for cell at row and column.
     * @description True when adjacent cells are dark.
     * @param rowIndex - Row index
     * @param colIndex - Column index
     * @returns Neighbors object for rounding
     */
    const getNeighbors = (rowIndex: number, colIndex: number): Types.Neighbors => ({
      top: rowIndex > 0 && matrix[rowIndex - 1]?.[colIndex] === 1,
      right: colIndex < matrixLength - 1 && matrix[rowIndex]?.[colIndex + 1] === 1,
      bottom: rowIndex < matrixLength - 1 && matrix[rowIndex + 1]?.[colIndex] === 1,
      left: colIndex > 0 && matrix[rowIndex]?.[colIndex - 1] === 1
    })
    /**
     * Check if cell inside logo cutout.
     * @description Uses logo bounds and rounded corner circles.
     * @param rowIndex - Row index
     * @param colIndex - Column index
     * @returns True when cell in logo area
     */
    const isLogoArea = (rowIndex: number, colIndex: number): boolean => {
      if (!logoBounds) {
        return false
      }
      const {
        logoX,
        logoY,
        areaSize,
        radius: logoCornerRadius,
        logoRadius,
        center: matrixCenterIndex
      } = logoBounds
      if (logoBorderRadius === 0) {
        return (
          rowIndex >= matrixCenterIndex - logoRadius &&
          rowIndex <= matrixCenterIndex + logoRadius &&
          colIndex >= matrixCenterIndex - logoRadius &&
          colIndex <= matrixCenterIndex + logoRadius
        )
      }
      const cellCenterX = colIndex * cellSize + cellSize / 2
      const cellCenterY = rowIndex * cellSize + cellSize / 2
      if (
        cellCenterX >= logoX + logoCornerRadius &&
        cellCenterX <= logoX + areaSize - logoCornerRadius &&
        cellCenterY >= logoY &&
        cellCenterY <= logoY + areaSize
      ) {
        return true
      }
      if (
        cellCenterY >= logoY + logoCornerRadius &&
        cellCenterY <= logoY + areaSize - logoCornerRadius &&
        cellCenterX >= logoX &&
        cellCenterX <= logoX + areaSize
      ) {
        return true
      }
      const inCornerCircle = (circleCenterX: number, circleCenterY: number): boolean => {
        const offsetX = cellCenterX - circleCenterX
        const offsetY = cellCenterY - circleCenterY
        return offsetX * offsetX + offsetY * offsetY <= logoCornerRadius * logoCornerRadius
      }
      if (cellCenterX < logoX + logoCornerRadius && cellCenterY < logoY + logoCornerRadius) {
        return inCornerCircle(logoX + logoCornerRadius, logoY + logoCornerRadius)
      }
      if (
        cellCenterX > logoX + areaSize - logoCornerRadius &&
        cellCenterY < logoY + logoCornerRadius
      ) {
        return inCornerCircle(logoX + areaSize - logoCornerRadius, logoY + logoCornerRadius)
      }
      if (
        cellCenterX > logoX + areaSize - logoCornerRadius &&
        cellCenterY > logoY + areaSize - logoCornerRadius
      ) {
        return inCornerCircle(
          logoX + areaSize - logoCornerRadius,
          logoY + areaSize - logoCornerRadius
        )
      }
      if (
        cellCenterX < logoX + logoCornerRadius &&
        cellCenterY > logoY + areaSize - logoCornerRadius
      ) {
        return inCornerCircle(logoX + logoCornerRadius, logoY + areaSize - logoCornerRadius)
      }
      return false
    }
    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
      const matrixRow = matrix[rowIndex]
      if (!matrixRow) {
        continue
      }
      for (let colIndex = 0; colIndex < matrixRow.length; colIndex++) {
        if (matrixRow[colIndex] === 1 && !isLogoArea(rowIndex, colIndex)) {
          const eyePattern = Transform.#isDetectionPattern(rowIndex, colIndex, matrixLength)
          const corners = getCorners(rowIndex, colIndex, eyePattern)
          const neighbors = getNeighbors(rowIndex, colIndex)
          const shape = eyePattern ? finderShape : moduleShape
          pathData += Render.Render.element(
            corners,
            neighbors,
            shape,
            cellSize,
            moduleGap,
            finderGap,
            eyePattern
          )
        }
      }
    }
    return { cellSize, path: pathData }
  }

  /**
   * Compute logo area bounds and radius.
   * @description Pixel bounds and radius for logo cutout.
   * @param logoSize - Logo size in pixels
   * @param matrixLength - Matrix side length
   * @param cellSize - Pixel size per module
   * @param logoBorderRadius - Requested logo corner radius
   * @returns Logo bounds or null when no logo
   */
  static #computeLogoAreaBounds(
    logoSize: number,
    matrixLength: number,
    cellSize: number,
    logoBorderRadius: number
  ): Types.LogoAreaBounds {
    if (logoSize === 0) {
      return null
    }
    const matrixCenter = Math.floor(matrixLength / 2)
    const logoRadius = Math.floor(logoSize / cellSize / 2)
    const logoX = (matrixCenter - logoRadius) * cellSize
    const logoY = (matrixCenter - logoRadius) * cellSize
    const areaSize = (logoRadius * 2 + 1) * cellSize
    const cornerRadius = Math.min(logoBorderRadius, areaSize / 2)
    return {
      logoX,
      logoY,
      areaSize,
      radius: cornerRadius,
      logoRadius,
      center: matrixCenter
    }
  }

  /**
   * Check if cell in finder pattern.
   * @description True when cell in 7x7 finder region.
   * @param rowIndex - Row index
   * @param colIndex - Column index
   * @param matrixLength - Matrix side length
   * @returns True when cell in detection pattern
   */
  static #isDetectionPattern(rowIndex: number, colIndex: number, matrixLength: number): boolean {
    return (
      (rowIndex < 7 && colIndex < 7) ||
      (rowIndex < 7 && colIndex >= matrixLength - 7) ||
      (rowIndex >= matrixLength - 7 && colIndex < 7)
    )
  }
}

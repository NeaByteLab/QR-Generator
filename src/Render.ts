import type * as Types from '@app/Types.ts'

/**
 * Renders QR modules as SVG paths.
 * @description One module as circle, diamond, star, etc.
 */
export class Render {
  /**
   * Render one module as SVG path.
   * @description Picks shape, returns path d string for cell.
   * @param corners - Module corner and center points
   * @param neighbors - Adjacent cell presence for rounding
   * @param shape - Module shape name
   * @param cellSize - Pixel size per cell
   * @param moduleGap - Gap for data modules
   * @param finderGap - Gap for finder modules
   * @param eyePattern - True when cell in finder pattern
   * @returns SVG path d string for one module
   */
  static element(
    corners: Types.Corners,
    neighbors: Types.Neighbors,
    shape: Types.ModuleShape,
    cellSize: number,
    moduleGap: number,
    finderGap: number,
    eyePattern: boolean
  ): string {
    const { q1, q2, q3, q4, center } = corners
    const effectiveSize = cellSize - (eyePattern ? finderGap : moduleGap)
    switch (shape) {
      case 'circle':
        return `M${center.x} ${center.y} m-${effectiveSize / 2}, 0 a${effectiveSize / 2},${
          effectiveSize / 2
        } 0 1,0 ${effectiveSize},0 a${effectiveSize / 2},${
          effectiveSize / 2
        } 0 1,0 -${effectiveSize},0`
      case 'diamond':
        return Render.#diamond(corners)
      case 'rounded': {
        const useRadius = true
        return Render.#roundedSquare(corners, neighbors, useRadius)
      }
      case 'shuriken':
        return Render.#shuriken(corners)
      case 'square':
        return `M${q4.x} ${q4.y} H${q1.x} V${q2.y} H${q3.x} Z`
      case 'star':
        return Render.#star(corners, cellSize, finderGap, moduleGap, eyePattern)
      case 'triangle':
        return Render.#triangle(corners)
      default:
        return `M${q4.x} ${q4.y} H${q1.x} V${q2.y} H${q3.x} Z`
    }
  }

  /**
   * Diamond path from center to corners.
   * @description Four segments center to corners then close.
   * @param corners - Module corner and center points
   * @returns SVG path d string for diamond
   */
  static #diamond(corners: Types.Corners): string {
    const { center, q1, q2, q3, q4 } = corners
    return `M${center.x} ${q4.y} L${q1.x} ${center.y} L${center.x} ${q2.y} L${q3.x} ${center.y} Z`
  }

  /**
   * Rounded square path with quadrant arcs.
   * @description Lines or arcs per edge from neighbors, useRadius.
   * @param corners - Module corner and center points
   * @param neighbors - Adjacent cell presence for rounding
   * @param useRadius - Whether to draw rounded corners
   * @returns SVG path d string for rounded square
   */
  static #roundedSquare(
    corners: Types.Corners,
    neighbors: Types.Neighbors,
    useRadius: boolean
  ): string {
    const { q1, q2, q3, q4, d1, d2, d3, d4 } = corners
    const edgeTopRight = neighbors.top || neighbors.right || !useRadius
      ? `L${q1.x} ${q1.y} L${d2.x} ${d2.y}`
      : `L${d1.x} ${d1.y} Q${q1.x} ${q1.y} ${d2.x} ${d2.y}`
    const edgeRightBottom = neighbors.right || neighbors.bottom || !useRadius
      ? `L${q2.x} ${q2.y} L${d3.x} ${d3.y}`
      : `L${d2.x} ${d2.y} Q${q2.x} ${q2.y} ${d3.x} ${d3.y}`
    const edgeBottomLeft = neighbors.bottom || neighbors.left || !useRadius
      ? `L${q3.x} ${q3.y} L${d4.x} ${d4.y}`
      : `L${d3.x} ${d3.y} Q${q3.x} ${q3.y} ${d4.x} ${d4.y}`
    const edgeLeftTop = neighbors.left || neighbors.top || !useRadius
      ? `L${q4.x} ${q4.y} L${d1.x} ${d1.y}`
      : `L${d4.x} ${d4.y} Q${q4.x} ${q4.y} ${d1.x} ${d1.y}`
    return `M${d1.x} ${d1.y} ${edgeTopRight} ${edgeRightBottom} ${edgeBottomLeft} ${edgeLeftTop}`
  }

  /**
   * Shuriken path: four filled blades.
   * @description Four triangles center to corner to edge midpoint.
   * @param corners - Module corner, center, edge points
   * @returns SVG path d string for shuriken
   */
  static #shuriken(corners: Types.Corners): string {
    const { center, q1, q2, q3, q4, d1, d2, d3, d4 } = corners
    return `M${center.x} ${center.y} L${q1.x} ${q1.y} L${d2.x} ${d2.y} L${center.x} ${center.y} L${q2.x} ${q2.y} L${d3.x} ${d3.y} L${center.x} ${center.y} L${q3.x} ${q3.y} L${d4.x} ${d4.y} L${center.x} ${center.y} L${q4.x} ${q4.y} L${d1.x} ${d1.y} Z`
  }

  /**
   * Five-point star path with two radii.
   * @description Star with alternating inner and outer radii.
   * @param corners - Module corner and center points
   * @param cellSize - Pixel size per cell
   * @param finderGap - Gap for finder modules
   * @param moduleGap - Gap for data modules
   * @param eyePattern - True when cell in finder pattern
   * @returns SVG path d string for star
   */
  static #star(
    corners: Types.Corners,
    cellSize: number,
    finderGap: number,
    moduleGap: number,
    eyePattern: boolean
  ): string {
    const { center, q4 } = corners
    const outerRadius = (cellSize - (eyePattern ? finderGap : moduleGap)) / 2
    const innerRadius = outerRadius * 0.4
    let starPath = `M${center.x} ${q4.y}`
    for (let pointIndex = 0; pointIndex < 10; pointIndex++) {
      const starAngle = (Math.PI / 5) * pointIndex - Math.PI / 2
      const pointRadius = pointIndex % 2 === 0 ? outerRadius : innerRadius
      const positionX = center.x + pointRadius * Math.cos(starAngle)
      const positionY = center.y + pointRadius * Math.sin(starAngle)
      starPath += ` L${positionX} ${positionY}`
    }
    return starPath + ' Z'
  }

  /**
   * Triangle path from center to corners.
   * @description One triangle from center and three corners.
   * @param corners - Module corner and center points
   * @returns SVG path d string for triangle
   */
  static #triangle(corners: Types.Corners): string {
    const { center, q1, q2, q3, q4 } = corners
    return `M${center.x} ${q4.y} L${q1.x} ${q2.y} L${q3.x} ${q3.y} Z`
  }
}

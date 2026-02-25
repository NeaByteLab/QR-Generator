/** Solid color or gradient definition. */
export type ColorOption = string | LinearGradient | RadialGradient

/**
 * Corner and center points for one module.
 * @description Quadrant corners, diamond points, center for path.
 */
export type Corners = {
  /** Top-right quadrant corner */
  q1: Point
  /** Bottom-right quadrant corner */
  q2: Point
  /** Bottom-left quadrant corner */
  q3: Point
  /** Top-left quadrant corner */
  q4: Point
  /** Top edge diamond point */
  d1: Point
  /** Right edge diamond point */
  d2: Point
  /** Bottom edge diamond point */
  d3: Point
  /** Left edge diamond point */
  d4: Point
  /** Module center point */
  center: Point
}

/** QR error correction level. */
export type ErrorLevel = 'L' | 'M' | 'Q' | 'H'

/**
 * Error correction options.
 * @description Optional error level for QR generation.
 */
export type ErrorOptions = {
  /** Error correction level */
  level?: ErrorLevel
}

/**
 * Options for data URL, ASCII, table, and canvas output.
 * @description Value, optional error level and cell layout.
 */
export type FormatOptions = {
  /** Content to encode in QR */
  value: string
  /** Error correction options */
  error?: ErrorOptions
  /** Cell size in pixels (default 2) */
  cellSize?: number
  /** Margin in pixels (default cellSize * 4; not used by renderToCanvas) */
  margin?: number
}

/**
 * Finder pattern shape and gap options.
 * @description Shape and spacing for finder patterns.
 */
export type FinderOptions = {
  /** Finder module shape */
  shape?: ModuleShape
  /** Gap between finder modules */
  gap?: number
}

/**
 * Single gradient stop (offset and color).
 * @description One stop in a gradient definition.
 */
export type GradientStop = {
  /** Stop offset from 0 to 1 */
  offset: number
  /** CSS color value */
  color: string
}

/**
 * Linear gradient definition.
 * @description Line gradient with optional bounds, stops.
 */
export type LinearGradient = {
  /** Discriminator for linear gradient */
  type: 'linear'
  /** Start X in object bounding box */
  x1?: number
  /** Start Y in object bounding box */
  y1?: number
  /** End X in object bounding box */
  x2?: number
  /** End Y in object bounding box */
  y2?: number
  /** Gradient color stops */
  stops: GradientStop[]
}

/**
 * Logo area bounds and radius for path clipping.
 * @description Pixel bounds and corner radius for logo cutout.
 */
export type LogoAreaBounds = {
  /** Logo area left X in pixels */
  logoX: number
  /** Logo area top Y in pixels */
  logoY: number
  /** Logo area width and height in pixels */
  areaSize: number
  /** Corner radius for logo cutout */
  radius: number
  /** Logo radius in matrix cells */
  logoRadius: number
  /** Matrix center index (row or col) */
  center: number
} | null

/**
 * Logo overlay options (text or image).
 * @description Size, radius, content for center logo.
 */
export type LogoOptions = {
  /** Logo size in pixels */
  size?: number
  /** Logo area corner radius */
  radius?: number
  /** Logo text content */
  text?: string
  /** Logo image (data URI). */
  image?: string
}

/**
 * Data module shape and gap options.
 * @description Shape and spacing for data modules.
 */
export type ModuleOptions = {
  /** Data module shape */
  shape?: ModuleShape
  /** Gap between data modules */
  gap?: number
}

/** Module shape name for finder or data modules. */
export type ModuleShape =
  | 'circle'
  | 'diamond'
  | 'rounded'
  | 'square'
  | 'shuriken'
  | 'star'
  | 'triangle'

/**
 * Neighbor module presence (top, right, bottom, left).
 * @description Whether each adjacent cell is dark for rounding.
 */
export type Neighbors = {
  /** Cell above is dark */
  top: boolean
  /** Cell to right is dark */
  right: boolean
  /** Cell below is dark */
  bottom: boolean
  /** Cell to left is dark */
  left: boolean
}

/** Path result with cell size and path string. */
export type PathResult = {
  /** Cell size in pixels */
  cellSize: number
  /** Path d string */
  path: string
}

/** 2D point with x and y. */
export type Point = {
  /** X coordinate */
  x: number
  /** Y coordinate */
  y: number
}

/**
 * Options for QR code generation.
 * @description Value, size, optional error, finder, module, logo.
 */
export type QRCodeOptions = {
  /** Content to encode in QR */
  value: string
  /** Output size in pixels */
  size: number
  /** Error correction options */
  error?: ErrorOptions
  /** Finder pattern options */
  finder?: FinderOptions
  /** Data module options */
  module?: ModuleOptions
  /** Logo overlay options */
  logo?: LogoOptions
}

/** QR code module matrix (1 = dark, 0 = light). */
export type QRMatrix = (1 | 0)[][]

/**
 * Radial gradient definition.
 * @description Radial gradient with optional center, focus.
 */
export type RadialGradient = {
  /** Discriminator for radial gradient */
  type: 'radial'
  /** Center X in object bounding box */
  cx?: number
  /** Center Y in object bounding box */
  cy?: number
  /** Radius in object bounding box */
  r?: number
  /** Focus X in object bounding box */
  fx?: number
  /** Focus Y in object bounding box */
  fy?: number
  /** Gradient color stops */
  stops: GradientStop[]
}

/**
 * Resolved fill and defs for SVG use.
 * @description Fill value and optional defs markup after resolve.
 */
export type ResolvedColor = {
  /** CSS fill value (color or url) */
  fill: string
  /** SVG defs markup for gradients */
  defs: string
}

/**
 * Shape options for module and finder.
 * @description Nested shape and gap for data and finder.
 */
export type ShapeOptions = {
  /** Data module shape and gap */
  module?: {
    /** Data module shape */
    shape?: ModuleShape
    /** Gap between modules */
    gap?: number
  }
  /** Finder shape and gap */
  finder?: {
    /** Finder module shape */
    shape?: ModuleShape
    /** Gap between finder modules */
    gap?: number
  }
}

/**
 * Shape path strategy signature for one module.
 * @description Function from corners, neighbors, gaps, eye to path d string.
 */
export type ShapePathStrategy = (
  corners: Corners,
  neighbors: Neighbors,
  cellSize: number,
  moduleGap: number,
  finderGap: number,
  eyePattern: boolean
) => string

/** SVG options: QR options plus color and background. */
export type SVGOptions = QRCodeOptions & { color?: ColorOption; background?: string }

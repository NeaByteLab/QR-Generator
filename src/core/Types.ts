/** Base64 byte read stream contract. */
export type Base64DecodeInput = {
  /** Read next decoded byte or -1 at end */
  read: () => number
}

/**
 * Base64 encode stream contract.
 * @description Writes bytes and yields base64 string.
 */
export type Base64EncodeOutput = {
  /** Append one byte to encode */
  writeByte: (byteValue: number) => void
  /** Flush remaining bits and padding */
  flush: () => void
  /** Return accumulated base64 string */
  toString: () => string
}

/** Bit-packed write stream contract. */
export type BitPackOutput = {
  /** Write value with given bit length */
  write: (data: number, length: number) => void
  /** Flush remaining bits to output */
  flush: () => void
}

/**
 * Byte array write contract.
 * @description Sequential byte/short/string output.
 */
export type ByteArrayOutput = {
  /** Append one byte (low 8 bits) */
  writeByte: (byteValue: number) => void
  /** Append short (little-endian) */
  writeShort: (intValue: number) => void
  /** Append slice of source bytes */
  writeBytes: (sourceBytes: number[], offset?: number, length?: number) => void
  /** Append string as byte codes */
  writeString: (stringValue: string) => void
  /** Return written bytes */
  toByteArray: () => number[]
  /** Return string representation */
  toString: () => string
}

/** Strategy to encode string into QR data segment. */
export type DataEncodeStrategy = (
  data: string,
  stringToBytes: (input: string) => number[]
) => QRDataSegment

/**
 * Galois field polynomial over GF(256).
 * @description Coefficient get, multiply, and modulo.
 */
export type GaloisPolynomial = {
  /** Coefficient at index */
  getAt: (index: number) => number
  /** Number of coefficients */
  getLength: () => number
  /** Multiply by another polynomial */
  multiply: (otherPolynomial: GaloisPolynomial) => GaloisPolynomial
  /** Remainder after division */
  mod: (divisorPolynomial: GaloisPolynomial) => GaloisPolynomial
}

/** GIF frame pixel writer contract. */
export type GifFrameWriter = {
  /** Set pixel at x,y to color index */
  setPixel: (x: number, y: number, pixel: number) => void
  /** Write frame to byte output */
  write: (out: ByteArrayOutput) => void
}

/** LZW code table for GIF encoding. */
export type LzwCodeTable = {
  /** Add string key, assign code */
  add: (key: string) => void
  /** Current table size */
  size: () => number
  /** Code for key or undefined */
  indexOf: (key: string) => number | undefined
  /** True if key present */
  contains: (key: string) => boolean
}

/**
 * Result of QR matrix build step.
 * @description Grid, size, and encoded codewords.
 */
export type MatrixBuildResult = {
  /** Module grid (true/false/null) */
  moduleGrid: (boolean | null)[][]
  /** Side length in modules */
  moduleCountValue: number
  /** Encoded data codewords */
  encodedDataCache: number[]
}

/** Decoded PNG image data. */
export type PngDecode = {
  /** RGBA pixel data */
  data: Uint8Array
  /** Image width in pixels */
  width: number
  /** Image height in pixels */
  height: number
}

/**
 * QR bit buffer for encoding.
 * @description Append and read bits.
 */
export type QRBitBuffer = {
  /** Underlying byte array */
  getBuffer: () => number[]
  /** Bit at index (0-based) */
  getAt: (index: number) => boolean
  /** Append value with bit length */
  put: (numericValue: number, bitLength: number) => void
  /** Total bits written */
  getLengthInBits: () => number
  /** Append single bit */
  putBit: (bitValue: boolean) => void
}

/** Cell size and margin layout. */
export type QRCellLayout = {
  /** Module size in pixels */
  cellSize?: number
  /** Quiet zone in pixels */
  margin?: number
}

/**
 * QR code export API (table, SVG, URL, img, ASCII, canvas).
 * @description Output methods for built QR.
 */
export interface QRCodeExport {
  /** HTML table markup */
  createTableTag(opts?: QRCellLayout): string
  /** SVG markup with optional opts */
  createSvgTag(
    cellSizeOrOpts?: number | QRSvgOptions,
    margin?: number,
    alt?: SvgAccessibilityContent,
    title?: SvgAccessibilityContent
  ): string
  /** Data URL (e.g. GIF) */
  createDataURL(opts?: QRCellLayout): string
  /** HTML img tag */
  createImgTag(opts?: QRCellLayout, alt?: string): string
  /** ASCII art string */
  createASCII(opts?: QRCellLayout): string
  /** Draw on 2D canvas context */
  renderTo2dContext(context: CanvasRenderingContext2D, cellSize?: number): void
}

/**
 * QR code input API (add data, make).
 * @description Build and finalize QR matrix.
 */
export interface QRCodeInput {
  /** Append data with encoding mode */
  addData(data: string, mode: QREncodeMode): void
  /** Build matrix and choose mask */
  make(): void
}

/** Full QR code instance: input, grid, and export. */
export interface QRCodeInstance extends QRCodeInput, QRModuleGrid, QRCodeExport {}

/** Single segment of encoded QR data. */
export type QRDataSegment = {
  /** Encoding mode flag */
  getMode(): number
  /** Length in mode units */
  getLength(): number
  /** Write segment bits to buffer */
  write(bitBuffer: QRBitBuffer): void
}

/** Allowed QR data encoding modes. */
export type QREncodeMode = 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji'

/** Error correction levels L/M/Q/H. */
export type QRErrorLevel = 'L' | 'M' | 'Q' | 'H'

/**
 * QR module grid read API.
 * @description Query dark/light and size.
 */
export interface QRModuleGrid {
  /** True if module at row,col is dark */
  isDark(row: number, col: number): boolean
  /** Grid side length in modules */
  getModuleCount(): number
}

/** SVG output options (cell, margin, scalable, alt, title). */
export type QRSvgOptions = QRCellLayout & {
  /** Omit fixed width/height */
  scalable?: boolean
  /** Accessibility description */
  alt?: SvgAccessibilityContent
  /** Accessibility title */
  title?: SvgAccessibilityContent
}

/** QR version index 0..40. */
export type QRVersionIndex =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40

/** Reed–Solomon block layout (total and data codewords). */
export type RSBlockLayout = {
  /** Total codewords per block */
  totalCount: number
  /** Data codewords per block */
  dataCount: number
}

/** SVG title/alt: string or object with text and id. */
export type SvgAccessibilityContent = string | { text: string | null; id: string | null }

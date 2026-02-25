import type * as Types from '@core/Types.ts'

/**
 * PNG encoder from QR grid.
 * @description Encodes QR grid to grayscale or RGB PNG.
 */
export class PNG {
  /** PNG file signature bytes. */
  static readonly #signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  /** CRC-32 lookup table for chunk checksums. */
  static readonly #crcTable: Uint32Array = (() => {
    const table = new Uint32Array(256)
    for (let index = 0; index < 256; index += 1) {
      let entryValue = index
      for (let bitIndex = 0; bitIndex < 8; bitIndex += 1) {
        entryValue = entryValue & 1 ? 0xedb88320 ^ (entryValue >>> 1) : entryValue >>> 1
      }
      table[index] = entryValue
    }
    return table
  })()

  /**
   * Create PNG data URL from QR grid.
   * @description Encodes grid to grayscale or RGB PNG via CompressionStream.
   * @param qr - Module grid
   * @param cellSize - Module size, default 2
   * @param margin - Quiet zone, default cellSize * 4
   * @param color - Foreground hex; with background uses RGB
   * @param background - Background hex; with color uses RGB
   * @returns Promise of data:image/png;base64,... string
   */
  static async createDataURL(
    qr: Types.QRModuleGrid,
    cellSize?: number,
    margin?: number,
    color?: string,
    background?: string
  ): Promise<string> {
    const effectiveCellSize = cellSize ?? 2
    const effectiveMargin = margin ?? effectiveCellSize * 4
    const foregroundRgb = color ? PNG.#parseHexColor(color) : undefined
    const backgroundRgb = background ? PNG.#parseHexColor(background) : undefined
    const {
      width,
      height,
      data: pixelData,
      channels
    } = PNG.#buildPixelsFromGrid(
      qr,
      effectiveCellSize,
      effectiveMargin,
      foregroundRgb,
      backgroundRgb
    )
    const pngBytes = await PNG.#encodeToPngBytes(width, height, pixelData, channels)
    return 'data:image/png;base64,' + PNG.#encodeBase64(pngBytes)
  }

  /**
   * Build PNG chunk with type and data.
   * @description Encodes length, type, data, and CRC32.
   * @param chunkType - Chunk type code e.g. IHDR
   * @param chunkData - Chunk payload bytes
   * @returns Chunk bytes with length and CRC
   */
  static #buildChunk(chunkType: string, chunkData: Uint8Array): Uint8Array {
    const typeBytes = new TextEncoder().encode(chunkType)
    const combined = new Uint8Array(typeBytes.length + chunkData.length)
    combined.set(typeBytes, 0)
    combined.set(chunkData, typeBytes.length)
    const crcValue = PNG.#computeCrc32(combined)
    const chunkBytes = new Uint8Array(4 + 4 + chunkData.length + 4)
    PNG.#writeUint32BigEndian(chunkBytes, 0, chunkData.length)
    chunkBytes.set(typeBytes, 4)
    chunkBytes.set(chunkData, 8)
    PNG.#writeUint32BigEndian(chunkBytes, 8 + chunkData.length, crcValue)
    return chunkBytes
  }

  /**
   * Build IEND chunk.
   * @description Empty chunk marking PNG end.
   * @returns IEND chunk bytes
   */
  static #buildIendChunk(): Uint8Array {
    return PNG.#buildChunk('IEND', new Uint8Array(0))
  }

  /**
   * Build IHDR chunk for dimensions and color.
   * @description Writes width, height, bit depth, color type.
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   * @param colorTypeCode - 0 grayscale or 2 RGB
   * @returns IHDR chunk bytes
   */
  static #buildIhdrChunk(
    width: number,
    height: number,
    colorTypeCode: Types.PngColorTypeCode
  ): Uint8Array {
    const ihdrData = new Uint8Array(13)
    PNG.#writeUint32BigEndian(ihdrData, 0, width)
    PNG.#writeUint32BigEndian(ihdrData, 4, height)
    ihdrData[8] = 8
    ihdrData[9] = colorTypeCode
    ihdrData[10] = 0
    ihdrData[11] = 0
    ihdrData[12] = 0
    return PNG.#buildChunk('IHDR', ihdrData)
  }

  /**
   * Build raw pixel buffer from QR grid.
   * @description Maps modules to grayscale or RGB pixels.
   * @param qr - QR module grid
   * @param cellSize - Module size in pixels
   * @param margin - Quiet zone in pixels
   * @param foregroundRgb - Optional foreground RGB tuple
   * @param backgroundRgb - Optional background RGB tuple
   * @returns Width, height, pixel data, channel count
   */
  static #buildPixelsFromGrid(
    qr: Types.QRModuleGrid,
    cellSize: number,
    margin: number,
    foregroundRgb?: Types.PngRgbTuple,
    backgroundRgb?: Types.PngRgbTuple
  ): Types.PngPixelBuildResult {
    const moduleCount = qr.getModuleCount()
    const width = moduleCount * cellSize + 2 * margin
    const height = width
    const useRgbColors = foregroundRgb !== undefined && backgroundRgb !== undefined
    const channels: Types.PngChannelCount = useRgbColors ? 3 : 1
    const pixelData = new Uint8Array(width * height * channels)
    const [redFg, greenFg, blueFg] = foregroundRgb ?? [0, 0, 0]
    const [redBg, greenBg, blueBg] = backgroundRgb ?? [255, 255, 255]
    for (let pixelY = 0; pixelY < height; pixelY += 1) {
      for (let pixelX = 0; pixelX < width; pixelX += 1) {
        const isMarginArea = pixelX < margin ||
          pixelX >= width - margin ||
          pixelY < margin ||
          pixelY >= height - margin
        const moduleRow = Math.floor((pixelY - margin) / cellSize)
        const moduleCol = Math.floor((pixelX - margin) / cellSize)
        const isDarkModule = !isMarginArea && qr.isDark(moduleRow, moduleCol)
        if (useRgbColors) {
          const pixelOffset = (pixelY * width + pixelX) * 3
          if (isDarkModule) {
            pixelData[pixelOffset] = redFg
            pixelData[pixelOffset + 1] = greenFg
            pixelData[pixelOffset + 2] = blueFg
          } else {
            pixelData[pixelOffset] = redBg
            pixelData[pixelOffset + 1] = greenBg
            pixelData[pixelOffset + 2] = blueBg
          }
        } else {
          pixelData[pixelY * width + pixelX] = isDarkModule ? 0 : 255
        }
      }
    }
    return { width, height, data: pixelData, channels }
  }

  /**
   * Build PNG filter scanlines from pixels.
   * @description Prepends filter byte per row for deflate.
   * @param width - Image width
   * @param height - Image height
   * @param pixels - Raw pixel bytes
   * @param channels - 1 or 3 channel count
   * @returns Scanline bytes with filter bytes
   */
  static #buildScanlines(
    width: number,
    height: number,
    pixels: Uint8Array,
    channels: Types.PngChannelCount
  ): Uint8Array {
    const bytesPerRow = width * channels
    const scanlineBuffer = new Uint8Array(height * (1 + bytesPerRow))
    for (let rowIndex = 0; rowIndex < height; rowIndex += 1) {
      scanlineBuffer[rowIndex * (1 + bytesPerRow)] = 0
      for (let byteIndex = 0; byteIndex < bytesPerRow; byteIndex += 1) {
        scanlineBuffer[rowIndex * (1 + bytesPerRow) + 1 + byteIndex] =
          pixels[rowIndex * bytesPerRow + byteIndex] ?? 0
      }
    }
    return scanlineBuffer
  }

  /**
   * Compute Adler-32 checksum of bytes.
   * @description Used for zlib stream checksum.
   * @param data - Input bytes
   * @returns Adler-32 value
   */
  static #computeAdler32(data: Uint8Array): number {
    let sum1 = 1
    let sum2 = 0
    const modulus = 65521
    for (let byteIndex = 0; byteIndex < data.length; byteIndex += 1) {
      const byteValue = data[byteIndex] ?? 0
      sum1 = (sum1 + byteValue) % modulus
      sum2 = (sum2 + sum1) % modulus
    }
    return ((sum2 << 16) | sum1) >>> 0
  }

  /**
   * Compute CRC-32 of bytes.
   * @description Used for PNG chunk CRC.
   * @param data - Input bytes
   * @returns CRC-32 value
   */
  static #computeCrc32(data: Uint8Array): number {
    let crcValue = 0xffffffff
    for (let byteIndex = 0; byteIndex < data.length; byteIndex += 1) {
      const byteValue = data[byteIndex] ?? 0
      crcValue = (PNG.#crcTable[(crcValue ^ byteValue) & 0xff] ?? 0) ^ (crcValue >>> 8)
    }
    return (crcValue ^ 0xffffffff) >>> 0
  }

  /**
   * Deflate bytes with deflate-raw.
   * @description Uses CompressionStream, returns raw deflated.
   * @param bytes - Uncompressed bytes
   * @returns Promise of deflated bytes
   */
  static async #deflateRawBytes(bytes: Uint8Array): Promise<Uint8Array> {
    const stream = new Blob([bytes.slice()])
      .stream()
      .pipeThrough(new CompressionStream('deflate-raw'))
    const blob = await new Response(stream).blob()
    return new Uint8Array(await blob.arrayBuffer())
  }

  /**
   * Encode bytes to base64 string.
   * @description Standard base64 alphabet with padding.
   * @param bytes - Input bytes
   * @returns Base64 string
   */
  static #encodeBase64(bytes: Uint8Array): string {
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let base64String = ''
    for (let byteIndex = 0; byteIndex < bytes.length; byteIndex += 3) {
      const byteFirst = bytes[byteIndex] ?? 0
      const byteSecond = bytes[byteIndex + 1]
      const byteThird = bytes[byteIndex + 2]
      base64String += base64Chars[byteFirst >> 2]
      base64String += base64Chars[((byteFirst & 3) << 4) | ((byteSecond ?? 0) >> 4)]
      base64String += byteIndex + 1 < bytes.length
        ? base64Chars[(((byteSecond ?? 0) & 15) << 2) | ((byteThird ?? 0) >> 6)]
        : '='
      base64String += byteIndex + 2 < bytes.length ? base64Chars[(byteThird ?? 0) & 63] : '='
    }
    return base64String
  }

  /**
   * Encode pixels to full PNG bytes.
   * @description Builds IHDR, IDAT, IEND and concatenates.
   * @param width - Image width
   * @param height - Image height
   * @param pixels - Raw pixel bytes
   * @param channels - 1 or 3 channel count
   * @returns Promise of complete PNG bytes
   */
  static async #encodeToPngBytes(
    width: number,
    height: number,
    pixels: Uint8Array,
    channels: Types.PngChannelCount
  ): Promise<Uint8Array> {
    const scanlineBytes = PNG.#buildScanlines(width, height, pixels, channels)
    const compressedBytes = await PNG.#deflateRawBytes(scanlineBytes)
    const idatPayload = PNG.#wrapZlibStream(scanlineBytes, compressedBytes)
    const idatChunk = PNG.#buildChunk('IDAT', idatPayload)
    const colorTypeCode: Types.PngColorTypeCode = channels === 3 ? 2 : 0
    const chunkParts = [
      PNG.#signature,
      PNG.#buildIhdrChunk(width, height, colorTypeCode),
      idatChunk,
      PNG.#buildIendChunk()
    ]
    const totalLength = chunkParts.reduce(
      (accumulatedLength, chunkPart) => accumulatedLength + chunkPart.length,
      0
    )
    const pngBuffer = new Uint8Array(totalLength)
    let writeOffset = 0
    for (const chunkPart of chunkParts) {
      pngBuffer.set(chunkPart, writeOffset)
      writeOffset += chunkPart.length
    }
    return pngBuffer
  }

  /**
   * Parse hex color string to RGB tuple.
   * @description Supports 3- or 6-digit hex with optional #.
   * @param hex - Hex color e.g. #000 or fff
   * @returns RGB tuple 0–255
   */
  static #parseHexColor(hex: string): Types.PngRgbTuple {
    const hexDigits = hex.replace(/^#/, '')
    if (hexDigits.length === 3) {
      const char0 = hexDigits.charAt(0)
      const char1 = hexDigits.charAt(1)
      const char2 = hexDigits.charAt(2)
      return [parseInt(char0 + char0, 16), parseInt(char1 + char1, 16), parseInt(char2 + char2, 16)]
    }
    if (hexDigits.length === 6) {
      return [
        parseInt(hexDigits.slice(0, 2), 16),
        parseInt(hexDigits.slice(2, 4), 16),
        parseInt(hexDigits.slice(4, 6), 16)
      ]
    }
    return [0, 0, 0]
  }

  /**
   * Write uint32 big-endian at offset.
   * @description Four bytes at buffer offset.
   * @param buffer - Target buffer
   * @param offset - Write offset
   * @param uintValue - 32-bit value
   */
  static #writeUint32BigEndian(buffer: Uint8Array, offset: number, uintValue: number): void {
    buffer[offset] = (uintValue >>> 24) & 0xff
    buffer[offset + 1] = (uintValue >>> 16) & 0xff
    buffer[offset + 2] = (uintValue >>> 8) & 0xff
    buffer[offset + 3] = uintValue & 0xff
  }

  /**
   * Wrap deflated data in zlib format.
   * @description Adds zlib header and Adler-32 footer.
   * @param uncompressed - Original bytes for checksum
   * @param deflated - Deflated payload
   * @returns Zlib-wrapped bytes
   */
  static #wrapZlibStream(uncompressed: Uint8Array, deflated: Uint8Array): Uint8Array {
    const checksum = PNG.#computeAdler32(uncompressed)
    const zlibBytes = new Uint8Array(2 + deflated.length + 4)
    zlibBytes[0] = 0x78
    zlibBytes[1] = 0x9c
    zlibBytes.set(deflated, 2)
    PNG.#writeUint32BigEndian(zlibBytes, 2 + deflated.length, checksum)
    return zlibBytes
  }
}

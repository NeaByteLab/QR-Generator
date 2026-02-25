import type * as Types from '@core/Types.ts'

/**
 * PNG decode helper (chunks, deflate, unfilter).
 * @description Parses PNG bytes to RGBA and dimensions.
 */
export class Decode {
  /**
   * Decode PNG bytes to RGBA.
   * @description Parses chunks, inflates IDAT, unfilters, converts to RGBA.
   * @param pngBytes - Raw PNG file bytes
   * @returns Decoded data, width, height
   * @throws {Error} Invalid signature, IHDR, IDAT, or color type
   */
  static async png(pngBytes: Uint8Array): Promise<Types.PngDecode> {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    for (let byteIndex = 0; byteIndex < 8; byteIndex++) {
      if (pngBytes[byteIndex] !== pngSignature[byteIndex]) {
        throw new Error('Decode.png: invalid PNG signature')
      }
    }
    const chunks = Decode.#parseChunks(pngBytes)
    const ihdrChunks = chunks.get('IHDR')
    const firstIhdrChunk = ihdrChunks?.[0]
    if (!ihdrChunks || ihdrChunks.length !== 1 || !firstIhdrChunk || firstIhdrChunk.length < 13) {
      throw new Error('Decode.png: missing or invalid IHDR')
    }
    const ihdrBytes = firstIhdrChunk
    const width = Decode.#readU32(ihdrBytes, 0)
    const height = Decode.#readU32(ihdrBytes, 4)
    const bitDepth = ihdrBytes[8] ?? 0
    const colorType = ihdrBytes[9] ?? -1
    const interlace = ihdrBytes[12] ?? 1
    const allowedColorTypes = [0, 2, 3, 4, 6]
    if (bitDepth !== 8 || !allowedColorTypes.includes(colorType)) {
      throw new Error(
        'Decode.png: only 8-bit grayscale, RGB, indexed, grayscale+alpha, or RGBA supported'
      )
    }
    if (interlace !== 0) {
      throw new Error('Decode.png: interlaced PNG not supported')
    }
    if (colorType === 3) {
      const plteChunks = chunks.get('PLTE')
      const plteData = plteChunks?.[0]
      if (
        !plteData ||
        plteData.length % 3 !== 0 ||
        plteData.length === 0 ||
        plteData.length > 768
      ) {
        throw new Error('Decode.png: color type 3 requires PLTE chunk (1–256 entries)')
      }
    }
    const idatChunks = chunks.get('IDAT')
    if (!idatChunks || idatChunks.length === 0) {
      throw new Error('Decode.png: missing IDAT')
    }
    const idatTotalLen = idatChunks.reduce((totalLen, idatChunk) => totalLen + idatChunk.length, 0)
    const zlibBytes = new Uint8Array(idatTotalLen)
    let zlibOffset = 0
    for (const idatChunk of idatChunks) {
      zlibBytes.set(idatChunk, zlibOffset)
      zlibOffset += idatChunk.length
    }
    const decompressedRaw = await Decode.#inflate(zlibBytes)
    const bytesPerPixel = Decode.#bytesPerPixelForColorType(colorType)
    const unfilteredData = Decode.#unfilter(decompressedRaw, width, height, bytesPerPixel)
    const rgbaData = Decode.#toRgba(unfilteredData, width, height, colorType, chunks)
    return { data: rgbaData, width, height }
  }

  /**
   * Bytes per pixel for PNG color type.
   * @description Returns 1, 2, 3, or 4 for grayscale, GA, RGB, RGBA, indexed.
   * @param colorType - PNG color type 0, 2, 3, 4, or 6
   * @returns Bytes per pixel
   */
  static #bytesPerPixelForColorType(colorType: number): number {
    if (colorType === 0) {
      return 1
    }
    if (colorType === 2) {
      return 3
    }
    if (colorType === 3) {
      return 1
    }
    if (colorType === 4) {
      return 2
    }
    return 4
  }

  /**
   * Inflate zlib bytes via DecompressionStream.
   * @description Decompresses deflate payload to raw bytes.
   * @param zlibData - Zlib-wrapped deflate bytes
   * @returns Promise of decompressed bytes
   */
  static #inflate(zlibData: Uint8Array): Promise<Uint8Array> {
    const stream = new DecompressionStream('deflate')
    const writer = stream.writable.getWriter()
    writer.write(zlibData as BufferSource)
    writer.close()
    const chunkList: Uint8Array[] = []
    const readable = stream.readable as unknown as AsyncIterable<Uint8Array>
    return (async () => {
      for await (const chunkBytes of readable) {
        chunkList.push(chunkBytes)
      }
      const totalBytes = chunkList.reduce((sum, chunk) => sum + chunk.length, 0)
      const decompressedBytes = new Uint8Array(totalBytes)
      let writeOffset = 0
      for (const chunk of chunkList) {
        decompressedBytes.set(chunk, writeOffset)
        writeOffset += chunk.length
      }
      return decompressedBytes
    })()
  }

  /**
   * Paeth predictor for PNG filter type 4.
   * @description Returns left, above, or upper-left by predictor.
   * @param leftByte - Left neighbor byte
   * @param aboveByte - Above neighbor byte
   * @param upperLeftByte - Diagonal neighbor byte
   * @returns Predicted byte
   */
  static #paeth(leftByte: number, aboveByte: number, upperLeftByte: number): number {
    const predictor = leftByte + aboveByte - upperLeftByte
    const deltaA = Math.abs(predictor - leftByte)
    const deltaB = Math.abs(predictor - aboveByte)
    const deltaC = Math.abs(predictor - upperLeftByte)
    if (deltaA <= deltaB && deltaA <= deltaC) {
      return leftByte
    }
    if (deltaB <= deltaC) {
      return aboveByte
    }
    return upperLeftByte
  }

  /**
   * Parse PNG into chunk type to data arrays.
   * @description Reads length, type, data, CRC for each chunk.
   * @param pngBytes - Raw PNG bytes (after signature)
   * @returns Map of chunk type to array of chunk payloads
   */
  static #parseChunks(pngBytes: Uint8Array): Map<string, Uint8Array[]> {
    const chunks = new Map<string, Uint8Array[]>()
    let byteOffset = 8
    while (byteOffset + 12 <= pngBytes.length) {
      const chunkLength = Decode.#readU32(pngBytes, byteOffset)
      const chunkType = new TextDecoder().decode(pngBytes.slice(byteOffset + 4, byteOffset + 8))
      byteOffset += 8
      const existingChunks = chunks.get(chunkType)
      if (existingChunks) {
        existingChunks.push(pngBytes.slice(byteOffset, byteOffset + chunkLength))
      } else {
        chunks.set(chunkType, [pngBytes.slice(byteOffset, byteOffset + chunkLength)])
      }
      byteOffset += chunkLength + 4
    }
    return chunks
  }

  /**
   * Read big-endian uint32 at offset.
   * @description Reads 4 bytes at offset as unsigned 32-bit.
   * @param bytes - Source byte array
   * @param offset - Start index (0-based)
   * @returns 32-bit unsigned integer
   */
  static #readU32(bytes: Uint8Array, offset: number): number {
    return (
      ((bytes[offset] ?? 0) << 24) |
      ((bytes[offset + 1] ?? 0) << 16) |
      ((bytes[offset + 2] ?? 0) << 8) |
      (bytes[offset + 3] ?? 0)
    )
  }

  /**
   * Convert unfiltered scanlines to RGBA.
   * @description Uses PLTE/tRNS for indexed; expands gray/GA/RGB.
   * @param unfilteredData - Decoded scanline bytes
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   * @param colorType - PNG color type
   * @param chunks - Parsed chunks (PLTE, tRNS)
   * @returns RGBA Uint8Array (width*height*4)
   * @throws {Error} Missing PLTE for color type 3
   */
  static #toRgba(
    unfilteredData: Uint8Array,
    width: number,
    height: number,
    colorType: number,
    chunks: Map<string, Uint8Array[]>
  ): Uint8Array {
    const totalPixels = width * height
    const rgbaData = new Uint8Array(totalPixels * 4)
    if (colorType === 0) {
      for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++) {
        const grayByte = unfilteredData[pixelIndex] ?? 0
        rgbaData[pixelIndex * 4] = grayByte
        rgbaData[pixelIndex * 4 + 1] = grayByte
        rgbaData[pixelIndex * 4 + 2] = grayByte
        rgbaData[pixelIndex * 4 + 3] = 0xff
      }
      return rgbaData
    }
    if (colorType === 2) {
      for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++) {
        const rgbOffset = pixelIndex * 3
        rgbaData[pixelIndex * 4] = unfilteredData[rgbOffset] ?? 0
        rgbaData[pixelIndex * 4 + 1] = unfilteredData[rgbOffset + 1] ?? 0
        rgbaData[pixelIndex * 4 + 2] = unfilteredData[rgbOffset + 2] ?? 0
        rgbaData[pixelIndex * 4 + 3] = 0xff
      }
      return rgbaData
    }
    if (colorType === 3) {
      const plteData = chunks.get('PLTE')?.[0]
      const trnsData = chunks.get('tRNS')?.[0]
      if (!plteData) {
        throw new Error('Decode.png: missing PLTE for color type 3')
      }
      const numEntries = plteData.length / 3
      for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++) {
        const paletteIndex = Math.min(unfilteredData[pixelIndex] ?? 0, numEntries - 1)
        const redByte = plteData[paletteIndex * 3] ?? 0
        const greenByte = plteData[paletteIndex * 3 + 1] ?? 0
        const blueByte = plteData[paletteIndex * 3 + 2] ?? 0
        const alphaByte = paletteIndex < (trnsData?.length ?? 0)
          ? (trnsData?.[paletteIndex] ?? 0xff)
          : 0xff
        rgbaData[pixelIndex * 4] = redByte
        rgbaData[pixelIndex * 4 + 1] = greenByte
        rgbaData[pixelIndex * 4 + 2] = blueByte
        rgbaData[pixelIndex * 4 + 3] = alphaByte
      }
      return rgbaData
    }
    if (colorType === 4) {
      for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++) {
        const grayByte = unfilteredData[pixelIndex * 2] ?? 0
        const alphaByte = unfilteredData[pixelIndex * 2 + 1] ?? 0xff
        rgbaData[pixelIndex * 4] = grayByte
        rgbaData[pixelIndex * 4 + 1] = grayByte
        rgbaData[pixelIndex * 4 + 2] = grayByte
        rgbaData[pixelIndex * 4 + 3] = alphaByte
      }
      return rgbaData
    }
    return unfilteredData
  }

  /**
   * Apply PNG scanline filters.
   * @description Decodes filter types None, Sub, Up, Average, Paeth.
   * @param rawBytes - Compressed raw IDAT bytes
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   * @param bytesPerPixel - Bytes per pixel (1, 2, 3, or 4)
   * @returns Unfiltered scanline bytes
   */
  static #unfilter(
    rawBytes: Uint8Array,
    width: number,
    height: number,
    bytesPerPixel: number
  ): Uint8Array {
    const outputPixels = new Uint8Array(width * height * bytesPerPixel)
    let rawOffset = 0
    let outOffset = 0
    let previousRow: Uint8Array | null = null
    for (let rowIndex = 0; rowIndex < height; rowIndex++) {
      const filterType = rawBytes[rawOffset]
      rawOffset += 1
      for (let colIndex = 0; colIndex < width * bytesPerPixel; colIndex++) {
        const currentByte = rawBytes[rawOffset] ?? 0
        const leftByte = colIndex >= bytesPerPixel
          ? (outputPixels[outOffset - bytesPerPixel] ?? 0)
          : 0
        const aboveByte = previousRow ? (previousRow[colIndex] ?? 0) : 0
        const upperLeftByte = colIndex >= bytesPerPixel && previousRow
          ? (previousRow[colIndex - bytesPerPixel] ?? 0)
          : 0
        let decodedByte: number = currentByte
        if (filterType === 1) {
          decodedByte = (currentByte + leftByte) & 0xff
        } else if (filterType === 2) {
          decodedByte = (currentByte + aboveByte) & 0xff
        } else if (filterType === 3) {
          decodedByte = (currentByte + ((leftByte + aboveByte) >>> 1)) & 0xff
        } else if (filterType === 4) {
          decodedByte = (currentByte + Decode.#paeth(leftByte, aboveByte, upperLeftByte)) & 0xff
        }
        outputPixels[outOffset] = decodedByte
        rawOffset++
        outOffset++
      }
      previousRow = outputPixels.slice(outOffset - width * bytesPerPixel, outOffset)
    }
    return outputPixels
  }
}

import type * as Types from '@app/core/Types.ts'
import * as Helpers from '@app/core/helpers/index.ts'

/**
 * GIF87a encoding (LZW, global palette, base64).
 * @description Builds GIF from pixel callback and returns data URL.
 */
export class Gif {
  /**
   * Create GIF data URL from pixel callback.
   * @description Renders pixels, LZW-encodes, base64.
   * @param width - Image width
   * @param height - Image height
   * @param getPixel - Callback (x,y) -> color index 0..255
   * @returns data:image/gif;base64,... string
   * @throws {Error} Byte index out of range or LZW error
   */
  static createDataURL(
    width: number,
    height: number,
    getPixel: (x: number, y: number) => number
  ): string {
    const pixelData = Gif.#buildPixelData(width, height, getPixel)
    const bytes = Gif.#encodeToBytes(width, height, pixelData)
    const base64Stream = Helpers.EncodeStream.create()
    for (let i = 0; i < bytes.length; i += 1) {
      const byteValue = bytes[i]
      if (byteValue === undefined) {
        throw new Error('Gif.createDataURL: byte index out of range')
      }
      base64Stream.writeByte(byteValue)
    }
    base64Stream.flush()
    return 'data:image/gif;base64,' + base64Stream.toString()
  }

  /** Bit packer writing to byte output. */
  static #bitOutputStream(outputStream: Types.ByteArrayOutput): Types.BitPackOutput {
    let bitLength = 0
    let bitBuffer = 0
    const write = function (data: number, length: number): void {
      if (data >>> length !== 0) {
        throw new Error('Gif.createDataURL: value exceeds given bit length')
      }
      while (bitLength + length >= 8) {
        outputStream.writeByte(0xff & ((data << bitLength) | bitBuffer))
        length -= 8 - bitLength
        data >>>= 8 - bitLength
        bitBuffer = 0
        bitLength = 0
      }
      bitBuffer = (data << bitLength) | bitBuffer
      bitLength = bitLength + length
    }
    const flush = function (): void {
      if (bitLength > 0) {
        outputStream.writeByte(bitBuffer)
      }
    }
    return { write, flush }
  }

  /** Build pixel array from getPixel callback. */
  static #buildPixelData(
    width: number,
    height: number,
    getPixel: (x: number, y: number) => number
  ): number[] {
    const pixelData = new Array<number>(width * height)
    for (let row = 0; row < height; row += 1) {
      for (let col = 0; col < width; col += 1) {
        pixelData[row * width + col] = getPixel(col, row)
      }
    }
    return pixelData
  }

  /** Encode pixel data to GIF87a byte array. */
  static #encodeToBytes(width: number, height: number, pixelData: number[]): number[] {
    const outputStream = Helpers.ByteStream.create()
    outputStream.writeString('GIF87a')
    outputStream.writeShort(width)
    outputStream.writeShort(height)
    outputStream.writeByte(0x80)
    outputStream.writeByte(0)
    outputStream.writeByte(0)
    outputStream.writeByte(0x00)
    outputStream.writeByte(0x00)
    outputStream.writeByte(0x00)
    outputStream.writeByte(0xff)
    outputStream.writeByte(0xff)
    outputStream.writeByte(0xff)
    outputStream.writeString(',')
    outputStream.writeShort(0)
    outputStream.writeShort(0)
    outputStream.writeShort(width)
    outputStream.writeShort(height)
    outputStream.writeByte(0)
    const lzwMinCodeSize = 2
    const rasterData = Gif.#getLZWRaster(pixelData, lzwMinCodeSize)
    outputStream.writeByte(lzwMinCodeSize)
    let writeOffset = 0
    while (rasterData.length - writeOffset > 255) {
      outputStream.writeByte(255)
      outputStream.writeBytes(rasterData, writeOffset, 255)
      writeOffset += 255
    }
    outputStream.writeByte(rasterData.length - writeOffset)
    outputStream.writeBytes(rasterData, writeOffset, rasterData.length - writeOffset)
    outputStream.writeByte(0x00)
    outputStream.writeString(';')
    return outputStream.toByteArray()
  }

  /** LZW-compress pixel data to raster bytes. */
  static #getLZWRaster(pixelData: number[], lzwMinCodeSize: number): number[] {
    const clearCode = 1 << lzwMinCodeSize
    const endCode = (1 << lzwMinCodeSize) + 1
    let currentBitLength = lzwMinCodeSize + 1
    const lzwCodeTable = Gif.#lzwTable()
    for (let i = 0; i < clearCode; i += 1) {
      lzwCodeTable.add(String.fromCharCode(i))
    }
    lzwCodeTable.add(String.fromCharCode(clearCode))
    lzwCodeTable.add(String.fromCharCode(endCode))
    const byteOutputStream = Helpers.ByteStream.create()
    const bitStream = Gif.#bitOutputStream(byteOutputStream)
    bitStream.write(clearCode, currentBitLength)
    let dataIndex = 0
    const firstPixel = pixelData[dataIndex]
    let currentString = String.fromCharCode(firstPixel ?? 0)
    dataIndex += 1
    while (dataIndex < pixelData.length) {
      const nextPixel = pixelData[dataIndex]
      const nextChar = String.fromCharCode(nextPixel ?? 0)
      dataIndex += 1
      if (lzwCodeTable.contains(currentString + nextChar)) {
        currentString = currentString + nextChar
      } else {
        const lzwCode = lzwCodeTable.indexOf(currentString)
        if (lzwCode === undefined) {
          throw new Error('Gif.createDataURL: missing code for current string')
        }
        bitStream.write(lzwCode, currentBitLength)
        if (lzwCodeTable.size() < 0xfff) {
          if (lzwCodeTable.size() === 1 << currentBitLength) {
            currentBitLength += 1
          }
          lzwCodeTable.add(currentString + nextChar)
        }
        currentString = nextChar
      }
    }
    const finalLzwCode = lzwCodeTable.indexOf(currentString)
    if (finalLzwCode === undefined) {
      throw new Error('Gif.createDataURL: missing code for final string')
    }
    bitStream.write(finalLzwCode, currentBitLength)
    bitStream.write(endCode, currentBitLength)
    bitStream.flush()
    return byteOutputStream.toByteArray()
  }

  /** Create LZW code table (add, size, indexOf, contains). */
  static #lzwTable(): Types.LzwCodeTable {
    const codeMap: Record<string, number> = {}
    let tableSize = 0
    const contains = function (key: string): boolean {
      return typeof codeMap[key] !== 'undefined'
    }
    const add = function (key: string): void {
      if (contains(key)) {
        throw new Error('Gif.createDataURL: duplicate table key')
      }
      codeMap[key] = tableSize
      tableSize += 1
    }
    const size = function (): number {
      return tableSize
    }
    const indexOf = function (key: string): number | undefined {
      return codeMap[key]
    }
    return { add, size, indexOf, contains }
  }
}

import * as Helpers from '@core/helpers/index.ts'

/**
 * String-to-bytes encoders (UTF-8, custom map).
 * @description UTF-8 and base64-decoded unicode map.
 */
export class Byte {
  /**
   * Create encoder from base64 unicode map.
   * @description Decodes map, returns (string -> bytes) function.
   * @param unicodeData - Base64-encoded char->bytes map
   * @param numChars - Expected map entry count
   * @returns Function mapping string to byte array
   * @throws {Error} Unexpected end or count mismatch
   */
  static createStringToBytes(
    unicodeData: string,
    numChars: number
  ): (inputString: string) => number[] {
    const unicodeMap = (function (): Record<string, number> {
      const decodedStream = Helpers.DecodeStream.create(unicodeData)
      const readByte = function (): number {
        const byteValue = decodedStream.read()
        if (byteValue === -1) {
          throw new Error('Byte.createStringToBytes: unexpected end of unicode map stream')
        }
        return byteValue
      }
      let entryCount = 0
      const charToBytesMap: Record<string, number> = {}
      while (true) {
        const unicodeHigh = decodedStream.read()
        if (unicodeHigh === -1) {
          break
        }
        const unicodeLow = readByte()
        const bytesHigh = readByte()
        const bytesLow = readByte()
        const unicodeChar = String.fromCharCode((unicodeHigh << 8) | unicodeLow)
        const byteMapping = (bytesHigh << 8) | bytesLow
        charToBytesMap[unicodeChar] = byteMapping
        entryCount += 1
      }
      if (entryCount !== numChars) {
        throw new Error(
          `Byte.createStringToBytes: unicode map entry count mismatch (got ${entryCount}, expected ${numChars})`
        )
      }
      return charToBytesMap
    })()
    const unknownCharCode = '?'.charCodeAt(0)
    return function (inputString: string): number[] {
      const outputBytes: number[] = []
      for (let i = 0; i < inputString.length; i += 1) {
        const charCode = inputString.charCodeAt(i)
        if (charCode < 128) {
          outputBytes.push(charCode)
        } else {
          const mappedBytes = unicodeMap[inputString.charAt(i)]
          if (typeof mappedBytes === 'number') {
            if ((mappedBytes & 0xff) === mappedBytes) {
              outputBytes.push(mappedBytes)
            } else {
              outputBytes.push(mappedBytes >>> 8)
              outputBytes.push(mappedBytes & 0xff)
            }
          } else {
            outputBytes.push(unknownCharCode)
          }
        }
      }
      return outputBytes
    }
  }

  /**
   * Encode string to UTF-8 bytes.
   * @description Encodes code points to UTF-8 octets.
   * @param inputString - String to encode
   * @returns UTF-8 byte array
   */
  static stringToBytes(inputString: string): number[] {
    const utf8Bytes: number[] = []
    for (let i = 0; i < inputString.length; i += 1) {
      let codePoint = inputString.charCodeAt(i)
      if (codePoint < 0x80) {
        utf8Bytes.push(codePoint)
      } else if (codePoint < 0x800) {
        utf8Bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f))
      } else if (codePoint < 0xd800 || codePoint >= 0xe000) {
        utf8Bytes.push(
          0xe0 | (codePoint >> 12),
          0x80 | ((codePoint >> 6) & 0x3f),
          0x80 | (codePoint & 0x3f)
        )
      } else {
        i += 1
        codePoint = 0x10000 + (((codePoint & 0x3ff) << 10) | (inputString.charCodeAt(i) & 0x3ff))
        utf8Bytes.push(
          0xf0 | (codePoint >> 18),
          0x80 | ((codePoint >> 12) & 0x3f),
          0x80 | ((codePoint >> 6) & 0x3f),
          0x80 | (codePoint & 0x3f)
        )
      }
    }
    return utf8Bytes
  }
}

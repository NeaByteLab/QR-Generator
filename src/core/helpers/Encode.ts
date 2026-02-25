import type * as Types from '@app/core/Types.ts'
import * as Helpers from '@app/core/helpers/index.ts'

const encoderRegistry: Record<string, Types.DataEncodeStrategy> = {
  Alphanumeric: (data, _stringToBytes) => Encode.alphaNum(data),
  Byte: (data, stringToBytes) => Encode.byte(data, stringToBytes),
  Kanji: (data, stringToBytes) => Encode.kanji(data, stringToBytes),
  Numeric: (data, _stringToBytes) => Encode.number(data)
}

/**
 * QR data encoding (Numeric, Alpha, Byte, Kanji).
 * @description Encodes string to QR data segments and codewords.
 */
export class Encode {
  /** First padding byte (0xec) */
  private static readonly paddingByteFirst = 0xec
  /** Second padding byte (0x11) */
  private static readonly paddingByteSecond = 0x11
  /** Padding bit value (false) */
  private static readonly paddingBitValue = false

  /**
   * Encode alphanumeric string to segment.
   * @description Maps 0-9, A-Z, space, $%*+-./: to 11/6-bit codes.
   * @param data - Alphanumeric string
   * @returns QR data segment
   * @throws {Error} Invalid character
   */
  static alphaNum(data: string): Types.QRDataSegment {
    const encodingModeValue = Helpers.Global.QRMode.MODE_ALPHA_NUM
    const inputText = data
    const getMode = function (): number {
      return encodingModeValue
    }
    const getLength = function (): number {
      return inputText.length
    }
    const getAlphanumericCodeForChar = function (singleChar: string): number {
      if ('0' <= singleChar && singleChar <= '9') {
        return singleChar.charCodeAt(0) - '0'.charCodeAt(0)
      }
      if ('A' <= singleChar && singleChar <= 'Z') {
        return singleChar.charCodeAt(0) - 'A'.charCodeAt(0) + 10
      }
      switch (singleChar) {
        case '\u0020':
          return 36
        case '$':
          return 37
        case '%':
          return 38
        case '*':
          return 39
        case '+':
          return 40
        case '-':
          return 41
        case '.':
          return 42
        case '/':
          return 43
        case ':':
          return 44
        default:
          throw new Error(`Encode.alphaNum: invalid character "${singleChar}"`)
      }
    }
    const write = function (bitBuffer: Types.QRBitBuffer): void {
      let charReadOffset = 0
      while (charReadOffset + 1 < inputText.length) {
        bitBuffer.put(
          getAlphanumericCodeForChar(inputText.charAt(charReadOffset)) * 45 +
            getAlphanumericCodeForChar(inputText.charAt(charReadOffset + 1)),
          11
        )
        charReadOffset += 2
      }
      if (charReadOffset < inputText.length) {
        bitBuffer.put(getAlphanumericCodeForChar(inputText.charAt(charReadOffset)), 6)
      }
    }
    return { getMode, getLength, write }
  }

  /**
   * Encode string as 8-bit bytes to segment.
   * @description Uses provided stringToBytes for encoding.
   * @param data - Input string
   * @param stringToBytes - Encoder (e.g. UTF-8)
   * @returns QR data segment
   * @throws {Error} Byte index out of range
   */
  static byte(data: string, stringToBytes: (input: string) => number[]): Types.QRDataSegment {
    const encodingModeValue = Helpers.Global.QRMode.MODE_8BIT_BYTE
    const encodedByteList = stringToBytes(data)
    const getMode = function (): number {
      return encodingModeValue
    }
    const getLength = function (): number {
      return encodedByteList.length
    }
    const write = function (bitBuffer: Types.QRBitBuffer): void {
      for (let byteIndex = 0; byteIndex < encodedByteList.length; byteIndex += 1) {
        const currentByteValue = encodedByteList[byteIndex]
        if (currentByteValue === undefined) {
          throw new Error('Encode.byte: byte index out of range')
        }
        bitBuffer.put(currentByteValue, 8)
      }
    }
    return { getMode, getLength, write }
  }

  /**
   * Build interleaved codewords from bit buffer.
   * @description RS-encode per block then interleave data and EC.
   * @param bitBuffer - Packed data bits
   * @param rsBlocks - RS block layout per version/level
   * @returns Interleaved codeword array
   * @throws {Error} RS block index out of range
   */
  static createBytes(bitBuffer: Types.QRBitBuffer, rsBlocks: Types.RSBlockLayout[]): number[] {
    let byteOffset = 0
    let maxDataCodewordCount = 0
    let maxErrorCodewordCount = 0
    const dataCodewordsByBlock = new Array(rsBlocks.length)
    const errorCodewordsByBlock = new Array(rsBlocks.length)
    for (let blockIndex = 0; blockIndex < rsBlocks.length; blockIndex += 1) {
      const rsBlock = rsBlocks[blockIndex]
      if (rsBlock === undefined) {
        throw new Error('Encode.createBytes: RS block index out of range')
      }
      const dataCodewordCount = rsBlock.dataCount
      const errorCodewordCount = rsBlock.totalCount - dataCodewordCount
      maxDataCodewordCount = Math.max(maxDataCodewordCount, dataCodewordCount)
      maxErrorCodewordCount = Math.max(maxErrorCodewordCount, errorCodewordCount)
      dataCodewordsByBlock[blockIndex] = new Array(dataCodewordCount)
      for (let i = 0; i < dataCodewordsByBlock[blockIndex].length; i += 1) {
        const bufferByte = bitBuffer.getBuffer()[i + byteOffset]
        dataCodewordsByBlock[blockIndex][i] = 0xff & (bufferByte ?? 0)
      }
      byteOffset += dataCodewordCount
      const errorCorrectPolynomial = Helpers.Util.getErrorCorrectPolynomial(errorCodewordCount)
      const dataPolynomial = Helpers.Math.Polynomial.create(
        dataCodewordsByBlock[blockIndex],
        errorCorrectPolynomial.getLength() - 1
      )
      const remainderPolynomial = dataPolynomial.mod(errorCorrectPolynomial)
      errorCodewordsByBlock[blockIndex] = new Array(errorCorrectPolynomial.getLength() - 1)
      for (let i = 0; i < errorCodewordsByBlock[blockIndex].length; i += 1) {
        const remainderIndex = i + remainderPolynomial.getLength() -
          errorCodewordsByBlock[blockIndex].length
        errorCodewordsByBlock[blockIndex][i] = remainderIndex >= 0
          ? remainderPolynomial.getAt(remainderIndex)
          : 0
      }
    }
    let totalCodewordCount = 0
    for (let i = 0; i < rsBlocks.length; i += 1) {
      const rsBlock = rsBlocks[i]
      if (rsBlock === undefined) {
        throw new Error('Encode.createBytes: RS block index out of range')
      }
      totalCodewordCount += rsBlock.totalCount
    }
    const interleavedCodewords = new Array(totalCodewordCount)
    let outputIndex = 0
    for (let i = 0; i < maxDataCodewordCount; i += 1) {
      for (let blockIndex = 0; blockIndex < rsBlocks.length; blockIndex += 1) {
        if (i < dataCodewordsByBlock[blockIndex].length) {
          interleavedCodewords[outputIndex] = dataCodewordsByBlock[blockIndex][i]
          outputIndex += 1
        }
      }
    }
    for (let i = 0; i < maxErrorCodewordCount; i += 1) {
      for (let blockIndex = 0; blockIndex < rsBlocks.length; blockIndex += 1) {
        if (i < errorCodewordsByBlock[blockIndex].length) {
          interleavedCodewords[outputIndex] = errorCodewordsByBlock[blockIndex][i]
          outputIndex += 1
        }
      }
    }
    return interleavedCodewords
  }

  /**
   * Create full encoded data from segments.
   * @description Packs segments, pads, then createBytes.
   * @param typeNumber - QR version 1..40
   * @param errorCorrectionLevel - Level index
   * @param dataList - Data segments in order
   * @returns Interleaved codewords
   * @throws {Error} Code length overflow or data/RS index out of range
   */
  static createData(
    typeNumber: number,
    errorCorrectionLevel: number,
    dataList: Types.QRDataSegment[]
  ): number[] {
    const rsBlocks = Helpers.Block.getRSBlocks(typeNumber, errorCorrectionLevel)
    const bitBuffer = Helpers.Buffer.create()
    for (let i = 0; i < dataList.length; i += 1) {
      const dataSegment = dataList[i]
      if (dataSegment === undefined) {
        throw new Error('Encode.createData: data list index out of range')
      }
      bitBuffer.put(dataSegment.getMode(), 4)
      bitBuffer.put(
        dataSegment.getLength(),
        Helpers.Util.getLengthInBits(dataSegment.getMode(), typeNumber)
      )
      dataSegment.write(bitBuffer)
    }
    let totalDataCount = 0
    for (let i = 0; i < rsBlocks.length; i += 1) {
      const rsBlock = rsBlocks[i]
      if (rsBlock === undefined) {
        throw new Error('Encode.createData: RS block index out of range')
      }
      totalDataCount += rsBlock.dataCount
    }
    if (bitBuffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error(
        `Encode.createData: code length overflow (${bitBuffer.getLengthInBits()} bits > ${
          totalDataCount * 8
        } available)`
      )
    }
    if (bitBuffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      bitBuffer.put(0, 4)
    }
    while (bitBuffer.getLengthInBits() % 8 !== 0) {
      bitBuffer.putBit(Encode.paddingBitValue)
    }
    while (true) {
      if (bitBuffer.getLengthInBits() >= totalDataCount * 8) {
        break
      }
      bitBuffer.put(Encode.paddingByteFirst, 8)
      if (bitBuffer.getLengthInBits() >= totalDataCount * 8) {
        break
      }
      bitBuffer.put(Encode.paddingByteSecond, 8)
    }
    return Encode.createBytes(bitBuffer, rsBlocks)
  }

  /**
   * Encode string by mode name.
   * @description Dispatches to alphaNum/byte/kanji/number.
   * @param data - Input string
   * @param mode - 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji'
   * @param stringToBytes - Byte encoder for Byte/Kanji
   * @returns QR data segment
   * @throws {Error} Invalid data mode
   */
  static encode(
    data: string,
    mode: string,
    stringToBytes: (input: string) => number[]
  ): Types.QRDataSegment {
    const strategy = encoderRegistry[mode]
    if (strategy === undefined) {
      throw new Error(`Encode.encode: Invalid data mode ${mode}`)
    }
    return strategy(data, stringToBytes)
  }

  /**
   * Encode Kanji (Shift-JIS) to segment.
   * @description Pairs of bytes to 13-bit codes per character.
   * @param data - Input string
   * @param stringToBytes - Encoder to bytes (e.g. Shift-JIS)
   * @returns QR data segment
   * @throws {Error} Invalid or incomplete Kanji data
   */
  static kanji(data: string, stringToBytes: (input: string) => number[]): Types.QRDataSegment {
    const encodingModeValue = Helpers.Global.QRMode.MODE_KANJI
    const encodedByteList = stringToBytes(data)
    const getMode = function (): number {
      return encodingModeValue
    }
    const getLength = function (): number {
      return ~~(encodedByteList.length / 2)
    }
    const write = function (bitBuffer: Types.QRBitBuffer): void {
      let byteReadOffset = 0
      while (byteReadOffset + 1 < encodedByteList.length) {
        const highByteValue = encodedByteList[byteReadOffset]
        const lowByteValue = encodedByteList[byteReadOffset + 1]
        if (highByteValue === undefined || lowByteValue === undefined) {
          throw new Error('Encode.kanji: data index out of range')
        }
        let decodedCodePoint = ((0xff & highByteValue) << 8) | (0xff & lowByteValue)
        if (0x8140 <= decodedCodePoint && decodedCodePoint <= 0x9ffc) {
          decodedCodePoint -= 0x8140
        } else if (0xe040 <= decodedCodePoint && decodedCodePoint <= 0xebbf) {
          decodedCodePoint -= 0xc140
        } else {
          throw new Error(
            `Encode.kanji: invalid code point at offset ${byteReadOffset + 1} (${decodedCodePoint})`
          )
        }
        decodedCodePoint = ((decodedCodePoint >>> 8) & 0xff) * 0xc0 + (decodedCodePoint & 0xff)
        bitBuffer.put(decodedCodePoint, 13)
        byteReadOffset += 2
      }
      if (byteReadOffset < encodedByteList.length) {
        throw new Error(`Encode.kanji: invalid or incomplete data at offset ${byteReadOffset + 1}`)
      }
    }
    return { getMode, getLength, write }
  }

  /**
   * Encode numeric string to segment.
   * @description Groups of 3 digits -> 10 bits, remainder 4 or 7 bits.
   * @param data - Digits-only string
   * @returns QR data segment
   * @throws {Error} Invalid character
   */
  static number(data: string): Types.QRDataSegment {
    const encodingModeValue = Helpers.Global.QRMode.MODE_NUMBER
    const inputText = data
    const getMode = function (): number {
      return encodingModeValue
    }
    const getLength = function (): number {
      return inputText.length
    }
    const parseDigitChar = function (singleChar: string): number {
      if ('0' <= singleChar && singleChar <= '9') {
        return singleChar.charCodeAt(0) - '0'.charCodeAt(0)
      }
      throw new Error(`Encode.number: invalid character "${singleChar}"`)
    }
    const parseDigitGroupToNumber = function (digitGroup: string): number {
      let decodedNumericValue = 0
      for (let i = 0; i < digitGroup.length; i += 1) {
        decodedNumericValue = decodedNumericValue * 10 + parseDigitChar(digitGroup.charAt(i))
      }
      return decodedNumericValue
    }
    const write = function (bitBuffer: Types.QRBitBuffer): void {
      let charReadOffset = 0
      while (charReadOffset + 2 < inputText.length) {
        bitBuffer.put(
          parseDigitGroupToNumber(inputText.substring(charReadOffset, charReadOffset + 3)),
          10
        )
        charReadOffset += 3
      }
      if (charReadOffset < inputText.length) {
        const remainingLength = inputText.length - charReadOffset
        if (remainingLength === 1) {
          bitBuffer.put(
            parseDigitGroupToNumber(inputText.substring(charReadOffset, charReadOffset + 1)),
            4
          )
        } else if (remainingLength === 2) {
          bitBuffer.put(
            parseDigitGroupToNumber(inputText.substring(charReadOffset, charReadOffset + 2)),
            7
          )
        }
      }
    }
    return { getMode, getLength, write }
  }
}

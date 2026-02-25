import type * as Types from '@app/core/Types.ts'

/**
 * Mutable byte array output stream.
 * @description Implements ByteArrayOutput for sequential writes.
 */
export class ByteStream implements Types.ByteArrayOutput {
  /** Accumulated bytes */
  private readonly byteArray: number[] = []

  /**
   * Create new byte stream.
   * @description Returns empty ByteStream instance.
   * @returns New ByteStream
   */
  static create(): ByteStream {
    return new ByteStream()
  }

  /**
   * Return written bytes.
   * @description Returns internal byte array (same reference).
   * @returns Byte array
   */
  toByteArray(): number[] {
    return this.byteArray
  }

  /**
   * String representation of byte array.
   * @description Returns bracket-wrapped comma-separated bytes.
   * @returns String e.g. "[1,2,3]"
   */
  toString(): string {
    let resultString = ''
    resultString += '['
    for (let i = 0; i < this.byteArray.length; i += 1) {
      if (i > 0) {
        resultString += ','
      }
      resultString += this.byteArray[i]
    }
    resultString += ']'
    return resultString
  }

  /**
   * Append one byte (low 8 bits).
   * @description Pushes value & 0xff to buffer.
   * @param byteValue - Byte value
   */
  writeByte(byteValue: number): void {
    this.byteArray.push(byteValue & 0xff)
  }

  /**
   * Append slice of source bytes.
   * @description Writes sourceBytes from offset for length.
   * @param sourceBytes - Source array
   * @param offset - Start index (default 0)
   * @param length - Count (default rest)
   * @throws {Error} Index out of range
   */
  writeBytes(sourceBytes: number[], offset?: number, length?: number): void {
    const start = offset ?? 0
    const len = length ?? sourceBytes.length
    for (let i = 0; i < len; i += 1) {
      const sourceByte = sourceBytes[i + start]
      if (sourceByte === undefined) {
        throw new Error('ByteStream.writeBytes: index out of range')
      }
      this.writeByte(sourceByte)
    }
  }

  /**
   * Append short as little-endian two bytes.
   * @description Writes low then high byte.
   * @param intValue - 16-bit value
   */
  writeShort(intValue: number): void {
    this.writeByte(intValue)
    this.writeByte(intValue >>> 8)
  }

  /**
   * Append string as char codes.
   * @description Writes each character code as byte.
   * @param stringValue - String to write
   */
  writeString(stringValue: string): void {
    for (let i = 0; i < stringValue.length; i += 1) {
      this.writeByte(stringValue.charCodeAt(i))
    }
  }
}

/**
 * Base64 encode stream.
 * @description Accumulates bytes and emits base64 string (6-bit per byte).
 */
export class EncodeStream implements Types.Base64EncodeOutput {
  /** Pending bits */
  private bitBuffer = 0
  /** Number of bits in buffer */
  private bitBufferLength = 0
  /** Total bytes written */
  private byteCount = 0
  /** Accumulated base64 output */
  private encodedString = ''

  /**
   * Create new Base64 encode stream.
   * @description Returns empty EncodeStream instance.
   * @returns New EncodeStream
   */
  static create(): EncodeStream {
    return new EncodeStream()
  }

  /**
   * Flush remaining bits and padding.
   * @description Writes last 6-bit group and '=' padding.
   */
  flush(): void {
    if (this.bitBufferLength > 0) {
      const sixBits = this.bitBufferLength >= 6
        ? this.bitBuffer >>> (this.bitBufferLength - 6)
        : (this.bitBuffer << (6 - this.bitBufferLength)) & 0x3f
      this.encodedString += String.fromCharCode(EncodeStream.encodeSixBits(sixBits))
      this.bitBuffer = 0
      this.bitBufferLength = 0
    }
    if (this.byteCount % 3 !== 0) {
      const paddingLength = 3 - (this.byteCount % 3)
      for (let i = 0; i < paddingLength; i += 1) {
        this.encodedString += '='
      }
    }
  }

  /**
   * Return accumulated base64 string.
   * @description Returns encoded string so far.
   * @returns Base64 string
   */
  toString(): string {
    return this.encodedString
  }

  /**
   * Append one byte to base64 stream.
   * @description Buffers 8 bits and emits 6-bit groups.
   * @param byteValue - Byte to encode
   */
  writeByte(byteValue: number): void {
    this.bitBuffer = (this.bitBuffer << 8) | (byteValue & 0xff)
    this.bitBufferLength += 8
    this.byteCount += 1
    while (this.bitBufferLength >= 6) {
      const shift = this.bitBufferLength - 6
      this.encodedString += String.fromCharCode(
        EncodeStream.encodeSixBits(this.bitBuffer >>> shift)
      )
      this.bitBuffer = this.bitBuffer & ((1 << shift) - 1)
      this.bitBufferLength -= 6
    }
  }

  /**
   * Map 0..63 to base64 char code.
   * @description A-Z, a-z, 0-9, +, /.
   * @param sixBitValue - Value 0..63
   * @returns Character code
   * @throws {Error} Out of range
   */
  private static encodeSixBits(sixBitValue: number): number {
    if (sixBitValue < 0) {
      throw new Error(`EncodeStream.encodeSixBits: six-bit value out of range (${sixBitValue})`)
    } else if (sixBitValue < 26) {
      return 0x41 + sixBitValue
    } else if (sixBitValue < 52) {
      return 0x61 + (sixBitValue - 26)
    } else if (sixBitValue < 62) {
      return 0x30 + (sixBitValue - 52)
    } else if (sixBitValue === 62) {
      return 0x2b
    } else if (sixBitValue === 63) {
      return 0x2f
    } else {
      throw new Error(
        `EncodeStream.encodeSixBits: six-bit value out of range (${sixBitValue}, max 63)`
      )
    }
  }
}

/**
 * Base64 decode stream.
 * @description Consumes base64 string and yields bytes.
 */
export class DecodeStream implements Types.Base64DecodeInput {
  /** Current character index */
  private readPosition = 0
  /** Pending bits */
  private bitBuffer = 0
  /** Bits in buffer */
  private bitBufferLength = 0
  /** Base64 input string */
  private readonly inputString: string

  /**
   * Create decode stream from base64 string.
   * @description Returns stream that reads from string.
   * @param inputString - Base64-encoded string
   * @returns New DecodeStream
   */
  static create(inputString: string): DecodeStream {
    return new DecodeStream(inputString)
  }

  /**
   * Decode stream from base64 string.
   * @description Stores input string for byte-by-byte read.
   * @param inputString - Base64-encoded string
   */
  constructor(inputString: string) {
    this.inputString = inputString
  }

  /**
   * Read next decoded byte.
   * @description Consumes 6-bit groups and returns 8-bit bytes.
   * @returns Next byte or -1 at end
   * @throws {Error} Unexpected end or invalid char
   */
  read(): number {
    while (this.bitBufferLength < 8) {
      if (this.readPosition >= this.inputString.length) {
        if (this.bitBufferLength === 0) {
          return -1
        }
        throw new Error(
          `DecodeStream.read: unexpected end of input (pending bits: ${this.bitBufferLength})`
        )
      }
      const currentChar = this.inputString.charAt(this.readPosition)
      this.readPosition += 1
      if (currentChar === '=') {
        this.bitBufferLength = 0
        return -1
      } else if (currentChar.match(/^\s$/)) {
        continue
      }
      this.bitBuffer = (this.bitBuffer << 6) |
        DecodeStream.decodeCharCode(currentChar.charCodeAt(0))
      this.bitBufferLength += 6
    }
    const outputByte = (this.bitBuffer >>> (this.bitBufferLength - 8)) & 0xff
    this.bitBufferLength -= 8
    return outputByte
  }

  /**
   * Map base64 char code to 0..63.
   * @description A-Z, a-z, 0-9, +, / to 6-bit value.
   * @param charCode - Character code
   * @returns 6-bit value
   * @throws {Error} Invalid character
   */
  private static decodeCharCode(charCode: number): number {
    if (0x41 <= charCode && charCode <= 0x5a) {
      return charCode - 0x41
    } else if (0x61 <= charCode && charCode <= 0x7a) {
      return charCode - 0x61 + 26
    } else if (0x30 <= charCode && charCode <= 0x39) {
      return charCode - 0x30 + 52
    } else if (charCode === 0x2b) {
      return 62
    } else if (charCode === 0x2f) {
      return 63
    } else {
      throw new Error(`DecodeStream.decodeCharCode: invalid character code (${charCode})`)
    }
  }
}

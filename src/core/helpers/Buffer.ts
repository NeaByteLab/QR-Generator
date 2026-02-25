import type * as Types from '@app/core/Types.ts'

/**
 * QR bit buffer for encoding.
 * @description Appends bits and exposes buffer and length.
 */
export class Buffer implements Types.QRBitBuffer {
  /** Bytes holding packed bits */
  private readonly bitByteBuffer: number[] = []
  /** Total bits written */
  private lengthInBits = 0

  /**
   * Create new bit buffer.
   * @description Returns empty QRBitBuffer instance.
   * @returns New Buffer (QRBitBuffer)
   */
  static create(): Types.QRBitBuffer {
    return new Buffer()
  }

  /**
   * Get bit at index.
   * @description Returns true if bit set, false otherwise.
   * @param index - Bit index (0-based)
   * @returns Bit value
   */
  getAt(index: number): boolean {
    const byteIndex = Math.floor(index / 8)
    const byteValue = this.bitByteBuffer[byteIndex]
    if (byteValue === undefined) {
      return false
    }
    return ((byteValue >>> (7 - (index % 8))) & 1) === 1
  }

  /**
   * Get underlying byte array.
   * @description Returns internal buffer (not copy).
   * @returns Byte array
   */
  getBuffer(): number[] {
    return this.bitByteBuffer
  }

  /**
   * Total number of bits written.
   * @description Returns lengthInBits.
   * @returns Bit count
   */
  getLengthInBits(): number {
    return this.lengthInBits
  }

  /**
   * Append value with given bit length.
   * @description Writes high bits first.
   * @param numericValue - Value to write
   * @param bitLength - Number of bits (1..32)
   */
  put(numericValue: number, bitLength: number): void {
    for (let i = 0; i < bitLength; i += 1) {
      this.putBit(((numericValue >>> (bitLength - i - 1)) & 1) === 1)
    }
  }

  /**
   * Append single bit.
   * @description Appends 0 or 1 to buffer.
   * @param bitValue - Bit to append
   */
  putBit(bitValue: boolean): void {
    const byteIndex = Math.floor(this.lengthInBits / 8)
    if (this.bitByteBuffer.length <= byteIndex) {
      this.bitByteBuffer.push(0)
    }
    if (bitValue) {
      const previousByteValue = this.bitByteBuffer[byteIndex] ?? 0
      this.bitByteBuffer[byteIndex] = previousByteValue | (0x80 >>> (this.lengthInBits % 8))
    }
    this.lengthInBits += 1
  }
}

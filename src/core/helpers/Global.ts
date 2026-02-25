/**
 * QR mode and error level constants.
 * @description Encoding mode bits and error level indices.
 */
export class Global {
  /** Encoding mode flags (Numeric, Alphanumeric, Byte, Kanji) */
  static readonly QRMode = {
    MODE_NUMBER: 1 << 0,
    MODE_ALPHA_NUM: 1 << 1,
    MODE_8BIT_BYTE: 1 << 2,
    MODE_KANJI: 1 << 3
  } as const

  /** Error level name to index (L, M, Q, H) */
  static readonly QRError: Record<string, number> = {
    L: 1,
    M: 0,
    Q: 3,
    H: 2
  }

  /** Mask pattern names to 0..7 */
  static readonly QRMask = {
    PATTERN000: 0,
    PATTERN001: 1,
    PATTERN010: 2,
    PATTERN011: 3,
    PATTERN100: 4,
    PATTERN101: 5,
    PATTERN110: 6,
    PATTERN111: 7
  } as const
}

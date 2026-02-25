import type * as Types from '@app/core/Types.ts'

/**
 * Galois field GF(256) and polynomials.
 * @description Exponent/log tables and Polynomial class.
 */
export class Math {
  /** GF(256) exponent table */
  private static readonly exponentTable = new Array(256)
  /** GF(256) logarithm table */
  private static readonly logarithmTable = new Array(256)

  static {
    for (let i = 0; i < 8; i += 1) {
      Math.exponentTable[i] = 1 << i
    }
    for (let i = 8; i < 256; i += 1) {
      const prevExp4 = Math.exponentTable[i - 4]
      const prevExp5 = Math.exponentTable[i - 5]
      const prevExp6 = Math.exponentTable[i - 6]
      const prevExp8 = Math.exponentTable[i - 8]
      Math.exponentTable[i] = (prevExp4 ?? 0) ^ (prevExp5 ?? 0) ^ (prevExp6 ?? 0) ^ (prevExp8 ?? 0)
    }
    for (let i = 0; i < 255; i += 1) {
      const tableValue = Math.exponentTable[i]
      if (tableValue !== undefined) {
        Math.logarithmTable[tableValue] = i
      }
    }
  }

  /**
   * GF(256) exponent: alpha^n.
   * @description Returns value from exponent table (wraps mod 255).
   * @param exponentValue - Exponent (wrapped to 0..255)
   * @returns Field element
   * @throws {Error} Result out of range
   */
  static galoisExp(exponentValue: number): number {
    while (exponentValue < 0) {
      exponentValue += 255
    }
    while (exponentValue >= 256) {
      exponentValue -= 255
    }
    const resultValue = Math.exponentTable[exponentValue]
    if (resultValue === undefined) {
      throw new Error(`Math.galoisExp: exponent result out of range (${exponentValue})`)
    }
    return resultValue
  }

  /**
   * GF(256) discrete log (inverse of exp).
   * @description Returns exponent such that alpha^n = fieldElement.
   * @param fieldElement - Non-zero field element
   * @returns Exponent 0..254
   * @throws {Error} Invalid field element
   */
  static galoisLog(fieldElement: number): number {
    if (fieldElement < 1) {
      throw new Error(`Math.galoisLog: invalid field element ${fieldElement}`)
    }
    const resultValue = Math.logarithmTable[fieldElement]
    if (resultValue === undefined) {
      throw new Error(`Math.galoisLog: invalid field element ${fieldElement}`)
    }
    return resultValue
  }

  /** Galois polynomial for RS encoding. */
  static Polynomial = class Polynomial implements Types.GaloisPolynomial {
    /** Coefficient array (high to low) */
    private readonly coefficientArray: number[]

    /**
     * Create polynomial from coefficients and shift.
     * @description Drops leading zeros and shifts right.
     * @param coefficients - Coefficients high to low
     * @param shiftAmount - Zeros to append
     * @returns New Polynomial
     */
    static create(coefficients: number[], shiftAmount: number): Polynomial {
      return new Polynomial(coefficients, shiftAmount)
    }

    /**
     * Polynomial from coefficients and shift.
     * @description Drops leading zeros and appends shift zeros.
     * @param coefficients - Coefficients high to low
     * @param shiftAmount - Zeros to append at end
     * @throws {Error} Invalid coefficients or shift
     */
    constructor(coefficients: number[], shiftAmount: number) {
      if (typeof coefficients.length === 'undefined') {
        throw new Error(
          `Math.Polynomial: invalid coefficients or shift (length=${coefficients.length}, shift=${shiftAmount})`
        )
      }
      let offset = 0
      while (offset < coefficients.length && coefficients[offset] === 0) {
        offset += 1
      }
      const dataLength = coefficients.length - offset
      if (dataLength === 0) {
        this.coefficientArray = [0]
        return
      }
      const result: number[] = new Array(dataLength + shiftAmount)
      for (let i = 0; i < dataLength; i += 1) {
        const coefficient = coefficients[i + offset]
        if (coefficient === undefined) {
          throw new Error('Math.Polynomial: coefficient index out of range')
        }
        result[i] = coefficient
      }
      for (let i = dataLength; i < dataLength + shiftAmount; i += 1) {
        result[i] = 0
      }
      this.coefficientArray = result
    }

    /**
     * Coefficient at index.
     * @description Returns coefficient at given index.
     * @param index - Index (0 = leading)
     * @returns Coefficient
     * @throws {Error} Index out of range
     */
    getAt(index: number): number {
      const coefficient = this.coefficientArray[index]
      if (coefficient === undefined) {
        throw new Error('Math.Polynomial.getAt: index out of range')
      }
      return coefficient
    }

    /**
     * Number of coefficients.
     * @description Returns coefficient array length.
     * @returns Length
     */
    getLength(): number {
      return this.coefficientArray.length
    }

    /**
     * Remainder after division by divisor.
     * @description Polynomial modulo in GF(256).
     * @param divisorPolynomial - Divisor polynomial
     * @returns Remainder polynomial
     */
    mod(divisorPolynomial: Types.GaloisPolynomial): Types.GaloisPolynomial {
      if (this.getLength() - divisorPolynomial.getLength() < 0) {
        return this
      }
      const leadingCoefficient = this.getAt(0)
      if (leadingCoefficient === 0) {
        return this
      }
      const ratio = Math.galoisLog(leadingCoefficient) - Math.galoisLog(divisorPolynomial.getAt(0))
      const remainderCoefficients = new Array(this.getLength())
      for (let i = 0; i < this.getLength(); i += 1) {
        remainderCoefficients[i] = this.getAt(i)
      }
      for (let i = 0; i < divisorPolynomial.getLength(); i += 1) {
        remainderCoefficients[i] ^= Math.galoisExp(
          Math.galoisLog(divisorPolynomial.getAt(i)) + ratio
        )
      }
      return Polynomial.create(remainderCoefficients, 0).mod(divisorPolynomial)
    }

    /**
     * Multiply by another polynomial in GF(256).
     * @description Convolution of coefficients.
     * @param divisorPolynomial - Other polynomial
     * @returns Product polynomial
     */
    multiply(divisorPolynomial: Types.GaloisPolynomial): Types.GaloisPolynomial {
      const productLength = this.getLength() + divisorPolynomial.getLength() - 1
      const productCoefficients = new Array<number>(productLength)
      for (let k = 0; k < productLength; k += 1) {
        productCoefficients[k] = 0
      }
      for (let i = 0; i < this.getLength(); i += 1) {
        for (let j = 0; j < divisorPolynomial.getLength(); j += 1) {
          const coefficientIndex = i + j
          const currentValue = productCoefficients[coefficientIndex]
          if (currentValue === undefined) {
            throw new Error('Math.Polynomial.multiply: product index out of range')
          }
          productCoefficients[coefficientIndex] = currentValue ^
            Math.galoisExp(
              Math.galoisLog(this.getAt(i)) + Math.galoisLog(divisorPolynomial.getAt(j))
            )
        }
      }
      return Polynomial.create(productCoefficients, 0)
    }
  }
}

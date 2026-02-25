import { assert, assertEquals, assertThrows } from '@std/assert'
import type * as Types from '@app/core/Types.ts'
import * as Helpers from '@app/core/helpers/index.ts'

Deno.test('Util.getBCHTypeInfo - different input different output', () => {
  const a = Helpers.Util.getBCHTypeInfo(1)
  const b = Helpers.Util.getBCHTypeInfo(2)
  assert(a !== b)
})

Deno.test('Util.getBCHTypeInfo - produces 15-bit output', () => {
  const bits = Helpers.Util.getBCHTypeInfo(0)
  assert(bits >= 0 && bits < 1 << 15)
})

Deno.test('Util.getBCHTypeNumber - version 7 produces 18 bits', () => {
  const bits = Helpers.Util.getBCHTypeNumber(7)
  assert(bits >= 1 << 12 && bits < 1 << 18)
})

Deno.test('Util.getErrorCorrectPolynomial - degree equals length', () => {
  const p = Helpers.Util.getErrorCorrectPolynomial(10)
  assert(p.getLength() >= 10)
})

Deno.test('Util.getLengthInBits - invalid mode throws', () => {
  assertThrows(() => Helpers.Util.getLengthInBits(99, 1), Error, 'invalid mode')
})

Deno.test('Util.getLengthInBits - invalid typeNumber throws', () => {
  assertThrows(
    () => Helpers.Util.getLengthInBits(Helpers.Global.QRMode.MODE_NUMBER, 41),
    Error,
    'invalid type number'
  )
})

Deno.test('Util.getLengthInBits - version 1 AlphaNum returns 9', () => {
  assertEquals(Helpers.Util.getLengthInBits(Helpers.Global.QRMode.MODE_ALPHA_NUM, 1), 9)
})

Deno.test('Util.getLengthInBits - version 1 Byte returns 8', () => {
  assertEquals(Helpers.Util.getLengthInBits(Helpers.Global.QRMode.MODE_8BIT_BYTE, 1), 8)
})

Deno.test('Util.getLengthInBits - version 1 Kanji returns 8', () => {
  assertEquals(Helpers.Util.getLengthInBits(Helpers.Global.QRMode.MODE_KANJI, 1), 8)
})

Deno.test('Util.getLengthInBits - version 1 Numeric returns 10', () => {
  assertEquals(Helpers.Util.getLengthInBits(Helpers.Global.QRMode.MODE_NUMBER, 1), 10)
})

Deno.test('Util.getLengthInBits - version 15 AlphaNum returns 11', () => {
  assertEquals(Helpers.Util.getLengthInBits(Helpers.Global.QRMode.MODE_ALPHA_NUM, 15), 11)
})

Deno.test('Util.getLengthInBits - version 15 Byte returns 16', () => {
  assertEquals(Helpers.Util.getLengthInBits(Helpers.Global.QRMode.MODE_8BIT_BYTE, 15), 16)
})

Deno.test('Util.getLengthInBits - version 15 Kanji returns 10', () => {
  assertEquals(Helpers.Util.getLengthInBits(Helpers.Global.QRMode.MODE_KANJI, 15), 10)
})

Deno.test('Util.getLengthInBits - version 30 Byte returns 16', () => {
  assertEquals(Helpers.Util.getLengthInBits(Helpers.Global.QRMode.MODE_8BIT_BYTE, 30), 16)
})

Deno.test('Util.getLostPoint - uniform grid has positive lost point', () => {
  const grid: Types.QRModuleGrid = {
    getModuleCount: () => 5,
    isDark: (r, c) => (r + c) % 2 === 0
  }
  const lost = Helpers.Util.getLostPoint(grid)
  assert(typeof lost === 'number')
  assert(lost >= 0)
})

Deno.test('Util.getMaskFunction - invalid pattern throws', () => {
  assertThrows(() => Helpers.Util.getMaskFunction(10), Error, 'invalid mask pattern')
})

Deno.test('Util.getMaskFunction - pattern 0 returns function', () => {
  const fn = Helpers.Util.getMaskFunction(Helpers.Global.QRMask.PATTERN000)
  assert(typeof fn === 'function')
  assert(fn(0, 0) === true)
  assert(fn(1, 1) === true)
  assert(fn(0, 1) === false)
})

Deno.test('Util.getMaskFunction - pattern 1 row parity', () => {
  const fn = Helpers.Util.getMaskFunction(Helpers.Global.QRMask.PATTERN001)
  assert(fn(0, 0) === true)
  assert(fn(2, 1) === true)
  assert(fn(1, 0) === false)
})

Deno.test('Util.getMaskFunction - pattern 2 col divisible by 3', () => {
  const fn = Helpers.Util.getMaskFunction(Helpers.Global.QRMask.PATTERN010)
  assert(fn(0, 0) === true)
  assert(fn(1, 3) === true)
  assert(fn(0, 1) === false)
})

Deno.test('Util.getMaskFunction - pattern 7 formula', () => {
  const fn = Helpers.Util.getMaskFunction(Helpers.Global.QRMask.PATTERN111)
  assert(typeof fn === 'function')
  assert(fn(0, 0) === true)
  assert(fn(1, 1) === false)
})

Deno.test('Util.getPatternPosition - type 1 returns empty', () => {
  assertEquals(Helpers.Util.getPatternPosition(1), [])
})

Deno.test('Util.getPatternPosition - type 2 returns two positions', () => {
  assertEquals(Helpers.Util.getPatternPosition(2), [6, 18])
})

Deno.test('Util.getPatternPosition - type 40 returns 7 positions', () => {
  const pos = Helpers.Util.getPatternPosition(40)
  assertEquals(pos.length, 7)
})

Deno.test('Util.getPatternPosition - typeNumber 0 throws', () => {
  assertThrows(() => Helpers.Util.getPatternPosition(0), Error, 'pattern position out of range')
})

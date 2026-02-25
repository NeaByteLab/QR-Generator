import { assert, assertEquals, assertThrows } from '@std/assert'
import * as Helpers from '@app/core/helpers/index.ts'

Deno.test('Byte.createStringToBytes - entry count mismatch throws', () => {
  assertThrows(() => Helpers.Byte.createStringToBytes('', 1), Error, 'entry count mismatch')
})

Deno.test('Byte.createStringToBytes - one entry base64 yields mapper', () => {
  const oneEntry = 'AAAAAA='
  const toBytes = Helpers.Byte.createStringToBytes(oneEntry, 1)
  assertEquals(toBytes('\u0000'), [0])
})

Deno.test('Byte.createStringToBytes - unmapped char above 127 maps to question mark', () => {
  const oneEntry = 'AAAAAA='
  const toBytes = Helpers.Byte.createStringToBytes(oneEntry, 1)
  assertEquals(toBytes('x'), [0x78])
  assertEquals(toBytes('\u0100'), [0x3f])
})

Deno.test('Byte.stringToBytes - ASCII single byte per character', () => {
  assertEquals(Helpers.Byte.stringToBytes('A'), [0x41])
  assertEquals(Helpers.Byte.stringToBytes('0'), [0x30])
  assertEquals(Helpers.Byte.stringToBytes('\x00'), [0])
  assertEquals(Helpers.Byte.stringToBytes('\x7f'), [0x7f])
})

Deno.test('Byte.stringToBytes - empty string returns empty array', () => {
  assertEquals(Helpers.Byte.stringToBytes(''), [])
})

Deno.test('Byte.stringToBytes - mixed ASCII and multi-byte', () => {
  const bytes = Helpers.Byte.stringToBytes('A\u00a2B')
  assert(bytes.length === 4)
  assertEquals(bytes[0], 0x41)
  assertEquals(bytes[1], 0xc2)
  assertEquals(bytes[2], 0xa2)
  assertEquals(bytes[3], 0x42)
})

Deno.test('Byte.stringToBytes - multiple ASCII concatenates', () => {
  assertEquals(Helpers.Byte.stringToBytes('Hi'), [0x48, 0x69])
  assertEquals(Helpers.Byte.stringToBytes('ABC'), [0x41, 0x42, 0x43])
})

Deno.test('Byte.stringToBytes - roundtrip ASCII identity', () => {
  const ascii = 'Hello World 0123456789'
  const bytes = Helpers.Byte.stringToBytes(ascii)
  assertEquals(bytes.length, ascii.length)
  for (let i = 0; i < ascii.length; i += 1) {
    assertEquals(bytes[i], ascii.charCodeAt(i))
  }
})

Deno.test('Byte.stringToBytes - UTF-8 four-byte sequence (emoji)', () => {
  const fourByte = '\u{1f600}'
  const bytes = Helpers.Byte.stringToBytes(fourByte)
  assert(bytes.length === 4)
  assertEquals(bytes[0], 0xf0)
  const b1 = bytes[1]
  const b2 = bytes[2]
  const b3 = bytes[3]
  assert(b1 !== undefined && b2 !== undefined && b3 !== undefined)
  assert(b1 >= 0x80 && b1 <= 0xbf)
  assert(b2 >= 0x80 && b2 <= 0xbf)
  assert(b3 >= 0x80 && b3 <= 0xbf)
})

Deno.test('Byte.stringToBytes - UTF-8 three-byte sequence', () => {
  const threeByte = '\u0800'
  const bytes = Helpers.Byte.stringToBytes(threeByte)
  assert(bytes.length === 3)
  assertEquals(bytes[0], 0xe0)
  const b1 = bytes[1]
  const b2 = bytes[2]
  assert(b1 !== undefined && b2 !== undefined)
  assertEquals(b1 & 0xc0, 0x80)
  assertEquals(b2 & 0xc0, 0x80)
})

Deno.test('Byte.stringToBytes - UTF-8 two-byte sequence', () => {
  const twoByte = '\u00a2'
  const bytes = Helpers.Byte.stringToBytes(twoByte)
  assert(bytes.length === 2)
  assertEquals(bytes[0], 0xc2)
  assertEquals(bytes[1], 0xa2)
})

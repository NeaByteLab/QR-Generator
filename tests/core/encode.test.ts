import { assert, assertEquals, assertThrows } from '@std/assert'
import * as Helpers from '@core/helpers/index.ts'

const stringToBytes = Helpers.Byte.stringToBytes
const bitOff = false

Deno.test('Encode.alphaNum - invalid char throws', () => {
  assertThrows(
    () => {
      const seg = Helpers.Encode.alphaNum('ab')
      const buf = Helpers.Buffer.create()
      seg.write(buf)
    },
    Error,
    'invalid character'
  )
})

Deno.test('Encode.alphaNum - mode and length', () => {
  const seg = Helpers.Encode.alphaNum('AB')
  assertEquals(seg.getMode(), Helpers.Global.QRMode.MODE_ALPHA_NUM)
  assertEquals(seg.getLength(), 2)
})

Deno.test('Encode.alphaNum - single char uses 6 bits', () => {
  const seg = Helpers.Encode.alphaNum('0')
  const buf = Helpers.Buffer.create()
  seg.write(buf)
  assertEquals(buf.getLengthInBits(), 6)
})

Deno.test('Encode.byte - mode and length', () => {
  const seg = Helpers.Encode.byte('Hi', stringToBytes)
  assertEquals(seg.getMode(), Helpers.Global.QRMode.MODE_8BIT_BYTE)
  assertEquals(seg.getLength(), 2)
})

Deno.test('Encode.byte - writes 8 bits per byte', () => {
  const seg = Helpers.Encode.byte('A', stringToBytes)
  const buf = Helpers.Buffer.create()
  seg.write(buf)
  assertEquals(buf.getLengthInBits(), 8)
  assertEquals(buf.getBuffer()[0], 0x41)
})

Deno.test('Encode.createBytes - interleaves blocks', () => {
  const rsBlocks = Helpers.Block.getRSBlocks(1, Helpers.Global.QRError['L'])
  const block0 = rsBlocks[0]
  assert(block0 !== undefined)
  const buf = Helpers.Buffer.create()
  buf.put(4, 4)
  buf.put(1, 8)
  buf.put(0x41, 8)
  while (buf.getLengthInBits() % 8 !== 0) {
    buf.putBit(bitOff)
  }
  while (buf.getLengthInBits() < block0.dataCount * 8) {
    buf.put(0xec, 8)
    if (buf.getLengthInBits() < block0.dataCount * 8) {
      buf.put(0x11, 8)
    }
  }
  const bytes = Helpers.Encode.createBytes(buf, rsBlocks)
  assertEquals(bytes.length, block0.totalCount)
})

Deno.test('Encode.createData - overflow throws', () => {
  const long = 'x'.repeat(100)
  const seg = Helpers.Encode.byte(long, stringToBytes)
  assertThrows(
    () => Helpers.Encode.createData(1, Helpers.Global.QRError['H'], [seg]),
    Error,
    'overflow'
  )
})

Deno.test('Encode.createData - single segment version 1 L', () => {
  const seg = Helpers.Encode.byte('A', stringToBytes)
  const data = Helpers.Encode.createData(1, Helpers.Global.QRError['L'], [seg])
  assert(Array.isArray(data) && data.length === 26)
})

Deno.test('Encode.encode - Byte mode default', () => {
  const seg = Helpers.Encode.encode('x', 'Byte', stringToBytes)
  assertEquals(seg.getMode(), Helpers.Global.QRMode.MODE_8BIT_BYTE)
})

Deno.test('Encode.encode - invalid mode throws', () => {
  assertThrows(
    () => Helpers.Encode.encode('x', 'Invalid', stringToBytes),
    Error,
    'Invalid data mode'
  )
})

Deno.test('Encode.encode - Kanji mode', () => {
  const shiftJisLike = (input: string): number[] => {
    if (input === 'x') {
      return [0x81, 0x40]
    }
    return []
  }
  const seg = Helpers.Encode.encode('x', 'Kanji', shiftJisLike)
  assertEquals(seg.getMode(), Helpers.Global.QRMode.MODE_KANJI)
  assertEquals(seg.getLength(), 1)
})

Deno.test('Encode.encode - Numeric mode', () => {
  const seg = Helpers.Encode.encode('012', 'Numeric', stringToBytes)
  assertEquals(seg.getMode(), Helpers.Global.QRMode.MODE_NUMBER)
  assertEquals(seg.getLength(), 3)
})

Deno.test('Encode.kanji - invalid code point throws', () => {
  const invalidRange = (): number[] => [0x00, 0x00]
  const seg = Helpers.Encode.kanji('x', invalidRange)
  const buf = Helpers.Buffer.create()
  assertThrows(() => seg.write(buf), Error, 'invalid code point')
})

Deno.test('Encode.kanji - incomplete data odd bytes throws', () => {
  const oddBytes = (): number[] => [0x81, 0x40, 0x82]
  const seg = Helpers.Encode.kanji('x', oddBytes)
  const buf = Helpers.Buffer.create()
  assertThrows(() => seg.write(buf), Error, 'invalid or incomplete')
})

Deno.test('Encode.kanji - mode and length', () => {
  const twoChars = (): number[] => [0x81, 0x40, 0x82, 0xa0]
  const seg = Helpers.Encode.kanji('xy', twoChars)
  assertEquals(seg.getMode(), Helpers.Global.QRMode.MODE_KANJI)
  assertEquals(seg.getLength(), 2)
})

Deno.test('Encode.kanji - writes 13 bits per character', () => {
  const oneChar = (): number[] => [0x81, 0x40]
  const seg = Helpers.Encode.kanji('x', oneChar)
  const buf = Helpers.Buffer.create()
  seg.write(buf)
  assertEquals(buf.getLengthInBits(), 13)
})

Deno.test('Encode.number - invalid char throws', () => {
  assertThrows(
    () => {
      const seg = Helpers.Encode.number('12a')
      const buf = Helpers.Buffer.create()
      seg.write(buf)
    },
    Error,
    'invalid character'
  )
})

Deno.test('Encode.number - mode and length', () => {
  const seg = Helpers.Encode.number('123')
  assertEquals(seg.getMode(), Helpers.Global.QRMode.MODE_NUMBER)
  assertEquals(seg.getLength(), 3)
})

Deno.test('Encode.number - writes 3 digits as 10 bits', () => {
  const seg = Helpers.Encode.number('256')
  const buf = Helpers.Buffer.create()
  seg.write(buf)
  assertEquals(buf.getLengthInBits(), 10)
  assert(buf.getAt(0) === false)
  assert(buf.getAt(1) === true)
})

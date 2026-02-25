import { assert, assertEquals } from '@std/assert'
import * as Helpers from '@core/helpers/index.ts'

const bitOn = true
const bitOff = false

Deno.test('Buffer.create - returns instance with zero length', () => {
  const buf = Helpers.Buffer.create()
  assertEquals(buf.getLengthInBits(), 0)
  assertEquals(buf.getBuffer(), [])
})

Deno.test('Buffer.getAt - index past last byte returns false', () => {
  const buf = Helpers.Buffer.create()
  buf.put(1, 2)
  assert(buf.getAt(0) === false)
  assert(buf.getAt(1) === true)
  assert(buf.getAt(8) === false)
  assert(buf.getAt(100) === false)
})

Deno.test('Buffer.put - value 0 writes all zero bits', () => {
  const buf = Helpers.Buffer.create()
  buf.put(0, 8)
  assertEquals(buf.getLengthInBits(), 8)
  assertEquals(buf.getBuffer(), [0])
  for (let i = 0; i < 8; i += 1) {
    assert(buf.getAt(i) === false)
  }
})

Deno.test('Buffer.put - value 255 in 8 bits writes all ones', () => {
  const buf = Helpers.Buffer.create()
  buf.put(255, 8)
  assertEquals(buf.getLengthInBits(), 8)
  assertEquals(buf.getBuffer(), [0xff])
  for (let i = 0; i < 8; i += 1) {
    assert(buf.getAt(i) === true)
  }
})

Deno.test('Buffer.put - writes multi-bit value MSB first', () => {
  const buf = Helpers.Buffer.create()
  buf.put(5, 3)
  assertEquals(buf.getLengthInBits(), 3)
  assert(buf.getAt(0) === true)
  assert(buf.getAt(1) === false)
  assert(buf.getAt(2) === true)
})

Deno.test('Buffer.put then getAt - roundtrip 4-bit mode and 10-bit length', () => {
  const buf = Helpers.Buffer.create()
  buf.put(1, 4)
  buf.put(42, 10)
  assertEquals(buf.getLengthInBits(), 14)
  const b = buf.getBuffer()
  const firstByte = b[0]
  const secondByte = b[1]
  assert(firstByte !== undefined && secondByte !== undefined)
  assert(((firstByte >>> 4) & 0x0f) === 1)
  assert((((firstByte & 0x0f) << 6) | (secondByte >>> 2)) === 42)
})

Deno.test('Buffer.putBit - eight bits fill one byte', () => {
  const buf = Helpers.Buffer.create()
  buf.putBit(bitOn)
  buf.putBit(bitOff)
  buf.putBit(bitOff)
  buf.putBit(bitOff)
  buf.putBit(bitOff)
  buf.putBit(bitOff)
  buf.putBit(bitOff)
  buf.putBit(bitOff)
  assertEquals(buf.getLengthInBits(), 8)
  assertEquals(buf.getBuffer(), [0x80])
  assert(buf.getAt(0) === true)
  assert(buf.getAt(1) === false)
  assert(buf.getAt(7) === false)
})

Deno.test('Buffer.putBit - ninth bit starts new byte', () => {
  const buf = Helpers.Buffer.create()
  for (let i = 0; i < 9; i += 1) {
    buf.putBit(i === 0)
  }
  assertEquals(buf.getLengthInBits(), 9)
  assertEquals(buf.getBuffer().length, 2)
  assert(buf.getAt(8) === false)
})

Deno.test('Buffer.putBit - single false sets zero bit', () => {
  const buf = Helpers.Buffer.create()
  buf.putBit(bitOff)
  assertEquals(buf.getLengthInBits(), 1)
  assert(buf.getAt(0) === false)
  assertEquals(buf.getBuffer(), [0])
})

Deno.test('Buffer.putBit - single true sets one bit', () => {
  const buf = Helpers.Buffer.create()
  buf.putBit(bitOn)
  assertEquals(buf.getLengthInBits(), 1)
  assert(buf.getAt(0) === true)
  assertEquals(buf.getBuffer(), [0x80])
})

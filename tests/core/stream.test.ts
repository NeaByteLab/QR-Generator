import { assert, assertEquals, assertThrows } from '@std/assert'
import * as Helpers from '@app/core/helpers/index.ts'

Deno.test('ByteStream.create - empty toByteArray', () => {
  const s = Helpers.ByteStream.create()
  assertEquals(s.toByteArray(), [])
})

Deno.test('ByteStream.toString - bracket comma format', () => {
  const s = Helpers.ByteStream.create()
  s.writeByte(1)
  s.writeByte(2)
  assertEquals(s.toString(), '[1,2]')
})

Deno.test('ByteStream.writeByte - appends masked to 0xff', () => {
  const s = Helpers.ByteStream.create()
  s.writeByte(0x41)
  s.writeByte(0x1ff)
  assertEquals(s.toByteArray(), [0x41, 0xff])
})

Deno.test('ByteStream.writeBytes - copies array', () => {
  const s = Helpers.ByteStream.create()
  s.writeBytes([1, 2, 3])
  assertEquals(s.toByteArray(), [1, 2, 3])
})

Deno.test('ByteStream.writeBytes - offset out of range throws', () => {
  const s = Helpers.ByteStream.create()
  assertThrows(() => s.writeBytes([1], 2, 1), Error, 'index out of range')
})

Deno.test('ByteStream.writeBytes - with offset and length', () => {
  const s = Helpers.ByteStream.create()
  s.writeBytes([10, 20, 30, 40], 1, 2)
  assertEquals(s.toByteArray(), [20, 30])
})

Deno.test('ByteStream.writeShort - little-endian two bytes', () => {
  const s = Helpers.ByteStream.create()
  s.writeShort(0x1234)
  assertEquals(s.toByteArray(), [0x34, 0x12])
})

Deno.test('ByteStream.writeString - writes char codes', () => {
  const s = Helpers.ByteStream.create()
  s.writeString('AB')
  assertEquals(s.toByteArray(), [0x41, 0x42])
})

Deno.test('DecodeStream - decode four chars to three bytes', () => {
  const s = Helpers.DecodeStream.create('TWFu')
  assertEquals(s.read(), 0x4d)
  assertEquals(s.read(), 0x61)
  assertEquals(s.read(), 0x6e)
  assertEquals(s.read(), -1)
})

Deno.test('DecodeStream - decode single byte base64', () => {
  const s = Helpers.DecodeStream.create('QQ==')
  assertEquals(s.read(), 0x41)
  assertEquals(s.read(), -1)
})

Deno.test('DecodeStream - invalid character throws', () => {
  assertThrows(
    () => {
      const s = Helpers.DecodeStream.create('Q!Q==')
      s.read()
      s.read()
    },
    Error,
    'invalid character'
  )
})

Deno.test('DecodeStream - whitespace skipped', () => {
  const s = Helpers.DecodeStream.create('Q Q = =')
  assertEquals(s.read(), 0x41)
  assertEquals(s.read(), -1)
})

Deno.test('DecodeStream.create - read on empty returns -1', () => {
  const s = Helpers.DecodeStream.create('')
  assertEquals(s.read(), -1)
})

Deno.test('EncodeStream - flush adds padding when byteCount not multiple of 3', () => {
  const s = Helpers.EncodeStream.create()
  s.writeByte(0)
  s.flush()
  assert(s.toString().endsWith('=='))
})

Deno.test('EncodeStream - three bytes produce four chars no padding', () => {
  const s = Helpers.EncodeStream.create()
  s.writeByte(0x4d)
  s.writeByte(0x61)
  s.writeByte(0x6e)
  s.flush()
  assertEquals(s.toString(), 'TWFu')
})

Deno.test('EncodeStream.create - empty toString', () => {
  const s = Helpers.EncodeStream.create()
  assertEquals(s.toString(), '')
})

Deno.test('EncodeStream.writeByte - single byte base64', () => {
  const s = Helpers.EncodeStream.create()
  s.writeByte(0x41)
  s.flush()
  assertEquals(s.toString(), 'QQ==')
})

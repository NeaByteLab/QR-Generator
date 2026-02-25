import { assert, assertEquals, assertRejects } from '@std/assert'
import * as Helpers from '@app/core/helpers/index.ts'

const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function bytesWithSignatureThen(...rest: number[]): Uint8Array {
  const out = new Uint8Array(pngSignature.length + rest.length)
  out.set(pngSignature)
  out.set(rest, pngSignature.length)
  return out
}

Deno.test('Decode.png - buffer shorter than signature throws', async () => {
  const short = new Uint8Array(4)
  await assertRejects(() => Helpers.Decode.png(short), Error, 'Decode.png: invalid PNG signature')
})

Deno.test('Decode.png - color type 3 without PLTE throws', async () => {
  const ihdrData = [0, 0, 0, 1, 0, 0, 0, 1, 8, 3, 0, 0, 0]
  const len = ihdrData.length
  const chunk = [
    (len >> 24) & 0xff,
    (len >> 16) & 0xff,
    (len >> 8) & 0xff,
    len & 0xff,
    0x49,
    0x48,
    0x44,
    0x52,
    ...ihdrData,
    0,
    0,
    0,
    0
  ]
  const buf = bytesWithSignatureThen(...chunk)
  await assertRejects(
    () => Helpers.Decode.png(buf),
    Error,
    'Decode.png: color type 3 requires PLTE chunk'
  )
})

Deno.test('Decode.png - interlaced PNG throws', async () => {
  const ihdrData = [0, 0, 0, 1, 0, 0, 0, 1, 8, 0, 0, 0, 1]
  const len = ihdrData.length
  const chunk = [
    (len >> 24) & 0xff,
    (len >> 16) & 0xff,
    (len >> 8) & 0xff,
    len & 0xff,
    0x49,
    0x48,
    0x44,
    0x52,
    ...ihdrData,
    0,
    0,
    0,
    0
  ]
  const buf = bytesWithSignatureThen(...chunk)
  await assertRejects(
    () => Helpers.Decode.png(buf),
    Error,
    'Decode.png: interlaced PNG not supported'
  )
})

Deno.test('Decode.png - invalid bit depth throws', async () => {
  const ihdrData = [0, 0, 0, 1, 0, 0, 0, 1, 4, 0, 0, 0, 0]
  const len = ihdrData.length
  const chunk = [
    (len >> 24) & 0xff,
    (len >> 16) & 0xff,
    (len >> 8) & 0xff,
    len & 0xff,
    0x49,
    0x48,
    0x44,
    0x52,
    ...ihdrData,
    0,
    0,
    0,
    0
  ]
  const buf = bytesWithSignatureThen(...chunk)
  await assertRejects(
    () => Helpers.Decode.png(buf),
    Error,
    'Decode.png: only 8-bit grayscale, RGB, indexed, grayscale+alpha, or RGBA supported'
  )
})

Deno.test('Decode.png - invalid color type throws', async () => {
  const ihdrData = [0, 0, 0, 1, 0, 0, 0, 1, 8, 1, 0, 0, 0]
  const len = ihdrData.length
  const chunk = [
    (len >> 24) & 0xff,
    (len >> 16) & 0xff,
    (len >> 8) & 0xff,
    len & 0xff,
    0x49,
    0x48,
    0x44,
    0x52,
    ...ihdrData,
    0,
    0,
    0,
    0
  ]
  const buf = bytesWithSignatureThen(...chunk)
  await assertRejects(
    () => Helpers.Decode.png(buf),
    Error,
    'Decode.png: only 8-bit grayscale, RGB, indexed, grayscale+alpha, or RGBA supported'
  )
})

Deno.test('Decode.png - invalid PNG signature throws', async () => {
  const bad = new Uint8Array([0x00, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  await assertRejects(() => Helpers.Decode.png(bad), Error, 'Decode.png: invalid PNG signature')
})

Deno.test('Decode.png - missing IDAT throws', async () => {
  const withSigOnly = bytesWithSignatureThen(0, 0, 0, 0)
  await assertRejects(
    () => Helpers.Decode.png(withSigOnly),
    Error,
    'Decode.png: missing or invalid IHDR'
  )
})

Deno.test('Decode.png - missing IDAT throws', async () => {
  const minimalIhdr = [0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 1, 0, 0, 0, 1, 8, 0, 0, 0, 0]
  const crc = [0, 0, 0, 0]
  const afterIhdr = [...minimalIhdr, ...crc]
  const buf = bytesWithSignatureThen(...afterIhdr)
  await assertRejects(() => Helpers.Decode.png(buf), Error, 'Decode.png: missing IDAT')
})

Deno.test('Decode.png - no IHDR chunk throws', async () => {
  const withSigOnly = bytesWithSignatureThen(0, 0, 0, 0)
  await assertRejects(
    () => Helpers.Decode.png(withSigOnly),
    Error,
    'Decode.png: missing or invalid IHDR'
  )
})

Deno.test('Decode.png - valid 1x1 PNG fixture returns data width height', async () => {
  const url = new URL('fixtures/1x1.png', import.meta.url)
  const pngBytes = await Deno.readFile(url)
  const result = await Helpers.Decode.png(pngBytes)
  assertEquals(result.width, 1)
  assertEquals(result.height, 1)
  assert(result.data instanceof Uint8Array)
  assertEquals(result.data.length, 4)
})

import { assert } from '@std/assert'
import type * as Types from '@core/Types.ts'
import * as Helpers from '@core/helpers/index.ts'

function makeGrid(size: number, isDark: (r: number, c: number) => boolean): Types.QRModuleGrid {
  return {
    getModuleCount: () => size,
    isDark
  }
}

const pngSignatureBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

Deno.test('PNG.createDataURL - returns data URI', async () => {
  const qr = makeGrid(3, () => false)
  const url = await Helpers.PNG.createDataURL(qr)
  assert(url.startsWith('data:image/png;base64,'))
  assert(url.length > 24)
})

Deno.test('PNG.createDataURL - base64 decodable and PNG signature', async () => {
  const qr = makeGrid(4, (x, y) => (x + y) % 2 === 0)
  const url = await Helpers.PNG.createDataURL(qr)
  const b64 = url.replace('data:image/png;base64,', '')
  const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  assert(binary.length >= pngSignatureBytes.length)
  for (let i = 0; i < pngSignatureBytes.length; i += 1) {
    assert(
      binary[i] === pngSignatureBytes[i],
      `byte ${i} expected ${pngSignatureBytes[i]} got ${binary[i]}`
    )
  }
})

Deno.test('PNG.createDataURL - dimensions affect output size', async () => {
  const small = await Helpers.PNG.createDataURL(
    makeGrid(2, () => false),
    2
  )
  const large = await Helpers.PNG.createDataURL(
    makeGrid(10, () => false),
    2
  )
  assert(large.length > small.length)
})

Deno.test('PNG.createDataURL - cellSize and margin affect output size', async () => {
  const qr = makeGrid(3, () => false)
  const defaultOpts = await Helpers.PNG.createDataURL(qr)
  const larger = await Helpers.PNG.createDataURL(qr, 4, 8)
  assert(larger.length > defaultOpts.length)
})

Deno.test('PNG.createDataURL - grayscale vs RGB produce valid URLs', async () => {
  const qr = makeGrid(3, (r, c) => r === c)
  const grayscale = await Helpers.PNG.createDataURL(qr, 2)
  const rgb = await Helpers.PNG.createDataURL(qr, 2, 8, '#000', '#fff')
  assert(grayscale.startsWith('data:image/png;base64,'))
  assert(rgb.startsWith('data:image/png;base64,'))
  const b64G = grayscale.replace('data:image/png;base64,', '')
  const b64R = rgb.replace('data:image/png;base64,', '')
  const binG = Uint8Array.from(atob(b64G), (c) => c.charCodeAt(0))
  const binR = Uint8Array.from(atob(b64R), (c) => c.charCodeAt(0))
  for (let i = 0; i < pngSignatureBytes.length; i += 1) {
    assert(binG[i] === pngSignatureBytes[i])
    assert(binR[i] === pngSignatureBytes[i])
  }
})

Deno.test('PNG.createDataURL - different grid patterns produce different output', async () => {
  const allLight = await Helpers.PNG.createDataURL(makeGrid(2, () => false))
  const allDark = await Helpers.PNG.createDataURL(makeGrid(2, () => true))
  assert(allLight !== allDark)
})

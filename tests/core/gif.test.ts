import { assert } from '@std/assert'
import * as Helpers from '@core/helpers/index.ts'

Deno.test('Gif.createDataURL - base64 decodable', () => {
  const url = Helpers.Gif.createDataURL(4, 4, (x, y) => (x + y) % 2)
  const b64 = url.replace('data:image/gif;base64,', '')
  const binary = atob(b64)
  assert(binary.startsWith('GIF87a'))
})

Deno.test('Gif.createDataURL - dimensions affect size', () => {
  const small = Helpers.Gif.createDataURL(2, 2, () => 1)
  const large = Helpers.Gif.createDataURL(10, 10, () => 1)
  assert(large.length > small.length)
})

Deno.test('Gif.createDataURL - getPixel 0 and 1', () => {
  const url = Helpers.Gif.createDataURL(1, 1, () => 0)
  assert(url.startsWith('data:image/gif;base64,'))
  const url1 = Helpers.Gif.createDataURL(1, 1, () => 1)
  assert(url1 !== url)
})

Deno.test('Gif.createDataURL - returns data URI', () => {
  const url = Helpers.Gif.createDataURL(2, 2, () => 0)
  assert(url.startsWith('data:image/gif;base64,'))
  assert(url.length > 24)
})

import { assert, assertEquals } from '@std/assert'
import * as Helpers from '@app/core/helpers/index.ts'

Deno.test('Global.QRError - L M Q H levels', () => {
  assertEquals(Helpers.Global.QRError['L'], 1)
  assertEquals(Helpers.Global.QRError['M'], 0)
  assertEquals(Helpers.Global.QRError['Q'], 3)
  assertEquals(Helpers.Global.QRError['H'], 2)
})

Deno.test('Global.QRMask - patterns 0..7', () => {
  assertEquals(Helpers.Global.QRMask.PATTERN000, 0)
  assertEquals(Helpers.Global.QRMask.PATTERN001, 1)
  assertEquals(Helpers.Global.QRMask.PATTERN010, 2)
  assertEquals(Helpers.Global.QRMask.PATTERN011, 3)
  assertEquals(Helpers.Global.QRMask.PATTERN100, 4)
  assertEquals(Helpers.Global.QRMask.PATTERN101, 5)
  assertEquals(Helpers.Global.QRMask.PATTERN110, 6)
  assertEquals(Helpers.Global.QRMask.PATTERN111, 7)
})

Deno.test('Global.QRMode - mode bits match JIS', () => {
  assertEquals(Helpers.Global.QRMode.MODE_NUMBER, 1)
  assertEquals(Helpers.Global.QRMode.MODE_ALPHA_NUM, 2)
  assertEquals(Helpers.Global.QRMode.MODE_8BIT_BYTE, 4)
  assertEquals(Helpers.Global.QRMode.MODE_KANJI, 8)
})

Deno.test('Global.Default - null and trial/final run flags', () => {
  assertEquals(Helpers.Global.Default.encodedDataCache, null)
  assert(Helpers.Global.Default.trialRun)
  assert(!Helpers.Global.Default.finalRun)
})

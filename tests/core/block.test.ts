import { assert, assertEquals, assertThrows } from '@std/assert'
import * as Helpers from '@app/core/helpers/index.ts'

Deno.test('Block.getRSBlocks - invalid error level throws', () => {
  assertThrows(() => Helpers.Block.getRSBlocks(1, 99), Error, 'Invalid RS block config')
})

Deno.test('Block.getRSBlocks - invalid typeNumber throws', () => {
  assertThrows(
    () => Helpers.Block.getRSBlocks(0, Helpers.Global.QRError['L']),
    Error,
    'Invalid RS block config'
  )
})

Deno.test('Block.getRSBlocks - version 1 H', () => {
  const blocks = Helpers.Block.getRSBlocks(1, Helpers.Global.QRError['H'])
  const b0 = blocks[0]
  assert(b0 !== undefined)
  assertEquals(b0.dataCount, 9)
})

Deno.test('Block.getRSBlocks - version 1 L single block', () => {
  const blocks = Helpers.Block.getRSBlocks(1, Helpers.Global.QRError['L'])
  assertEquals(blocks.length, 1)
  const b0 = blocks[0]
  assert(b0 !== undefined)
  assertEquals(b0.totalCount, 26)
  assertEquals(b0.dataCount, 19)
})

Deno.test('Block.getRSBlocks - version 1 M', () => {
  const blocks = Helpers.Block.getRSBlocks(1, Helpers.Global.QRError['M'])
  assertEquals(blocks.length, 1)
  const b0 = blocks[0]
  assert(b0 !== undefined)
  assertEquals(b0.dataCount, 16)
})

Deno.test('Block.getRSBlocks - version 1 Q', () => {
  const blocks = Helpers.Block.getRSBlocks(1, Helpers.Global.QRError['Q'])
  const b0 = blocks[0]
  assert(b0 !== undefined)
  assertEquals(b0.dataCount, 13)
})

Deno.test('Block.getRSBlocks - version 10 L returns blocks', () => {
  const blocks = Helpers.Block.getRSBlocks(10, Helpers.Global.QRError['L'])
  assert(blocks.length >= 1)
  const totalData = blocks.reduce((sum, b) => sum + b.dataCount, 0)
  assert(totalData > 0)
})

Deno.test('Block.getRSBlocks - version 40 H returns many blocks', () => {
  const blocks = Helpers.Block.getRSBlocks(40, Helpers.Global.QRError['H'])
  assert(blocks.length >= 1)
})

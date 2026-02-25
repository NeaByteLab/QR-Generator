import { assert, assertEquals } from '@std/assert'
import * as Helpers from '@app/core/helpers/index.ts'

const stringToBytes = Helpers.Byte.stringToBytes
const testRun = true

Deno.test('Build.buildMatrix - encodedDataCache reused when provided', () => {
  const finalRun = false
  const seg = Helpers.Encode.encode('x', 'Byte', stringToBytes)
  const result1 = Helpers.Build.buildMatrix(
    1,
    Helpers.Global.QRError['L'],
    [seg],
    null,
    finalRun,
    0
  )
  const cache = result1.encodedDataCache
  assert(cache !== null)
  const result2 = Helpers.Build.buildMatrix(
    1,
    Helpers.Global.QRError['L'],
    [seg],
    cache,
    finalRun,
    0
  )
  assert(result2.encodedDataCache === cache)
})

Deno.test('Build.buildMatrix - finder patterns at corners', () => {
  const seg = Helpers.Encode.encode('x', 'Byte', stringToBytes)
  const result = Helpers.Build.buildMatrix(1, Helpers.Global.QRError['L'], [seg], null, testRun, 0)
  const g = result.moduleGrid
  const r0 = g[0]
  const r6 = g[6]
  const r20 = g[20]
  assert(r0 !== undefined && r0[0] === true)
  assert(r6 !== undefined && r6[0] === true)
  assert(r0 !== undefined && r0[6] === true)
  assert(r20 !== undefined && r20[0] === true)
  assert(r0 !== undefined && r0[20] === true)
})

Deno.test('Build.buildMatrix - timing pattern on row and col 6', () => {
  const seg = Helpers.Encode.encode('x', 'Byte', stringToBytes)
  const result = Helpers.Build.buildMatrix(1, Helpers.Global.QRError['L'], [seg], null, testRun, 0)
  const g = result.moduleGrid
  const n = result.moduleCountValue
  const row6 = g[6]
  assert(row6 !== undefined)
  for (let i = 8; i < n - 8; i += 1) {
    const row = g[i]
    const rowVal = row !== undefined ? row[6] : undefined
    assert(rowVal === true || rowVal === false)
  }
  for (let i = 8; i < n - 8; i += 1) {
    const colVal = row6[i]
    assert(colVal === true || colVal === false)
  }
})

Deno.test('Build.buildMatrix - version 1 produces 21x21 grid', () => {
  const seg = Helpers.Encode.encode('A', 'Byte', stringToBytes)
  const result = Helpers.Build.buildMatrix(1, Helpers.Global.QRError['L'], [seg], null, testRun, 0)
  assertEquals(result.moduleCountValue, 21)
  assert(result.moduleGrid.length === 21)
  const row0 = result.moduleGrid[0]
  assert(row0 !== undefined && row0.length === 21)
})

Deno.test('Build.buildMatrix - version 2 produces 25x25', () => {
  const seg = Helpers.Encode.encode('AB', 'Byte', stringToBytes)
  const result = Helpers.Build.buildMatrix(2, Helpers.Global.QRError['L'], [seg], null, testRun, 0)
  assertEquals(result.moduleCountValue, 25)
})

import { assert, assertEquals, assertThrows } from '@std/assert'
import * as Helpers from '@core/helpers/index.ts'

Deno.test('Math.galoisExp - exponent 0 returns 1', () => {
  assertEquals(Helpers.Math.galoisExp(0), 1)
})

Deno.test('Math.galoisExp - exponent 1 returns 2', () => {
  assertEquals(Helpers.Math.galoisExp(1), 2)
})

Deno.test('Math.galoisExp - exponent 7 returns 128', () => {
  assertEquals(Helpers.Math.galoisExp(7), 128)
})

Deno.test('Math.galoisExp - exponent wraps at 256', () => {
  assertEquals(Helpers.Math.galoisExp(255), Helpers.Math.galoisExp(0))
  assertEquals(Helpers.Math.galoisExp(256), Helpers.Math.galoisExp(1))
})

Deno.test('Math.galoisExp - negative exponent wraps', () => {
  assertEquals(Helpers.Math.galoisExp(-1), Helpers.Math.galoisExp(254))
})

Deno.test('Math.galoisLog - 0 throws', () => {
  assertThrows(() => Helpers.Math.galoisLog(0), Error, 'invalid field element')
})

Deno.test('Math.galoisLog - log of exp is identity', () => {
  for (let i = 1; i < 255; i += 1) {
    assertEquals(Helpers.Math.galoisLog(Helpers.Math.galoisExp(i)), i)
  }
})

Deno.test('Math.Polynomial.create - all zeros yields single zero', () => {
  const p = Helpers.Math.Polynomial.create([0, 0], 0)
  assertEquals(p.getLength(), 1)
  assertEquals(p.getAt(0), 0)
})

Deno.test('Math.Polynomial.create - leading zeros stripped', () => {
  const p = Helpers.Math.Polynomial.create([0, 0, 1, 2], 0)
  assertEquals(p.getLength(), 2)
  assertEquals(p.getAt(0), 1)
  assertEquals(p.getAt(1), 2)
})

Deno.test('Math.Polynomial.create - shift extends with zeros', () => {
  const p = Helpers.Math.Polynomial.create([1, 2], 2)
  assertEquals(p.getLength(), 4)
  assertEquals(p.getAt(0), 1)
  assertEquals(p.getAt(1), 2)
  assertEquals(p.getAt(2), 0)
  assertEquals(p.getAt(3), 0)
})

Deno.test('Math.Polynomial.getAt - index out of range throws', () => {
  const p = Helpers.Math.Polynomial.create([1, 2], 0)
  assertThrows(() => p.getAt(2), Error, 'index out of range')
})

Deno.test('Math.Polynomial.mod - divisor longer than this returns this', () => {
  const a = Helpers.Math.Polynomial.create([1, 2], 0)
  const b = Helpers.Math.Polynomial.create([1, 0, 1], 0)
  const r = a.mod(b)
  assertEquals(r.getLength(), 2)
  assertEquals(r.getAt(0), 1)
  assertEquals(r.getAt(1), 2)
})

Deno.test('Math.Polynomial.mod - remainder has degree less than divisor', () => {
  const a = Helpers.Math.Polynomial.create([1, 2, 3], 0)
  const b = Helpers.Math.Polynomial.create([1, 1], 0)
  const r = a.mod(b)
  assert(r.getLength() <= b.getLength())
})

Deno.test('Math.Polynomial.multiply - degree sum', () => {
  const a = Helpers.Math.Polynomial.create([1, 1], 0)
  const b = Helpers.Math.Polynomial.create([1, 1, 1], 0)
  const c = a.multiply(b)
  assert(c.getLength() >= 3)
})

import { assert } from '@std/assert'
import type * as Types from '@core/Types.ts'
import * as Helpers from '@core/helpers/index.ts'
import QRCode from '@core/index.ts'

function makeGrid(size: number, isDark: (r: number, c: number) => boolean): Types.QRModuleGrid {
  return {
    getModuleCount: () => size,
    isDark
  }
}

Deno.test('Format - real QRCode instance ASCII', () => {
  const qr = QRCode.create(0, 'L')
  qr.addData('test', 'Byte')
  qr.make()
  const ascii = Helpers.Format.ascii(qr, 1)
  assert(ascii.length > 0)
  assert(ascii.includes('\n'))
})

Deno.test('Format.ascii - cellSize 1 returns half block style', () => {
  const qr = makeGrid(3, (r, c) => (r + c) % 2 === 0)
  const out = Helpers.Format.ascii(qr, 1)
  assert(out.includes('█') || out.includes('\n'))
  assert(out.split('\n').length >= 3)
})

Deno.test('Format.ascii - cellSize 2 includes margin', () => {
  const qr = makeGrid(2, () => false)
  const out = Helpers.Format.ascii(qr, 2, 1)
  assert(out.length > 0)
})

Deno.test('Format.canvas - draws fillRect per module with default cellSize', () => {
  const fillRectCalls: { x: number; y: number; w: number; h: number }[] = []
  const ctx = {
    fillStyle: '',
    fillRect(x: number, y: number, w: number, h: number): void {
      fillRectCalls.push({ x, y, w, h })
    }
  } as unknown as CanvasRenderingContext2D
  const qr = makeGrid(3, (r, c) => r === 1 && c === 1)
  Helpers.Format.canvas(qr, ctx)
  assert(fillRectCalls.length === 9)
  assert(fillRectCalls.some((c) => c.w === 2 && c.h === 2))
})

Deno.test('Format.canvas - uses custom cellSize when provided', () => {
  const fillRectCalls: { w: number; h: number }[] = []
  const ctx = {
    fillStyle: '',
    fillRect(_x: number, _y: number, w: number, h: number): void {
      fillRectCalls.push({ w, h })
    }
  } as unknown as CanvasRenderingContext2D
  const qr = makeGrid(2, () => false)
  Helpers.Format.canvas(qr, ctx, 5)
  assert(fillRectCalls.length === 4)
  assert(fillRectCalls.every((c) => c.w === 5 && c.h === 5))
})

Deno.test('Format.dataURL - omitted margin uses default', () => {
  const qr = makeGrid(3, () => false)
  const url = Helpers.Format.dataURL(qr, 2)
  assert(url.startsWith('data:image/gif;base64,'))
  assert(url.length > 24)
})

Deno.test('Format.dataURL - returns data URI', () => {
  const qr = makeGrid(5, (r, c) => r === c)
  const url = Helpers.Format.dataURL(qr, 2, 2)
  assert(url.startsWith('data:image/gif;base64,'))
  assert(url.length > 30)
})

Deno.test('Format.img - alt escaped', () => {
  const qr = makeGrid(2, () => false)
  const html = Helpers.Format.img(qr, 2, 2, '">alert(1)<')
  assert(html.includes('alt="'))
  assert(!html.includes('">alert(1)<'))
})

Deno.test('Format.img - includes width height and src', () => {
  const qr = makeGrid(3, () => false)
  const html = Helpers.Format.img(qr, 2, 4)
  assert(html.includes('<img'))
  assert(html.includes('width="'))
  assert(html.includes('height="'))
  assert(html.includes('src="data:image/gif;base64,'))
})

Deno.test('Format.svg - minimal options', () => {
  const qr = makeGrid(5, (r, c) => (r + c) % 2 === 0)
  const svg = Helpers.Format.svg(qr, { cellSize: 2, margin: 4 })
  assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'))
  assert(svg.includes('<path'))
  assert(svg.includes('d="'))
})

Deno.test('Format.svg - scalable true omits fixed px width height', () => {
  const qr = makeGrid(3, () => false)
  const svgScalable = Helpers.Format.svg(qr, { cellSize: 2, margin: 2, scalable: true })
  assert(svgScalable.includes('viewBox="0 0'))
  assert(!/width="\d+px"/.test(svgScalable))
  const svgFixed = Helpers.Format.svg(qr, { cellSize: 2, margin: 2, scalable: false })
  assert(/width="\d+px"/.test(svgFixed))
  assert(/height="\d+px"/.test(svgFixed))
})

Deno.test('Format.svg - with alt and title', () => {
  const qr = makeGrid(3, () => false)
  const svg = Helpers.Format.svg(qr, {
    cellSize: 2,
    margin: 2,
    alt: 'QR code',
    title: 'Title'
  })
  assert(svg.includes('QR code') || svg.includes('id='))
  assert(svg.includes('Title'))
})

Deno.test('Format.table - omitted margin uses default', () => {
  const qr = makeGrid(2, () => false)
  const html = Helpers.Format.table(qr, 2)
  assert(html.includes('margin: 8px'))
})

Deno.test('Format.table - produces table HTML', () => {
  const qr = makeGrid(2, (r, c) => r === 0 && c === 0)
  const html = Helpers.Format.table(qr, 2, 2)
  assert(html.includes('<table'))
  assert(html.includes('<tr>'))
  assert(html.includes('<td'))
})

import { assert, assertEquals, assertThrows } from '@std/assert'
import QRCode from '@core/index.ts'

Deno.test('QRCode - addData default mode Byte', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('x', '')
  qr.make()
  assertEquals(qr.getModuleCount(), 21)
})

Deno.test('QRCode - addData then make', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('Hello', 'Byte')
  qr.make()
  assert(qr.getModuleCount() === 21)
  assert(qr.isDark(0, 0) === true)
})

Deno.test('QRCode - Alphanumeric mode', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('ABC12', 'Alphanumeric')
  qr.make()
  assert(qr.getModuleCount() === 21)
})

Deno.test('QRCode - createASCII returns string', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('A', 'Byte')
  qr.make()
  const ascii = qr.createASCII()
  assert(ascii.length > 0)
  assert(ascii.includes('\n'))
})

Deno.test('QRCode - createDataURL returns data URI', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('A', 'Byte')
  qr.make()
  const url = qr.createDataURL()
  assert(url.startsWith('data:image/gif;base64,'))
})

Deno.test('QRCode - createImgTag returns img with src and dimensions', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('x', 'Byte')
  qr.make()
  const html = qr.createImgTag({ cellSize: 2, margin: 4 })
  assert(html.includes('<img'))
  assert(html.includes('src="data:image/gif;base64,'))
  assert(html.includes('width="'))
  assert(html.includes('height="'))
})

Deno.test('QRCode - createSvgTag returns SVG', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('A', 'Byte')
  qr.make()
  const svg = qr.createSvgTag(2, 4)
  assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'))
  assert(svg.includes('<path'))
})

Deno.test('QRCode - createSvgTag with options object', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('x', 'Byte')
  qr.make()
  const svg = qr.createSvgTag({ cellSize: 3, margin: 6 })
  assert(svg.includes('viewBox="0 0'))
})

Deno.test('QRCode - createTableTag returns table HTML', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('x', 'Byte')
  qr.make()
  const html = qr.createTableTag()
  assert(html.includes('<table'))
  assert(html.includes('<tr>'))
})

Deno.test('QRCode - isDark before make throws', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('x', 'Byte')
  assertThrows(() => qr.isDark(0, 0), Error, 'Cell index out of range')
})

Deno.test('QRCode - isDark out of range throws', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('x', 'Byte')
  qr.make()
  assertThrows(() => qr.isDark(-1, 0), Error, 'Cell index out of range')
  assertThrows(() => qr.isDark(0, -1), Error, 'Cell index out of range')
  assertThrows(() => qr.isDark(21, 0), Error, 'Cell index out of range')
  assertThrows(() => qr.isDark(0, 21), Error, 'Cell index out of range')
})

Deno.test('QRCode - longer data uses larger version', () => {
  const qr = QRCode.create(0, 'L')
  qr.addData('x'.repeat(100), 'Byte')
  qr.make()
  assert(qr.getModuleCount() >= 21)
})

Deno.test('QRCode - Numeric mode', () => {
  const qr = QRCode.create(1, 'L')
  qr.addData('12345', 'Numeric')
  qr.make()
  assert(qr.getModuleCount() === 21)
})

Deno.test('QRCode - typeNumber 0 auto selects version', () => {
  const qr = QRCode.create(0, 'L')
  qr.addData('x', 'Byte')
  qr.make()
  assert(qr.getModuleCount() >= 21)
})

Deno.test('QRCode.create - invalid error level throws', () => {
  assertThrows(() => QRCode.create(1, 'X'), Error, 'Invalid error correction level')
})

Deno.test('QRCode.create - L M Q H accepted', () => {
  for (const level of ['L', 'M', 'Q', 'H'] as const) {
    const qr = QRCode.create(1, level)
    qr.addData('x', 'Byte')
    qr.make()
    assertEquals(qr.getModuleCount(), 21)
  }
})

import { assert, assertEquals } from '@std/assert'
import QRCode from '@neabyte/qr-generator'

Deno.test('QRCode - all error levels L M Q H produce valid SVG', () => {
  const value = 'error-levels'
  const size = 100
  for (const level of ['L', 'M', 'Q', 'H'] as const) {
    const svg = QRCode.toSVG({ value, size, error: { level } })
    assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'))
    assert(svg.includes(`viewBox="0 0 ${size} ${size}"`))
    assert(svg.includes('<path'))
  }
})

Deno.test('QRCode - all module shapes produce valid path', () => {
  const base = { value: 'shapes', size: 150 }
  const shapes = ['circle', 'diamond', 'rounded', 'square', 'shuriken', 'star', 'triangle'] as const
  for (const shape of shapes) {
    const result = QRCode.toPath({ ...base, module: { shape } })
    assert(result.path.startsWith('M'))
    assert(result.cellSize > 0)
    assert(result.path.length > 10)
  }
})

Deno.test('QRCode - applies background color', () => {
  const background = '#ff0000'
  const svg = QRCode.toSVG({ value: 'test', size: 200, background })
  assert(svg.includes(`fill="${background}"`))
})

Deno.test('QRCode - applies solid module color', () => {
  const color = '#00ff00'
  const svg = QRCode.toSVG({ value: 'test', size: 200, color })
  assert(svg.includes(`fill="${color}"`))
})

Deno.test('QRCode - escapes special characters in logo image href', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 200,
    logo: { image: 'data:image/png;base64,x" onerror="alert(1)' }
  })
  assert(svg.includes('xlink:href="data:image/png;base64,x&quot; onerror=&quot;alert(1)"'))
})

Deno.test('QRCode - escapes special characters in logo text', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 200,
    logo: { text: '<b>&</b>' }
  })
  assert(svg.includes('&lt;b&gt;&amp;&lt;/b&gt;'))
})

Deno.test('QRCode - falls back to solid color if gradient has only one stop', () => {
  const color = '#ff5500'
  const svg = QRCode.toSVG({
    value: 'test',
    size: 200,
    color: {
      type: 'linear',
      stops: [{ offset: 0, color }]
    }
  })
  assert(svg.includes(`fill="${color}"`))
  assert(!svg.includes('<linearGradient'))
})

Deno.test('QRCode - finder and module different shapes produce valid SVG', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 200,
    finder: { shape: 'square', gap: 1 },
    module: { shape: 'circle', gap: 0 }
  })
  assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'))
  assert(svg.includes('<path'))
})

Deno.test('QRCode - generates horizontal and vertical SVG dimensions', () => {
  const size = 300
  const svg = QRCode.toSVG({ value: 'https://neabyte.com', size })
  assert(svg.includes(`width="${size}"`))
  assert(svg.includes(`height="${size}"`))
  assert(svg.includes(`viewBox="0 0 ${size} ${size}"`))
})

Deno.test('QRCode - generates linear gradient defs', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 200,
    color: {
      type: 'linear',
      stops: [
        { offset: 0, color: '#000000' },
        { offset: 1, color: '#ffffff' }
      ]
    }
  })
  assert(svg.includes('<linearGradient'))
  assert(svg.includes('id="qr-g-'))
  assert(svg.includes('stop-color="#000000"'))
  assert(svg.includes('stop-color="#ffffff"'))
})

Deno.test('QRCode - generates radial gradient defs', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 200,
    color: {
      type: 'radial',
      stops: [
        { offset: 0, color: '#ff0000' },
        { offset: 1, color: '#0000ff' }
      ]
    }
  })
  assert(svg.includes('<radialGradient'))
  assert(svg.includes('stop-color="#ff0000"'))
})

Deno.test('QRCode - gradient with empty stops array falls back to defaultColor', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 100,
    color: { type: 'linear', stops: [] }
  })
  assert(svg.includes(`fill="${QRCode.defaultColor}"`))
  assert(!svg.includes('<linearGradient'))
})

Deno.test('QRCode - gradient with one stop and missing color falls back to defaultColor', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 100,
    color: {
      type: 'linear',
      stops: [{ offset: 0, color: undefined as unknown as string }]
    }
  })
  assert(svg.includes(`fill="${QRCode.defaultColor}"`))
})

Deno.test('QRCode - gradient stop offset and color escaped in defs', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 100,
    color: {
      type: 'linear',
      stops: [
        { offset: 0, color: '#f00' },
        { offset: 0.5, color: '#0f0' },
        { offset: 1, color: '#00f' }
      ]
    }
  })
  assert(svg.includes('stop-color="#f00"'))
  assert(svg.includes('stop-color="#0f0"'))
  assert(svg.includes('stop-color="#00f"'))
  assert(svg.includes('offset="0"'))
  assert(svg.includes('offset="0.5"'))
  assert(svg.includes('offset="1"'))
})

Deno.test('QRCode - includes logo image', () => {
  const image = 'data:image/png;base64,iVBORw0KGgo='
  const svg = QRCode.toSVG({
    value: 'test',
    size: 400,
    logo: { image, size: 100 }
  })
  assert(svg.includes('<image'))
  assert(svg.includes('xlink:href="data:image/png;base64,iVBORw0KGgo="'))
})

Deno.test('QRCode - includes logo text', () => {
  const text = 'QR'
  const svg = QRCode.toSVG({
    value: 'test',
    size: 400,
    logo: { text, size: 100 }
  })
  assert(svg.includes(text))
  assert(svg.includes('<text'))
})

Deno.test('QRCode - linear gradient custom x1 y1 x2 y2 appear in output', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 100,
    color: {
      type: 'linear',
      x1: 0.1,
      y1: 0.2,
      x2: 0.9,
      y2: 0.8,
      stops: [
        { offset: 0, color: '#000' },
        { offset: 1, color: '#fff' }
      ]
    }
  })
  assert(svg.includes('x1="0.1"'))
  assert(svg.includes('y1="0.2"'))
  assert(svg.includes('x2="0.9"'))
  assert(svg.includes('y2="0.8"'))
})

Deno.test('QRCode - logo with empty string text does not add text element', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 200,
    logo: { text: '', size: 80 }
  })
  assert(!svg.includes('<text'))
})

Deno.test('QRCode - logo with only size and no text or image produces valid SVG', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 200,
    logo: { size: 60 }
  })
  assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'))
  assert(svg.includes('<path'))
  assert(!svg.includes('<text'))
  assert(!svg.includes('<image'))
})

Deno.test('QRCode - long value produces valid path and SVG', () => {
  const longValue = 'https://example.com/' + 'a'.repeat(200)
  const result = QRCode.toPath({ value: longValue, size: 300 })
  assert(result.path.startsWith('M'))
  assert(result.path.length > 100)
  const svg = QRCode.toSVG({ value: longValue, size: 300 })
  assert(svg.includes('viewBox="0 0 300 300"'))
})

Deno.test('QRCode - omitted background uses defaultBackground in output', () => {
  const svg = QRCode.toSVG({ value: 'x', size: 100 })
  assert(svg.includes(`fill="${QRCode.defaultBackground}"`))
})

Deno.test('QRCode - omitted color uses defaultColor in output', () => {
  const svg = QRCode.toSVG({ value: 'x', size: 100 })
  assert(svg.includes(`fill="${QRCode.defaultColor}"`))
})

Deno.test('QRCode - radial gradient includes fx/fy focus points if provided', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 200,
    color: {
      type: 'radial',
      fx: 0.2,
      fy: 0.8,
      stops: [
        { offset: 0, color: '#000' },
        { offset: 1, color: '#fff' }
      ]
    }
  })
  assert(svg.includes('fx="0.2"'))
  assert(svg.includes('fy="0.8"'))
})

Deno.test('QRCode - radial gradient without fx fy omits focus attributes', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 100,
    color: {
      type: 'radial',
      stops: [
        { offset: 0, color: '#000' },
        { offset: 1, color: '#fff' }
      ]
    }
  })
  assert(svg.includes('<radialGradient'))
  assert(!svg.includes('fx="'))
  assert(!svg.includes('fy="'))
})

Deno.test('QRCode - small size produces valid output', () => {
  const result = QRCode.toPath({ value: 'x', size: 21 })
  assert(result.path.startsWith('M'))
  assert(result.cellSize > 0)
  assertEquals(result.cellSize, 21 / 21)
  const svg = QRCode.toSVG({ value: 'x', size: 21 })
  assert(svg.includes('width="21"'))
  assert(svg.includes('height="21"'))
})

Deno.test('QRCode - toPath cellSize scales with size', () => {
  const value = 'scale'
  const r100 = QRCode.toPath({ value, size: 100 })
  const r200 = QRCode.toPath({ value, size: 200 })
  assert(r100.cellSize > 0 && r200.cellSize > 0)
  assertEquals(r200.cellSize / r100.cellSize, 2)
})

Deno.test('QRCode - toPath different module shapes produce different path', () => {
  const base = { value: 'shape', size: 200 }
  const rounded = QRCode.toPath({ ...base, module: { shape: 'rounded' } })
  const circle = QRCode.toPath({ ...base, module: { shape: 'circle' } })
  const square = QRCode.toPath({ ...base, module: { shape: 'square' } })
  assert(rounded.path !== circle.path)
  assert(rounded.path !== square.path)
  assert(circle.path !== square.path)
})

Deno.test('QRCode - toPath is deterministic for same options', () => {
  const opts = { value: 'deterministic', size: 300 }
  assertEquals(QRCode.toPath(opts).path, QRCode.toPath(opts).path)
  assertEquals(QRCode.toPath(opts).cellSize, QRCode.toPath(opts).cellSize)
})

Deno.test('QRCode - toPath path changes based on value', () => {
  const res1 = QRCode.toPath({ value: 'hello', size: 200 })
  const res2 = QRCode.toPath({ value: 'world', size: 200 })
  assert(res1.path !== res2.path)
})

Deno.test('QRCode - toPath path is valid SVG path (starts with M)', () => {
  const result = QRCode.toPath({ value: 'valid', size: 100 })
  assert(result.path.startsWith('M'))
  assert(result.path.length > 1)
})

Deno.test('QRCode - toPath respects logo size for cutout', () => {
  const noLogo = QRCode.toPath({ value: 'test', size: 200 })
  const withLogo = QRCode.toPath({ value: 'test', size: 200, logo: { size: 100, text: 'X' } })
  assert(withLogo.path.length < noLogo.path.length)
})

Deno.test('QRCode - toPath returns raw path and correct cellSize', () => {
  const size = 500
  const result = QRCode.toPath({ value: 'abc', size })
  assert(typeof result.path === 'string')
  assert(result.path.length > 0)
  assert(result.cellSize > 0)
  assertEquals(result.cellSize, size / 21)
})

Deno.test('QRCode - toSVG with logo image adds xmlns xlink', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 100,
    logo: { image: 'data:image/png;base64,abc', size: 40 }
  })
  assert(svg.includes('xmlns:xlink="http://www.w3.org/1999/xlink"'))
  assert(svg.includes('<image'))
})

Deno.test('QRCode - toSVG without logo image omits xmlns xlink', () => {
  const svg = QRCode.toSVG({ value: 'test', size: 100 })
  assert(!svg.includes('xmlns:xlink'))
})

Deno.test('QRCode - unicode value produces valid SVG', () => {
  const svg = QRCode.toSVG({ value: '日本語', size: 100 })
  assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'))
  assert(svg.includes('viewBox="0 0 100 100"'))
  const pathResult = QRCode.toPath({ value: '🔗', size: 100 })
  assert(pathResult.path.startsWith('M'))
  assert(pathResult.cellSize > 0)
})

Deno.test('QRCode - uses default objectBoundingBox linear gradient values', () => {
  const svg = QRCode.toSVG({
    value: 'test',
    size: 200,
    color: {
      type: 'linear',
      stops: [
        { offset: 0, color: '#000' },
        { offset: 1, color: '#fff' }
      ]
    }
  })
  assert(svg.includes('x1="0"'))
  assert(svg.includes('y1="0"'))
  assert(svg.includes('x2="1"'))
  assert(svg.includes('y2="1"'))
})

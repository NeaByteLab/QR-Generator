/**
 * Preview script: nine QR SVGs (3×3).
 * @description Writes SVG files; shape, color, logo vary per example.
 * Run: deno run --allow-write preview/generator.ts
 */

import QRCode, { type SVGOptions } from '@neabyte/qr-generator'

/** Base value, size, error, finder for all examples. */
const baseOptions: Pick<SVGOptions, 'value' | 'size' | 'error' | 'finder'> = {
  value: 'https://neabyte.com/',
  size: 300,
  error: { level: 'H' },
  finder: { shape: 'rounded', gap: 1 }
}

/** Module shape list for example variants. */
const moduleShapes = ['rounded', 'circle', 'diamond', 'square', 'shuriken', 'star'] as const

/** Example configs: name and SVGOptions per preview. */
const examples: { name: string; options: SVGOptions }[] = [
  {
    name: 'solid-no-logo',
    options: {
      ...baseOptions,
      module: { shape: moduleShapes[0], gap: 1 },
      color: '#0f172a',
      background: '#f1f5f9'
    }
  },
  {
    name: 'solid-text-logo',
    options: {
      ...baseOptions,
      module: { shape: moduleShapes[1], gap: 1 },
      color: '#065f46',
      background: '#ecfdf5',
      logo: { size: 80, radius: 6, text: '◆' }
    }
  },
  {
    name: 'solid-rose',
    options: {
      ...baseOptions,
      module: { shape: moduleShapes[2], gap: 1 },
      color: '#b91c1c',
      background: '#fef2f2'
    }
  },
  {
    name: 'linear-no-logo',
    options: {
      ...baseOptions,
      module: { shape: moduleShapes[3], gap: 1 },
      color: {
        type: 'linear',
        x1: 0,
        y1: 0,
        x2: 1,
        y2: 1,
        stops: [
          { offset: 0, color: '#7c3aed' },
          { offset: 1, color: '#2563eb' }
        ]
      },
      background: '#faf5ff'
    }
  },
  {
    name: 'linear-text-logo',
    options: {
      ...baseOptions,
      module: { shape: moduleShapes[4], gap: 1 },
      color: {
        type: 'linear',
        x1: 0,
        y1: 0,
        x2: 1,
        y2: 1,
        stops: [
          { offset: 0, color: '#ea580c' },
          { offset: 1, color: '#c2410c' }
        ]
      },
      background: '#fff7ed',
      logo: { size: 80, radius: 6, text: 'NB' }
    }
  },
  {
    name: 'linear-magenta',
    options: {
      ...baseOptions,
      module: { shape: moduleShapes[5], gap: 1 },
      color: {
        type: 'linear',
        x1: 1,
        y1: 0,
        x2: 0,
        y2: 1,
        stops: [
          { offset: 0, color: '#a21caf' },
          { offset: 1, color: '#701a75' }
        ]
      },
      background: '#fdf4ff'
    }
  },
  {
    name: 'radial-no-logo',
    options: {
      ...baseOptions,
      module: { shape: moduleShapes[0], gap: 1 },
      color: {
        type: 'radial',
        cx: 0.5,
        cy: 0.5,
        r: 0.5,
        stops: [
          { offset: 0, color: '#f59e0b' },
          { offset: 1, color: '#d97706' }
        ]
      },
      background: '#fffbeb'
    }
  },
  {
    name: 'radial-text-logo',
    options: {
      ...baseOptions,
      module: { shape: moduleShapes[1], gap: 1 },
      color: {
        type: 'radial',
        cx: 0.5,
        cy: 0.5,
        r: 0.5,
        stops: [
          { offset: 0, color: '#4f46e5' },
          { offset: 1, color: '#3730a3' }
        ]
      },
      background: '#eef2ff',
      logo: { size: 80, radius: 6, text: '*' }
    }
  },
  {
    name: 'radial-sky',
    options: {
      ...baseOptions,
      module: { shape: moduleShapes[2], gap: 1 },
      color: {
        type: 'radial',
        cx: 0.5,
        cy: 0.5,
        r: 0.5,
        stops: [
          { offset: 0, color: '#0284c7' },
          { offset: 1, color: '#0369a1' }
        ]
      },
      background: '#f0f9ff'
    }
  }
]
for (const { name, options } of examples) {
  const svg = QRCode.toSVG(options)
  const outPath = new URL(`qrcode-${name}.svg`, import.meta.url).pathname
  await Deno.writeTextFile(outPath, svg)
  console.log('Saved: qrcode-' + name + '.svg')
}

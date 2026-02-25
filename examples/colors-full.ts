/**
 * Solid color, background, and radial gradient.
 * @description Three toSVG variants: solid+background, radial, radial with focus (fx/fy).
 * Run from repo root: deno run -A examples/colors-full.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Shared options and output directory. */
const base = { value: 'Colors full', size: 200 }
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })

/** Step 2: Solid color and custom background. */
const solid = QRCode.toSVG({
  ...base,
  color: '#1e3a5f',
  background: '#e8eef4'
})

/** Step 3: Radial gradient (center cx,cy and radius r). */
const radial = QRCode.toSVG({
  ...base,
  color: {
    type: 'radial',
    cx: 0.5,
    cy: 0.5,
    r: 0.6,
    stops: [
      { offset: 0, color: '#f59e0b' },
      { offset: 1, color: '#b45309' }
    ]
  },
  background: '#fffbeb'
})

/** Step 4: Radial gradient with focus point (fx, fy) for directional highlight. */
const radialFocus = QRCode.toSVG({
  ...base,
  color: {
    type: 'radial',
    cx: 0.5,
    cy: 0.5,
    r: 0.5,
    fx: 0.3,
    fy: 0.3,
    stops: [
      { offset: 0, color: '#7c3aed' },
      { offset: 1, color: '#4c1d95' }
    ]
  },
  background: '#f5f3ff'
})

/** Step 5: Write all three SVGs to out/. */
await Deno.writeTextFile(`${outDir}/color-solid.svg`, solid)
await Deno.writeTextFile(`${outDir}/gradient-radial.svg`, radial)
await Deno.writeTextFile(`${outDir}/gradient-radial-focus.svg`, radialFocus)
console.log(`Saved: ${outDir}/color-solid.svg, gradient-radial.svg, gradient-radial-focus.svg`)

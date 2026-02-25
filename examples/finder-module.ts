/**
 * Finder pattern vs data modules (different shapes).
 * @description Finder = three corners (7×7); module = rest of grid. Here finder square, module circle.
 * Run from repo root: deno run -A examples/finder-module.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Base options and output directory. */
const base = { value: 'Finder vs module', size: 200 }
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })

/** Step 2: toSVG with finder.shape and module.shape different; optional gap for spacing. */
const svg = QRCode.toSVG({
  ...base,
  finder: { shape: 'square', gap: 0 },
  module: { shape: 'circle', gap: 1 }
})

/** Step 3: Write single SVG to out/finder-module.svg. */
await Deno.writeTextFile(`${outDir}/finder-module.svg`, svg)
console.log(`Saved: ${outDir}/finder-module.svg (finder=square, module=circle)`)

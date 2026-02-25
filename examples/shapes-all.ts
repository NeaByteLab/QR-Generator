/**
 * All seven module shapes.
 * @description One toSVG per ModuleShape; writes shapes-<shape>.svg for each.
 * Run from repo root: deno run -A examples/shapes-all.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: List all module shapes and base options; ensure out dir exists. */
const shapes = ['rounded', 'circle', 'square', 'diamond', 'shuriken', 'star', 'triangle'] as const
const base = { value: 'All shapes', size: 180 }
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })

/** Step 2: Generate one SVG per shape and write to out/shapes-<shape>.svg. */
for (const shape of shapes) {
  const svg = QRCode.toSVG({ ...base, module: { shape } })
  await Deno.writeTextFile(`${outDir}/shapes-${shape}.svg`, svg)
}
console.log(`Saved 7 SVGs to ${outDir}/ (shapes-rounded.svg … shapes-triangle.svg)`)

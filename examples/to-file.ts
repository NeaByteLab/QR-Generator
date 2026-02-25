/**
 * Write SVG to file via toFile(path, options).
 * @description toFile uses adapter storage (Deno/Node writes to path); writes out/to-file.svg.
 * Run from repo root: deno run -A examples/to-file.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Output directory and SVG options. */
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })
const opts = { value: 'toFile demo', size: 200, color: '#2563eb', background: '#eff6ff' }

/** Step 2: toFile(path, SVGOptions) writes SVG to path (adapter: Deno/Node file, browser download). */
await QRCode.toFile(`${outDir}/to-file.svg`, opts)
console.log(`Saved: ${outDir}/to-file.svg`)

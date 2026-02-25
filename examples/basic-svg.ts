/**
 * Basic SVG: generate QR and save to file.
 * @description Minimal toSVG with value and size; writes examples/out/basic.svg.
 * Run from repo root: deno run -A examples/basic-svg.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Generate SVG string with required value and size (default color/background). */
const svg = QRCode.toSVG({
  value: 'https://github.com/neabyte/qr-generator',
  size: 256
})

/** Step 2: Resolve output directory and create it if missing. */
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })

/** Step 3: Write SVG to file and log path. */
await Deno.writeTextFile(`${outDir}/basic.svg`, svg)
console.log(`Saved: ${outDir}/basic.svg`)

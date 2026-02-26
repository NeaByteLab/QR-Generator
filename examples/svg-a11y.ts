/**
 * SVG with accessibility title and alt.
 * @description toSVG with title/alt (SVGOptions); writes out/svg-a11y.svg.
 * Run from repo root: deno run -A examples/svg-a11y.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Output directory and SVG options with title and alt. */
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })
const opts = {
  value: 'https://example.com',
  size: 200,
  title: 'Example QR code',
  alt: 'Scan to open example.com in your browser'
}

/** Step 2: toSVG adds <title>, <desc>, role="img", aria-labelledby. */
const svg = QRCode.toSVG(opts)
console.log('toSVG with title/alt (has role="img"):', svg.includes('role="img"'))
console.log('toSVG with title/alt (has <title):', svg.includes('<title'))
console.log('toSVG with title/alt (has <desc):', svg.includes('<desc'))

/** Step 3: Write SVG to file. */
await Deno.writeTextFile(`${outDir}/svg-a11y.svg`, svg)
console.log(`Saved: ${outDir}/svg-a11y.svg`)

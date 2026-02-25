/**
 * Custom shapes and gradient colors.
 * @description Four toSVG variants: rounded, circle, linear gradient, text logo.
 * Run from repo root: deno run -A examples/shapes-and-colors.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Shared value and size for all variants. */
const base = { value: 'Shapes & Colors', size: 200 }

/** Step 2: Rounded module shape (default-style). */
const rounded = QRCode.toSVG({ ...base, module: { shape: 'rounded' } })

/** Step 3: Circle module shape. */
const circle = QRCode.toSVG({ ...base, module: { shape: 'circle' } })

/** Step 4: Linear gradient (x1,y1 → x2,y2 in object bounding box; stops for colors). */
const linear = QRCode.toSVG({
  ...base,
  color: {
    type: 'linear',
    x1: 0,
    y1: 0,
    x2: 1,
    y2: 1,
    stops: [
      { offset: 0, color: '#6366f1' },
      { offset: 1, color: '#ec4899' }
    ]
  }
})

/** Step 5: Center logo with text (size and optional radius). */
const withLogo = QRCode.toSVG({
  ...base,
  logo: { text: 'QR', size: 56 }
})

/** Step 6: Ensure out dir and write all four SVGs. */
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })
await Deno.writeTextFile(`${outDir}/shapes-rounded.svg`, rounded)
await Deno.writeTextFile(`${outDir}/shapes-circle.svg`, circle)
await Deno.writeTextFile(`${outDir}/gradient-linear.svg`, linear)
await Deno.writeTextFile(`${outDir}/logo-text.svg`, withLogo)
console.log(`Saved 4 SVGs to ${outDir}/`)

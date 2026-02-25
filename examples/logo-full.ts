/**
 * Logo: text with size/radius, image (data URI), and radius for cutout.
 * @description Three toSVG variants: text logo with radius, image logo (data URI), rounded cutout only.
 * Run from repo root: deno run -A examples/logo-full.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Base options and output directory. */
const base = { value: 'Logo full demo', size: 200 }
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })

/** Step 2: Text logo with size and radius (rounded corners for logo area). */
const textWithRadius = QRCode.toSVG({
  ...base,
  logo: { text: 'QR', size: 64, radius: 12 }
})

/** Step 3: Build a tiny SVG as data URI for image logo (no external file). */
const tinySvgUri =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="%234f46e5"/><text x="32" y="38" text-anchor="middle" fill="white" font-size="24">i</text></svg>'
  )

/** Step 4: Image logo with size and radius (path is cut out in center; logo sits in quiet area). */
const withImage = QRCode.toSVG({
  ...base,
  logo: { size: 72, radius: 8, image: tinySvgUri }
})

/** Step 5: Logo with larger radius for cutout (rounded rectangle hole in QR). */
const radiusCutout = QRCode.toSVG({
  ...base,
  logo: { size: 80, radius: 16, text: '•' }
})

/** Step 6: Write all three SVGs to out/. */
await Deno.writeTextFile(`${outDir}/logo-text-radius.svg`, textWithRadius)
await Deno.writeTextFile(`${outDir}/logo-image.svg`, withImage)
await Deno.writeTextFile(`${outDir}/logo-radius-cutout.svg`, radiusCutout)
console.log(`Saved: ${outDir}/logo-text-radius.svg, logo-image.svg, logo-radius-cutout.svg`)

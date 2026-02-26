/**
 * HTML img tag via toImgTag(options).
 * @description ImgTagOptions (value, alt, width, height); writes out/qr-img.html.
 * Run from repo root: deno run -A examples/to-img-tag.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Output directory. */
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })

/** Step 2: toImgTag with default alt (GIF data URL, dimensions from grid). */
const imgDefault = QRCode.toImgTag({ value: 'https://example.com', cellSize: 2, margin: 8 })
console.log('toImgTag default (starts with <img):', imgDefault.startsWith('<img'))

/** Step 3: toImgTag with custom alt, width, height. */
const imgCustom = QRCode.toImgTag({
  value: 'https://example.com',
  cellSize: 2,
  margin: 8,
  alt: 'Scan to open example',
  width: 256,
  height: 256
})

/** Step 4: Wrap in HTML and save. */
const html = `<!DOCTYPE html><html><body><h2>Default alt</h2>${imgDefault}<h2>Custom alt and size</h2>${imgCustom}</body></html>`
await Deno.writeTextFile(`${outDir}/qr-img.html`, html)
console.log(`Saved: ${outDir}/qr-img.html`)

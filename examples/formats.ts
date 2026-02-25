/**
 * Multiple output formats: data URL, ASCII, table HTML.
 * @description Uses FormatOptions (value, error, cellSize, margin); toDataURL, toASCII, toTableTag.
 * Run from repo root: deno run -A examples/formats.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Shared FormatOptions for all three methods (value required; error, cellSize, margin optional). */
const opts = { value: 'Hello QR', error: { level: 'M' }, cellSize: 2, margin: 8 }

/** Step 2: toDataURL returns data:image/gif;base64,... — log a short prefix. */
const dataUrl = QRCode.toDataURL(opts)
console.log('toDataURL (first 60 chars):', dataUrl.slice(0, 60) + '...')

/** Step 3: toASCII returns terminal-style block art — log full string. */
console.log('\ntoASCII:')
console.log(QRCode.toASCII(opts))

/** Step 4: toTableTag returns <table>...</table> — wrap in HTML and save. */
const tableHtml = QRCode.toTableTag(opts)
console.log('\ntoTableTag (starts with <table):', tableHtml.startsWith('<table'))

/** Step 5: Save to file. */
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })
await Deno.writeTextFile(
  `${outDir}/qr-table.html`,
  `<!DOCTYPE html><html><body>${tableHtml}</body></html>`
)
console.log(`\nSaved: ${outDir}/qr-table.html`)

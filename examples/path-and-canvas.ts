/**
 * toPath (path-only) and toCanvas (browser).
 * @description toPath writes path-only.html; toCanvas demo in canvas-qr.html (open in browser).
 * Run from repo root: deno run -A examples/path-and-canvas.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Output directory and shared options. */
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })

const size = 200
const opts = { value: 'Path & Canvas demo', size }

/** Step 2: toPath returns { cellSize, path } — use path for custom SVG or other renderers. */
const { cellSize, path } = QRCode.toPath({
  ...opts,
  module: { shape: 'rounded' }
})

/** Step 3: Build HTML with inline SVG using the path (no color/background from library). */
const pathOnlyHtml = `<!DOCTYPE html><html><body>
<p>QR from toPath() — path-only SVG (custom fill/stroke in your app)</p>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <path d="${path.replace(/"/g, '&quot;')}" fill="black"/>
</svg>
<p>cellSize: ${cellSize}</p>
</body></html>`
await Deno.writeTextFile(`${outDir}/path-only.html`, pathOnlyHtml)
console.log(`Saved: ${outDir}/path-only.html`)

/** Step 4: Build HTML that loads the lib in browser and calls toCanvas on a canvas. */
const canvasHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>toCanvas</title></head><body>
<p>QR from toCanvas() — open this file in a browser</p>
<canvas id="qr" width="200" height="200"></canvas>
<script type="module">
import QRCode from 'https://esm.sh/@neabyte/qr-generator'
const canvas = document.getElementById('qr')
const ctx = canvas.getContext('2d')
QRCode.toCanvas(ctx, { value: 'Path & Canvas demo', cellSize: 4 })
</script>
</body></html>`
await Deno.writeTextFile(`${outDir}/canvas-qr.html`, canvasHtml)
console.log(`Saved: ${outDir}/canvas-qr.html (open in browser to see canvas QR)`)

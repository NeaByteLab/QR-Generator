/**
 * Write SVG to a stream via toFileStream(stream, options).
 * @description Stream with write(data) and end(); here stream writes to out/to-file-stream.svg.
 * Run from repo root: deno run -A examples/to-file-stream.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Output directory and path. */
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })
const path = `${outDir}/to-file-stream.svg`

/** Step 2: WritableStreamLike: write(data) and end(); buffer then write file in end(). */
let buffer = ''
const stream = {
  write(data: string | Uint8Array) {
    buffer += typeof data === 'string' ? data : new TextDecoder().decode(data)
  },
  async end() {
    await Deno.writeTextFile(path, buffer)
  }
}

/** Step 3: toFileStream calls stream.write(svg) then stream.end(). */
await QRCode.toFileStream(stream, { value: 'toFileStream demo', size: 200 })
console.log(`Saved: ${path}`)

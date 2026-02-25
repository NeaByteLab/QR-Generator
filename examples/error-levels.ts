/**
 * Error correction levels L, M, Q, H (same value/size).
 * @description One SVG per level; higher level = more redundancy, larger matrix possible.
 * Run from repo root: deno run -A examples/error-levels.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Same content and size for all levels; output directory. */
const value = 'Error levels L M Q H'
const size = 180
const levels = ['L', 'M', 'Q', 'H'] as const
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })

/** Step 2: Generate one SVG per error level and write to out/error-level-<L|M|Q|H>.svg. */
for (const level of levels) {
  const svg = QRCode.toSVG({
    value,
    size,
    error: { level },
    module: { shape: 'rounded' }
  })
  await Deno.writeTextFile(`${outDir}/error-level-${level}.svg`, svg)
}
console.log(`Saved 4 SVGs to ${outDir}/ (error-level-L.svg … error-level-H.svg)`)

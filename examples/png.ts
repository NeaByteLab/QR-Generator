/**
 * PNG output via toPNG (data URL); decode and save to file.
 * @description PNGOptions (value, cellSize, margin; optional color/background); writes out/qr-default.png, qr-colored.png.
 * Run from repo root: deno run -A examples/png.ts
 */
import QRCode from '@neabyte/qr-generator'

/** Step 1: Output directory. */
const outDir = new URL('./out', import.meta.url).pathname
await Deno.mkdir(outDir, { recursive: true })

/** Step 2: toPNG returns data:image/png;base64,... — decode and write default (black on white). */
const dataUrlDefault = await QRCode.toPNG({
  value: 'https://github.com/neabyte/qr-generator',
  cellSize: 4,
  margin: 8
})
const base64Default = dataUrlDefault.replace(/^data:image\/png;base64,/, '')
await Deno.writeFile(
  `${outDir}/qr-default.png`,
  Uint8Array.from(atob(base64Default), c => c.charCodeAt(0))
)

/** Step 3: toPNG with hex color/background for RGB PNG; decode and write. */
const dataUrlColored = await QRCode.toPNG({
  value: 'PNG with colors',
  cellSize: 4,
  margin: 8,
  color: '#1a1a2e',
  background: '#eaeaea'
})

/** Step 4: Decode and write the colored PNG. */
const base64Colored = dataUrlColored.replace(/^data:image\/png;base64,/, '')
await Deno.writeFile(
  `${outDir}/qr-colored.png`,
  Uint8Array.from(atob(base64Colored), c => c.charCodeAt(0))
)
console.log(`Saved: ${outDir}/qr-default.png, ${outDir}/qr-colored.png`)

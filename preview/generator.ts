/**
 * Preview: nine SVGs and three GIFs.
 * @description Writes SVG files then builds GIFs via rsvg-convert.
 * Run: deno run -A preview/generator.ts
 */

import gifenc from 'npm:gifenc'
import QRCode, { type SVGOptions } from '@neabyte/qr-generator'
import * as Helpers from '@app/core/helpers/index.ts'

/**
 * Preview generator for SVGs and GIFs.
 * @description Static API for writing preview files and GIFs.
 */
export default class PreviewGenerator {
  /** Current preview directory path. */
  static readonly previewDir = new URL('./', import.meta.url).pathname
  /** Frame delay in centiseconds for GIFs. */
  static readonly delayCentisec = 80
  /** Base value, size, error, finder for all examples. */
  static readonly baseOptions: Pick<SVGOptions, 'value' | 'size' | 'error' | 'finder'> = {
    value: 'https://neabyte.com/',
    size: 300,
    error: { level: 'H' },
    finder: { shape: 'rounded', gap: 1 }
  }
  /** Module shape list for example variants. */
  static readonly moduleShapes = [
    'rounded',
    'circle',
    'diamond',
    'square',
    'shuriken',
    'star'
  ] as const
  /** Example configs: name and SVGOptions per preview. */
  static readonly examples: { name: string; options: SVGOptions }[] = [
    {
      name: 'solid-no-logo',
      options: {
        ...PreviewGenerator.baseOptions,
        module: { shape: PreviewGenerator.moduleShapes[0], gap: 1 },
        color: '#0f172a',
        background: '#f1f5f9'
      }
    },
    {
      name: 'solid-text-logo',
      options: {
        ...PreviewGenerator.baseOptions,
        module: { shape: PreviewGenerator.moduleShapes[1], gap: 1 },
        color: '#065f46',
        background: '#ecfdf5',
        logo: { size: 80, radius: 6, text: '◆' }
      }
    },
    {
      name: 'solid-rose',
      options: {
        ...PreviewGenerator.baseOptions,
        module: { shape: PreviewGenerator.moduleShapes[2], gap: 1 },
        color: '#b91c1c',
        background: '#fef2f2'
      }
    },
    {
      name: 'linear-no-logo',
      options: {
        ...PreviewGenerator.baseOptions,
        module: { shape: PreviewGenerator.moduleShapes[3], gap: 1 },
        color: {
          type: 'linear',
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 1,
          stops: [
            { offset: 0, color: '#7c3aed' },
            { offset: 1, color: '#2563eb' }
          ]
        },
        background: '#faf5ff'
      }
    },
    {
      name: 'linear-text-logo',
      options: {
        ...PreviewGenerator.baseOptions,
        module: { shape: PreviewGenerator.moduleShapes[4], gap: 1 },
        color: {
          type: 'linear',
          x1: 0,
          y1: 0,
          x2: 1,
          y2: 1,
          stops: [
            { offset: 0, color: '#ea580c' },
            { offset: 1, color: '#c2410c' }
          ]
        },
        background: '#fff7ed',
        logo: { size: 80, radius: 6, text: 'NB' }
      }
    },
    {
      name: 'linear-magenta',
      options: {
        ...PreviewGenerator.baseOptions,
        module: { shape: PreviewGenerator.moduleShapes[5], gap: 1 },
        color: {
          type: 'linear',
          x1: 1,
          y1: 0,
          x2: 0,
          y2: 1,
          stops: [
            { offset: 0, color: '#a21caf' },
            { offset: 1, color: '#701a75' }
          ]
        },
        background: '#fdf4ff'
      }
    },
    {
      name: 'radial-no-logo',
      options: {
        ...PreviewGenerator.baseOptions,
        module: { shape: PreviewGenerator.moduleShapes[0], gap: 1 },
        color: {
          type: 'radial',
          cx: 0.5,
          cy: 0.5,
          r: 0.5,
          stops: [
            { offset: 0, color: '#f59e0b' },
            { offset: 1, color: '#d97706' }
          ]
        },
        background: '#fffbeb'
      }
    },
    {
      name: 'radial-text-logo',
      options: {
        ...PreviewGenerator.baseOptions,
        module: { shape: PreviewGenerator.moduleShapes[1], gap: 1 },
        color: {
          type: 'radial',
          cx: 0.5,
          cy: 0.5,
          r: 0.5,
          stops: [
            { offset: 0, color: '#4f46e5' },
            { offset: 1, color: '#3730a3' }
          ]
        },
        background: '#eef2ff',
        logo: { size: 80, radius: 6, text: '*' }
      }
    },
    {
      name: 'radial-sky',
      options: {
        ...PreviewGenerator.baseOptions,
        module: { shape: PreviewGenerator.moduleShapes[2], gap: 1 },
        color: {
          type: 'radial',
          cx: 0.5,
          cy: 0.5,
          r: 0.5,
          stops: [
            { offset: 0, color: '#0284c7' },
            { offset: 1, color: '#0369a1' }
          ]
        },
        background: '#f0f9ff'
      }
    }
  ]
  /** GIF output names and their source SVG filenames. */
  static readonly gifGroups: { gifName: string; svgNames: string[] }[] = [
    {
      gifName: 'qrcode-no-logo.gif',
      svgNames: [
        'qrcode-solid-no-logo.svg',
        'qrcode-linear-no-logo.svg',
        'qrcode-radial-no-logo.svg'
      ]
    },
    {
      gifName: 'qrcode-text-logo.gif',
      svgNames: [
        'qrcode-solid-text-logo.svg',
        'qrcode-linear-text-logo.svg',
        'qrcode-radial-text-logo.svg'
      ]
    },
    {
      gifName: 'qrcode-variant.gif',
      svgNames: ['qrcode-solid-rose.svg', 'qrcode-linear-magenta.svg', 'qrcode-radial-sky.svg']
    }
  ]

  /**
   * Build GIF from PNG frame paths.
   * @description Encodes PNG frames into single animated GIF file.
   * @param pngPaths - Paths to PNG frame files
   * @param outPath - Output GIF file path
   * @param delayMs - Frame delay in milliseconds
   */
  static async buildGifFromPngs(
    pngPaths: string[],
    outPath: string,
    delayMs: number
  ): Promise<void> {
    const frames: { data: Uint8Array; width: number; height: number }[] = []
    for (const pngPath of pngPaths) {
      const pngBytes = await Deno.readFile(pngPath)
      const { data, width, height } = await Helpers.Decode.png(pngBytes)
      frames.push({ data, width, height })
    }
    if (frames.length === 0) return
    const combinedLength = frames.reduce((sum, frame) => sum + frame.data.length, 0)
    const combinedData = new Uint8Array(combinedLength)
    let writeOffset = 0
    for (const frame of frames) {
      combinedData.set(frame.data, writeOffset)
      writeOffset += frame.data.length
    }
    const colorPalette = gifenc.quantize(combinedData, 256)
    const gifEncoder = gifenc.GIFEncoder()
    for (const frame of frames) {
      const { data, width, height } = frame
      const paletteIndex = gifenc.applyPalette(data, colorPalette)
      gifEncoder.writeFrame(paletteIndex, width, height, { palette: colorPalette, delay: delayMs })
    }
    gifEncoder.finish()
    await Deno.writeFile(outPath, gifEncoder.bytes())
  }

  /**
   * Check if rsvg-convert is available.
   * @description Returns true when rsvg-convert runs successfully.
   * @returns Promise resolving to availability boolean
   */
  static async hasRsvgConvert(): Promise<boolean> {
    try {
      const proc = await Deno.run({ cmd: ['rsvg-convert', '-v'], stdout: 'null', stderr: 'null' })
      const status = await proc.status()
      proc.close()
      return status.success
    } catch {
      return false
    }
  }

  /**
   * Write preview SVGs then build GIFs.
   * @description Generates SVG files, converts to PNGs, builds GIFs.
   * @returns Promise resolving when preview is done
   */
  static async runPreview(): Promise<void> {
    const previewDir = PreviewGenerator.previewDir
    for (const { name, options } of PreviewGenerator.examples) {
      const svgMarkup = QRCode.toSVG(options)
      const svgOutPath = `${previewDir}qrcode-${name}.svg`
      await Deno.writeTextFile(svgOutPath, svgMarkup)
      console.log('Saved: qrcode-' + name + '.svg')
    }
    if (!(await PreviewGenerator.hasRsvgConvert())) {
      console.warn('rsvg-convert not found; skipping GIFs. Install e.g. brew install librsvg')
      return
    }
    const delayMs = PreviewGenerator.delayCentisec * 10
    for (const { gifName, svgNames } of PreviewGenerator.gifGroups) {
      const gifOutPath = `${previewDir}${gifName}`
      const pngPaths = await PreviewGenerator.svgsToPngsViaRsvg(previewDir, svgNames)
      if (pngPaths.length !== svgNames.length) {
        console.warn('GIF', gifName, 'failed: rsvg-convert produced fewer frames')
        continue
      }
      await PreviewGenerator.buildGifFromPngs(pngPaths, gifOutPath, delayMs)
      for (const tempPngPath of pngPaths) await Deno.remove(tempPngPath).catch(() => {})
      console.log('Saved:', gifName)
    }
    for (const { name } of PreviewGenerator.examples) {
      await Deno.remove(`${previewDir}qrcode-${name}.svg`).catch(() => {})
    }
  }

  /**
   * Convert SVGs to PNGs via rsvg-convert.
   * @description Runs rsvg-convert per SVG; returns PNG paths.
   * @param previewDir - Directory containing SVG files
   * @param svgNames - SVG filenames to convert
   * @returns Promise resolving to PNG file paths
   */
  static async svgsToPngsViaRsvg(previewDir: string, svgNames: string[]): Promise<string[]> {
    const outputPaths: string[] = []
    for (let index = 0; index < svgNames.length; index++) {
      const pngPath = `${previewDir}preview-gif-frame-${index}.png`
      const proc = await Deno.run({
        cmd: ['rsvg-convert', '-o', pngPath, `${previewDir}${svgNames[index]}`],
        stdout: 'null',
        stderr: 'null'
      })
      const status = await proc.status()
      proc.close()
      if (!status.success) return outputPaths
      outputPaths.push(pngPath)
    }
    return outputPaths
  }
}

/**
 * Run preview generator.
 * @description Generates preview SVGs and GIFs.
 * @returns Promise resolving when preview is done
 */
export async function runPreview(): Promise<void> {
  return await PreviewGenerator.runPreview()
}

/**
 * Run preview generator if main module.
 * @description Generates preview SVGs and GIFs.
 * @returns Promise resolving when preview is done
 */
if (import.meta.main) {
  runPreview().catch(error => {
    console.error(error)
    Deno.exit(1)
  })
}

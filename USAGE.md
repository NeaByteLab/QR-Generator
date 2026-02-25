# Usage

Options, shapes, gradients, logo, and output formats for `@neabyte/qr-generator`.

## Quick Start

Import the default export and call a static method. Only `value` is required for most methods; `toSVG` and `toPath` also require `size`. See [examples/](examples/README.md) for runnable samples.

```typescript
import QRCode from '@neabyte/qr-generator'

const svg = QRCode.toSVG({
  value: 'https://example.com',
  size: 400,
  color: '#000000',
  background: '#ffffff'
})
```

## Options

### toSVG (Full Options)

`toSVG` accepts **SVGOptions**: required `value` and `size`; optional `color`, `background`, `error`, `finder`, `module`, `logo`. Error level defaults to `'H'`. Module and finder default to `shape: 'rounded'`, `gap: 0`.

```typescript
const svg = QRCode.toSVG({
  value: 'https://example.com',
  size: 400,
  color: '#1a1a1a',
  background: '#f5f5f5',
  error: { level: 'M' },
  finder: { shape: 'circle', gap: 2 },
  module: { shape: 'rounded', gap: 1 },
  logo: { size: 80, radius: 8, text: 'Hi' }
})
```

### Color (Solid and Gradients)

- **Solid:** pass a string (e.g. `'#000000'`, `'rgb(0,0,0)'`). Omitted or invalid color falls back to `QRCode.defaultColor` (`#000000`).
- **Linear gradient:** `type: 'linear'`, optional `x1`, `y1`, `x2`, `y2` (0–1, object bounding box), and `stops: [{ offset, color }]`. Defaults: x1=0, y1=0, x2=1, y2=1.
- **Radial gradient:** `type: 'radial'`, optional `cx`, `cy`, `r`, `fx`, `fy`, and `stops`. Defaults: cx=cy=0.5, r=0.5; `fx`/`fy` only added when both provided.

```typescript
QRCode.toSVG({
  value: 'https://example.com',
  size: 400,
  color: {
    type: 'linear',
    x1: 0,
    y1: 0,
    x2: 1,
    y2: 1,
    stops: [
      { offset: 0, color: '#000' },
      { offset: 1, color: '#333' }
    ]
  }
})

QRCode.toSVG({
  value: 'https://example.com',
  size: 400,
  color: {
    type: 'radial',
    cx: 0.5,
    cy: 0.5,
    r: 0.5,
    stops: [
      { offset: 0, color: '#111' },
      { offset: 1, color: '#000' }
    ]
  }
})
```

### Module and Finder Shapes

**ModuleShape:** `'circle' | 'diamond' | 'rounded' | 'square' | 'shuriken' | 'star' | 'triangle'`.

- **finder** — the three corner finder patterns (7×7 each); `shape` and `gap` apply only there.
- **module** — all other (data) modules; `shape` and `gap` apply there.

```typescript
QRCode.toSVG({
  value: 'https://example.com',
  size: 400,
  finder: { shape: 'square', gap: 0 },
  module: { shape: 'circle', gap: 1 }
})
```

### Logo (Text or Image)

- **Text logo:** `logo: { size?: number, radius?: number, text: string }`. Text is centered; font size is ~50% of logo size. Defaults: size 80, radius 0. Empty string `text` is treated as no text logo.
- **Image logo:** `logo: { size?: number, radius?: number, image: string }`. `image` is a data URI or URL (e.g. `data:image/png;base64,...`). Default size 80. The QR path is cut out in the center so the logo sits in the quiet area; `radius` rounds that cutout.

You can set both `text` and `image`; both are rendered (text then image in SVG order).

```typescript
QRCode.toSVG({
  value: 'https://example.com',
  size: 400,
  logo: { size: 72, radius: 6, text: 'QR' }
})

QRCode.toSVG({
  value: 'https://example.com',
  size: 400,
  logo: { size: 80, image: 'data:image/png;base64,...' }
})
```

### toPath (Path Only)

Use `toPath` when you need the path string and cell size (e.g. for canvas, Skia, or custom SVG). Options are **QRCodeOptions**: required `value` and `size`; optional `error`, `finder`, `module`, `logo`. No `color` or `background`; you apply fill yourself. `cellSize` in the result is `size / matrixSideLength`.

```typescript
const { cellSize, path } = QRCode.toPath({
  value: 'https://example.com',
  size: 400,
  finder: { shape: 'rounded' },
  module: { shape: 'rounded' }
})
// path: SVG path d attribute; use with <path d={path} fill="..." />
```

### toASCII, toDataURL, toTableTag

These use **FormatOptions**: required `value`; optional `error`, `cellSize`, `margin`. When omitted: `toDataURL` and `toTableTag` use cellSize 2, margin cellSize×4; `toASCII` uses Format defaults (cellSize 1 → half-block style, margin 2). `renderToCanvas` ignores `margin`.

```typescript
const ascii = QRCode.toASCII({ value: 'Hi', cellSize: 2, margin: 8 })
const dataUrl = QRCode.toDataURL({ value: 'Hi', cellSize: 2, margin: 8 })
const tableHtml = QRCode.toTableTag({ value: 'Hi', cellSize: 2, margin: 8 })
```

### renderToCanvas

Draws the QR on a 2D canvas context. Uses **FormatOptions** (`value`, optional `error`, `cellSize`); `margin` is not used. Default cellSize is 2.

```typescript
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
if (ctx) {
  QRCode.renderToCanvas(ctx, { value: 'https://example.com', cellSize: 4 })
}
```

## Methods Overview

| Method                  | Options              | Returns    | Description                                    |
| :---------------------- | :------------------- | :--------- | :--------------------------------------------- |
| `QRCode.toSVG`          | SVGOptions           | string     | Full SVG with path, fill, defs, optional logo. |
| `QRCode.toPath`         | QRCodeOptions        | PathResult | `{ cellSize, path }` for custom rendering.     |
| `QRCode.toASCII`        | FormatOptions        | string     | Terminal-style block or half-block art.        |
| `QRCode.toDataURL`      | FormatOptions        | string     | `data:image/gif;base64,...`.                   |
| `QRCode.toTableTag`     | FormatOptions        | string     | HTML `<table>...</table>`.                     |
| `QRCode.renderToCanvas` | (ctx, FormatOptions) | void       | Draws QR on given 2D context.                  |

### Pick a Method by What You Need

| I want to…                        | Use this                | Minimal call                          |
| :-------------------------------- | :---------------------- | :------------------------------------ |
| Get an SVG to show or save        | `QRCode.toSVG`          | `toSVG({ value: '…', size: 400 })`    |
| Get image for `<img>` or download | `QRCode.toDataURL`      | `toDataURL({ value: '…' })`           |
| Print QR in terminal              | `QRCode.toASCII`        | `toASCII({ value: '…' })`             |
| Get HTML table                    | `QRCode.toTableTag`     | `toTableTag({ value: '…' })`          |
| Draw on my own canvas             | `QRCode.renderToCanvas` | `renderToCanvas(ctx, { value: '…' })` |
| Get path string for custom draw   | `QRCode.toPath`         | `toPath({ value: '…', size: 400 })`   |

> [!NOTE]
> Every method needs at least `value` (the text or URL to encode). `toSVG` and `toPath` also need `size` (width/height in pixels).

## API Reference

### QRCode.toSVG(options)

Use when you need a full SVG string (e.g. inject in HTML, save as `.svg`, or send from API).

- `options` `<SVGOptions>`: `value` (required), `size` (required), `color?`, `background?`, `error?`, `finder?`, `module?`, `logo?`.
- Returns: `<string>` SVG document.
- Builds path via toPath, resolves color (solid or gradient defs), adds background rect, path, and optional text/image logo. Background defaults to `QRCode.defaultBackground` (`#ffffff`) when omitted.

### QRCode.toPath(options)

Use when you need the raw path and cell size (e.g. custom SVG, canvas, or Skia).

- `options` `<QRCodeOptions>`: `value` (required), `size` (required), `error?`, `finder?`, `module?`, `logo?`.
- Returns: `<PathResult>` `{ cellSize: number, path: string }`.
- Encodes value, builds matrix, applies shape options and logo cutout, returns path `d` and cell size.

### QRCode.toASCII(options)

Use when you want to print a QR in the terminal or get a text-only preview.

- `options` `<FormatOptions>`: `value` (required), `error?`, `cellSize?`, `margin?`.
- Returns: `<string>` Multiline ASCII (block or half-block by cellSize).
- Encodes value and renders grid as text.

### QRCode.toDataURL(options)

Use when you need a data URL for `<img src="…">` or for download (e.g. "Save as image").

- `options` `<FormatOptions>`: `value` (required), `error?`, `cellSize?`, `margin?`.
- Returns: `<string>` `data:image/gif;base64,...`.
- Encodes value and renders grid as GIF data URL. Defaults: cellSize 2, margin cellSize×4.

### QRCode.toTableTag(options)

Use when you need an HTML `<table>` snippet (e.g. email or legacy layout).

- `options` `<FormatOptions>`: `value` (required), `error?`, `cellSize?`, `margin?`.
- Returns: `<string>` HTML table element. Defaults: cellSize 2, margin cellSize×4.

### QRCode.renderToCanvas(ctx, options)

Use when you already have a `<canvas>` and its 2D context and want to draw the QR there (e.g. in a browser or Node with `canvas`).

- `ctx` `<CanvasRenderingContext2D>`: 2D context to draw into (from `canvas.getContext('2d')`).
- `options` `<FormatOptions>`: `value` (required), `error?`, `cellSize?` (margin ignored). Default cellSize 2.
- Returns: `<void>`.
- Encodes value and fills rects per module (black/white).

## Option Types

Types are exported for TypeScript: `import type { SVGOptions, FormatOptions, PathResult } from '@neabyte/qr-generator'`.

- **FormatOptions:** `value` `<string>`, `error?` `<ErrorOptions>`, `cellSize?` `<number>`, `margin?` `<number>`.
- **ErrorOptions:** `level?` `<ErrorLevel>`. **ErrorLevel:** `'L' | 'M' | 'Q' | 'H'`.
- **QRCodeOptions:** `value` `<string>`, `size` `<number>`, `error?`, `finder?` `<FinderOptions>`, `module?` `<ModuleOptions>`, `logo?` `<LogoOptions>`.
- **SVGOptions:** QRCodeOptions & `color?` `<ColorOption>`, `background?` `<string>`.
- **ColorOption:** `<string>` | **LinearGradient** | **RadialGradient**. **GradientStop:** `offset` (0–1), `color` `<string>`.
- **FinderOptions / ModuleOptions:** `shape?` `<ModuleShape>`, `gap?` `<number>`.
- **ModuleShape:** `'circle' | 'diamond' | 'rounded' | 'square' | 'shuriken' | 'star' | 'triangle'`.
- **LogoOptions:** `size?` `<number>`, `radius?` `<number>`, `text?` `<string>`, `image?` `<string>`.
- **PathResult:** `cellSize` `<number>`, `path` `<string>`.

## Reference

- [README](README.md) — Installation and quick start.
- [examples/](examples/README.md) — Runnable samples for each method and options.
- [SVG path `d` attribute](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths) — For `toPath()` output.

# Examples

Runnable snippets for each output method and main options. Output goes to `examples/out/`.

**Run from repo root:**

```bash
deno run -A examples/<name>.ts
```

Replace `<name>` with any script below (e.g. `basic-svg`, `formats`).

| File                                         | What it does                                                                       |
| :------------------------------------------- | :--------------------------------------------------------------------------------- |
| [basic-svg.ts](basic-svg.ts)                 | `toSVG()` minimal (value + size) → `basic.svg`                                     |
| [colors-full.ts](colors-full.ts)             | Solid + background, radial gradient, radial with fx/fy → 3 SVGs                    |
| [error-levels.ts](error-levels.ts)           | Error levels L, M, Q, H → `error-level-L.svg` … `error-level-H.svg`                |
| [finder-module.ts](finder-module.ts)         | Finder shape ≠ module shape (square vs circle) → `finder-module.svg`               |
| [formats.ts](formats.ts)                     | `toDataURL`, `toASCII`, `toTableTag` → log + `qr-table.html`                       |
| [logo-full.ts](logo-full.ts)                 | Logo text+size+radius, logo image (data URI), radius cutout → 3 SVGs               |
| [path-and-canvas.ts](path-and-canvas.ts)     | `toPath` → `path-only.html`; `renderToCanvas` → `canvas-qr.html` (open in browser) |
| [shapes-all.ts](shapes-all.ts)               | All 7 module shapes → `shapes-rounded.svg` … `shapes-triangle.svg`                 |
| [shapes-and-colors.ts](shapes-and-colors.ts) | Rounded/circle, linear gradient, logo text → 4 SVGs                                |

All scripts use `import QRCode from '@neabyte/qr-generator'` (resolved via `deno.json` when run locally).

## Reference

- [README.md](../README.md) — Installation and quick start.
- [USAGE.md](../USAGE.md) — Options, shapes, gradients, logo, API reference.

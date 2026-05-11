# potionn

Procedural stock video generator built with [Remotion](https://www.remotion.dev/).

Every render is driven by a numeric/string **seed**. The seed picks a colour
palette family, decides which visual layers appear (orbs, polygons,
particles, ribbons, grid), and sets the motion parameters for each one.
Same seed in → same video out. Different seeds → visually distinct videos,
so you can generate as many unique stock clips as you need without
producing near-duplicates.

## Quick start

```bash
npm install
npm run dev        # starts preview UI (http://localhost:5173) + render API (4000)
```

Open <http://localhost:5173>. You get:

- A **live preview** of the composition using `@remotion/player`.
- A big **Acak** (randomize) button — each click rolls a new seed and gives
  you a visually distinct clip. Keyboard: <kbd>R</kbd> randomize,
  <kbd>Space</kbd> play/pause.
- A **duration slider** clamped to **10–30 seconds**.
- An **Export** panel with format (MP4 H.264 / MOV ProRes HQ) and quality
  preset. Clicking "Render & download" runs the Remotion renderer on the
  Express server and streams the file back to your browser.

If you prefer the standard Remotion editor, `npm run dev:studio` still
opens Remotion Studio.

### Production build

```bash
npm run build      # vite builds the UI into dist-web/
npm run start      # Express serves the UI + render API on port 4000
```

## Rendering

The render script wraps Remotion's programmatic API and writes results to
`./out/`.

```bash
# Default: 10 second 1080p MP4 with high quality (~30MB)
npm run render

# Specific seed (reproducible)
npm run render -- --seed sunset-42

# 15 second video
npm run render -- --duration 15

# MOV (ProRes HQ) — visually lossless, large file (~150MB+ for 10s)
npm run render -- --codec mov

# Render 5 different stock videos in a row
npm run render -- --count 5

# Maximum bitrate
npm run render -- --quality max
```

### Options

| Flag | Default | Description |
|---|---|---|
| `--seed <string>` | random | PRNG seed; same seed produces the same video. |
| `--duration <seconds>` | `10` | Video length, 1–120 seconds. |
| `--codec <mp4\|mov>` | `mp4` | Container. `mov` uses ProRes HQ. |
| `--quality <low\|standard\|high\|max>` | `high` | Bitrate preset. |
| `--bitrate <e.g. 25M>` | preset | Manual video bitrate (MP4 only). |
| `--count <n>` | `1` | Render N videos with different random seeds. |
| `--out <path>` | `out/stock-<seed>.<ext>` | Custom output path (single render only). |

### File-size guarantees

The requirement is a minimum of **20 MB per video**. The render script
forces a video bitrate high enough that, at the default resolution and
duration, every output reliably clears that threshold:

| Quality | Bitrate | 10 s MP4 size (1080p) |
|---|---|---|
| `low`      | 16 Mb/s | ~20 MB |
| `standard` | 24 Mb/s | ~30 MB |
| `high`     | 32 Mb/s | ~40 MB |
| `max`      | 60 Mb/s | ~75 MB |
| `mov` (ProRes HQ) | n/a | ~150–250 MB |

If a render comes in under 20 MB (e.g. very short durations), the script
prints a warning suggesting `--quality max` or a manual `--bitrate`.

## Project layout

```
src/                        Remotion composition (rendered both in the
  Root.tsx                  Composition registry (calculateMetadata sets duration)
  StockVideo/               browser preview and the server-side render)
    index.tsx               Top-level composition wiring all layers
    schema.ts               Input props (seed, durationInSeconds)
    random.ts               Deterministic mulberry32 PRNG
    palette.ts              Procedural palette families (neon, sunset, ocean, ...)
    scene.ts                Plans every layer's parameters from a seeded RNG
    layers/
      Background.tsx        Radial / linear / conic / mesh gradients
      Orbs.tsx              Soft glowing animated orbs
      Polygons.tsx          Rotating geometric polygons
      Particles.tsx         Drifting twinkling particles
      Ribbons.tsx           Flowing sine ribbons
      Grid.tsx              Optional drifting grid
      Vignette.tsx          Edge falloff
      Noise.tsx             Film grain overlay
web/                        Vite + React preview UI
  index.html
  main.tsx
  App.tsx                   Player + Acak button + duration slider + export
  styles.css
server.mjs                  Express render API (POST /api/render → MP4/MOV)
scripts/
  render.mjs                Programmatic render CLI (still supported)
vite.config.ts              Dev server proxies /api → http://localhost:4000
```

## How variation works

`planScene(rng, width, height)` reads from a seeded PRNG and produces a
fully described scene plan: which background style, how many orbs, where
particles start, ribbon frequencies, whether a grid is shown, the
palette, the noise intensity, the camera sway. Every layer component
reads from this plan only — it does not call the RNG itself — so the
visuals are pure functions of `(seed, frame)`.

## License

UNLICENSED — private project scaffolded from `create-video`.

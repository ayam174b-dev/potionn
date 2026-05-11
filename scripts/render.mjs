#!/usr/bin/env node
/**
 * Programmatic render script for potionn stock videos.
 *
 * Usage:
 *   node scripts/render.mjs [options]
 *
 * Options:
 *   --seed <string>          PRNG seed; same seed -> identical video. Random if omitted.
 *   --duration <seconds>     Video length in seconds (default: 10, range: 1-120).
 *   --codec <mp4|mov>        Container/codec (default: mp4).
 *   --quality <low|standard|high|max>
 *                            Quality preset (default: high). Higher = bigger file.
 *   --bitrate <e.g. 25M>     Override the video bitrate (mp4 only).
 *   --out <path>             Output file path. Auto-generated if omitted.
 *   --count <n>              Render N videos with different random seeds (default 1).
 *
 * Examples:
 *   node scripts/render.mjs --seed sunset-42
 *   node scripts/render.mjs --duration 15 --codec mov
 *   node scripts/render.mjs --count 5 --quality max
 */

import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import {
  selectComposition,
  renderMedia,
  ensureBrowser,
} from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const QUALITY_PRESETS = {
  // Bitrate values chosen so that 10s at 1080p comfortably exceeds 20MB:
  // 20MB / 10s = 16 Mbit/s minimum. We add headroom for shorter clips.
  // Bitrate-based encoding (CBR-ish) is used instead of CRF so that file
  // sizes are predictable — important for guaranteeing the >=20MB floor.
  low: { bitrate: "16M" },
  standard: { bitrate: "24M" },
  high: { bitrate: "32M" },
  max: { bitrate: "60M" },
};

const parseArgs = (argv) => {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
};

const randomSeed = () => crypto.randomBytes(4).toString("hex");

const formatSize = (bytes) => {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

const renderOne = async ({
  serveUrl,
  seed,
  durationInSeconds,
  codec,
  quality,
  bitrateOverride,
  outPath,
}) => {
  const composition = await selectComposition({
    serveUrl,
    id: "StockVideo",
    inputProps: { seed, durationInSeconds },
  });

  const preset = QUALITY_PRESETS[quality];
  if (!preset) {
    throw new Error(
      `Unknown quality "${quality}". Choose one of: ${Object.keys(QUALITY_PRESETS).join(", ")}`,
    );
  }

  // For MOV we use ProRes which is intrinsically large (well above 20MB
  // for any reasonable duration). For MP4 we force a high video bitrate
  // so the resulting file reliably exceeds the 20MB minimum.
  const isMov = codec === "mov" || codec === "prores";
  const remotionCodec = isMov ? "prores" : "h264";

  await renderMedia({
    composition,
    serveUrl,
    codec: remotionCodec,
    outputLocation: outPath,
    inputProps: { seed, durationInSeconds },
    videoBitrate: isMov ? undefined : (bitrateOverride ?? preset.bitrate),
    proResProfile: isMov ? "hq" : undefined,
    pixelFormat: isMov ? "yuv422p10le" : "yuv420p",
    onProgress: ({ progress }) => {
      if (!process.stdout.isTTY) return;
      const pct = Math.round(progress * 100);
      process.stdout.write(`\r  render: ${pct}%   `);
    },
  });

  if (process.stdout.isTTY) process.stdout.write("\n");

  const stat = await fs.stat(outPath);
  return { sizeBytes: stat.size, outPath };
};

const main = async () => {
  const args = parseArgs(process.argv);
  const count = Number(args.count ?? 1);
  const baseDuration = Number(args.duration ?? 10);
  const codec = args.codec ?? "mp4";
  const quality = args.quality ?? "high";
  const bitrateOverride = typeof args.bitrate === "string" ? args.bitrate : undefined;
  const outDir = path.resolve(ROOT, "out");
  await fs.mkdir(outDir, { recursive: true });

  console.log("Bundling Remotion project...");
  const serveUrl = await bundle({
    entryPoint: path.join(ROOT, "src", "index.ts"),
    webpackOverride: (c) => c,
  });
  await ensureBrowser();

  const results = [];
  for (let i = 0; i < count; i++) {
    const seed = i === 0 && args.seed ? String(args.seed) : randomSeed();
    const ext = codec === "mov" || codec === "prores" ? "mov" : "mp4";
    const outPath =
      count === 1 && args.out
        ? path.resolve(ROOT, String(args.out))
        : path.join(outDir, `stock-${seed}.${ext}`);

    console.log(
      `\n[${i + 1}/${count}] seed="${seed}" duration=${baseDuration}s codec=${codec} quality=${quality}`,
    );
    const result = await renderOne({
      serveUrl,
      seed,
      durationInSeconds: baseDuration,
      codec,
      quality,
      bitrateOverride,
      outPath,
    });
    console.log(`  -> ${result.outPath} (${formatSize(result.sizeBytes)})`);
    results.push(result);
  }

  const undersized = results.filter((r) => r.sizeBytes < 20 * 1024 * 1024);
  if (undersized.length > 0) {
    console.warn(
      `\nWarning: ${undersized.length} render(s) came in under 20MB. ` +
        `Bump --quality to "max" or set --bitrate 40M for a guaranteed-large file.`,
    );
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

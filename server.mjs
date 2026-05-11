#!/usr/bin/env node
/**
 * Express API for rendering potionn stock videos from the preview UI.
 *
 * Exposes one POST endpoint, `/api/render`, that bundles the Remotion
 * project on first use, caches the bundle URL, and streams the rendered
 * MP4/MOV back to the browser. Quality presets mirror the CLI script so
 * that both paths produce ≥20 MB files at the default duration.
 */

import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import crypto from "node:crypto";
import express from "express";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import {
  selectComposition,
  renderMedia,
  ensureBrowser,
} from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.env.PORT ?? 4000);

// Bitrate presets matched to the CLI script so file sizes are predictable
// and reliably clear the 20 MB minimum at default duration.
const QUALITY_PRESETS = {
  low: { bitrate: "16M" },
  standard: { bitrate: "24M" },
  high: { bitrate: "32M" },
  max: { bitrate: "60M" },
};

const MIN_DURATION = 10;
const MAX_DURATION = 30;

let bundlePromise = null;
const getServeUrl = async () => {
  if (!bundlePromise) {
    console.log("[potionn] Bundling Remotion project (one-time)...");
    bundlePromise = bundle({
      entryPoint: path.join(ROOT, "src", "index.ts"),
      webpackOverride: (c) => c,
    }).then(async (url) => {
      await ensureBrowser();
      console.log("[potionn] Bundle ready:", url);
      return url;
    });
  }
  return bundlePromise;
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

const sanitizeSeed = (raw) => {
  const s = String(raw ?? "").trim();
  if (!s) return crypto.randomBytes(4).toString("hex");
  // Keep it filesystem-safe — the seed is used both as PRNG input and as
  // part of the rendered filename.
  return s.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 64);
};

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/render", async (req, res) => {
  const seed = sanitizeSeed(req.body?.seed);
  const durationInSeconds = clamp(
    Number(req.body?.durationInSeconds ?? 10),
    MIN_DURATION,
    MAX_DURATION,
  );
  const format = req.body?.format === "mov" ? "mov" : "mp4";
  const qualityKey = String(req.body?.quality ?? "high");
  const preset = QUALITY_PRESETS[qualityKey] ?? QUALITY_PRESETS.high;

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "potionn-"));
  const outPath = path.join(tmpDir, `stock-${seed}.${format}`);
  const isMov = format === "mov";
  const codec = isMov ? "prores" : "h264";

  console.log(
    `[potionn] render seed=${seed} duration=${durationInSeconds}s format=${format} quality=${qualityKey}`,
  );

  try {
    const serveUrl = await getServeUrl();
    const composition = await selectComposition({
      serveUrl,
      id: "StockVideo",
      inputProps: { seed, durationInSeconds },
    });

    await renderMedia({
      composition,
      serveUrl,
      codec,
      outputLocation: outPath,
      inputProps: { seed, durationInSeconds },
      videoBitrate: isMov ? undefined : preset.bitrate,
      proResProfile: isMov ? "hq" : undefined,
      pixelFormat: isMov ? "yuv422p10le" : "yuv420p",
    });

    const stat = await fsp.stat(outPath);
    const filename = `potionn-${seed}-${durationInSeconds}s.${format}`;
    res.setHeader("Content-Type", isMov ? "video/quicktime" : "video/mp4");
    res.setHeader("Content-Length", String(stat.size));
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("X-Potionn-Size-Bytes", String(stat.size));
    res.setHeader("X-Potionn-Seed", seed);

    const stream = fs.createReadStream(outPath);
    stream.pipe(res);
    stream.on("close", async () => {
      try {
        await fsp.rm(tmpDir, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup; ignore.
      }
    });
  } catch (err) {
    console.error("[potionn] render error", err);
    try {
      await fsp.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
    if (!res.headersSent) {
      res
        .status(500)
        .type("text/plain")
        .send(err instanceof Error ? err.message : String(err));
    } else {
      res.end();
    }
  }
});

// In production, also serve the built UI from dist-web/.
const distDir = path.join(ROOT, "dist-web");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`[potionn] API listening on http://localhost:${PORT}`);
  if (fs.existsSync(distDir)) {
    console.log(`[potionn] Serving built UI from ${distDir}`);
  } else {
    console.log("[potionn] (dev) UI served by Vite at http://localhost:5173");
  }
  // Kick off the bundle eagerly so the first render isn't blocked on it.
  getServeUrl().catch((err) => {
    console.warn("[potionn] eager bundle failed:", err.message);
    bundlePromise = null;
  });
});

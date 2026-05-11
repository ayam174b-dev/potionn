import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { createRng } from "./random";
import { planScene } from "./scene";
import { Background } from "./layers/Background";
import { Orbs } from "./layers/Orbs";
import { Polygons } from "./layers/Polygons";
import { Particles } from "./layers/Particles";
import { Ribbons } from "./layers/Ribbons";
import { Grid } from "./layers/Grid";
import { LightRays } from "./layers/LightRays";
import { Metaballs } from "./layers/Metaballs";
import { Vignette } from "./layers/Vignette";
import { Noise } from "./layers/Noise";
import type { StockVideoProps } from "./schema";

const EASE = Easing.bezier(0.4, 0, 0.2, 1);

export const StockVideo: React.FC<StockVideoProps> = ({ seed, plan: providedPlan }) => {
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // Two ways to render: from a seed (procedural) or from an explicit
  // scene plan (editor-edited). An explicit plan always wins so that the
  // shape editor's edits are honoured byte-for-byte.
  const plan = useMemo(
    () => providedPlan ?? planScene(createRng(seed), width, height),
    [providedPlan, seed, width, height],
  );

  const t = frame / fps;
  const longSide = Math.max(width, height);

  // ── Cinematic camera ────────────────────────────────────────────────
  // Slow zoom + pan + a touch of tilt, all eased so the motion never
  // looks linear or robotic. Replaces the basic sinusoidal "sway" from
  // the previous version.
  const cam = plan.camera;
  const camProgress = interpolate(
    frame,
    [0, Math.max(1, durationInFrames - 1)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE },
  );
  const camScale =
    cam.baseScale + cam.direction * cam.zoomDelta * camProgress;
  const camTx = cam.panX * longSide * camProgress;
  const camTy = cam.panY * longSide * camProgress;
  const camTilt = cam.tilt * camProgress;

  // ── Reveal opener and closer ───────────────────────────────────────
  // Fade + slight scale-in in the first second; quick fade-out in the
  // final half-second. This is what gives every clip a proper "opener
  // → body → closer" shape and reads as professional stock footage.
  const inProgress = interpolate(
    frame,
    [0, plan.reveal.inFrames],
    [0, 1],
    { extrapolateRight: "clamp", easing: EASE },
  );
  const outStart = Math.max(0, durationInFrames - plan.reveal.outFrames);
  const outProgress = interpolate(
    frame,
    [outStart, durationInFrames - 1],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE },
  );
  const revealScale = interpolate(
    inProgress,
    [0, 1],
    [plan.reveal.inStartScale, 1],
  );
  const opacity = Math.min(inProgress, 1 - outProgress);

  // ── Palette evolution ───────────────────────────────────────────────
  // Apply a slow hue rotation across the whole clip; the colour family
  // remains coherent (still "neon", "ocean", etc.) but the exact hue at
  // the start and end of the clip are noticeably different. A small
  // saturation pulse adds breathing life on top.
  const hueDeg = interpolate(camProgress, [0, 1], [0, plan.evolution.hueShiftDeg]);
  const satPulse =
    1 +
    plan.evolution.saturationPulse *
      Math.sin(t * 0.6) *
      (1 - Math.abs(camProgress - 0.5) * 2);

  const cameraTransform = `translate(${camTx.toFixed(2)}px, ${camTy.toFixed(2)}px) scale(${camScale.toFixed(4)}) rotate(${camTilt.toFixed(4)}rad)`;
  const revealTransform = `scale(${revealScale.toFixed(4)})`;

  // ── Bloom filter (SVG, applied to the layer stack via CSS filter) ─
  const bloomId = "stockvideo-bloom";
  const bloom = plan.bloom;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: plan.palette.background[1],
        overflow: "hidden",
      }}
    >
      {/* SVG filter definitions — invisible, used by `filter: url(...)` below. */}
      <svg
        style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
        aria-hidden
      >
        <defs>
          <filter id={bloomId} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={bloom.blur}
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values={`${bloom.brightness} 0 0 0 0
                       0 ${bloom.brightness} 0 0 0
                       0 0 ${bloom.brightness} 0 0
                       0 0 0 ${bloom.intensity} 0`}
              result="brightBlur"
            />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="brightBlur" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <AbsoluteFill
        style={{
          transform: revealTransform,
          opacity,
          filter: `hue-rotate(${hueDeg.toFixed(2)}deg) saturate(${satPulse.toFixed(3)})`,
          transformOrigin: "50% 50%",
        }}
      >
        <AbsoluteFill
          style={{
            transform: cameraTransform,
            transformOrigin: "50% 50%",
          }}
        >
          {/* Background runs outside the bloom group so its dark gradient
              isn't washed out by the glow halo. */}
          <Background plan={plan} width={width} height={height} fps={fps} />

          <AbsoluteFill style={{ filter: `url(#${bloomId})` }}>
            <Metaballs plan={plan} width={width} height={height} fps={fps} />
            <LightRays plan={plan} width={width} height={height} fps={fps} />
            <Ribbons plan={plan} width={width} height={height} fps={fps} />
            <Orbs plan={plan} fps={fps} />
            <Polygons plan={plan} width={width} height={height} fps={fps} />
            <Particles plan={plan} width={width} height={height} fps={fps} />
            <Grid plan={plan} fps={fps} />
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>

      <Noise intensity={plan.noise.intensity} scale={plan.noise.scale} />
      <Vignette intensity={plan.vignette} />
    </AbsoluteFill>
  );
};

/**
 * Scene planner.
 *
 * Reads a seeded RNG and produces a fully described "scene plan" — a
 * plain-data structure that drives every visual layer. Keeping the plan
 * separate from rendering lets us iterate on visuals deterministically:
 * the same seed always yields the same plan, but every seed yields a
 * different one.
 */

import type { Rng } from "./random";
import { createPalette, type Palette } from "./palette";

export type BackgroundStyle = "radial" | "linear" | "conic" | "mesh";

export type OrbConfig = {
  cx: number;
  cy: number;
  radius: number;
  driftX: number;
  driftY: number;
  phaseX: number;
  phaseY: number;
  color: string;
  speed: number;
  blur: number;
  opacity: number;
};

export type PolygonConfig = {
  sides: number;
  cx: number;
  cy: number;
  radius: number;
  rotationSpeed: number;
  startRotation: number;
  color: string;
  strokeWidth: number;
  opacity: number;
};

export type ParticleConfig = {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  color: string;
  blur: number;
  twinkleSpeed: number;
  twinklePhase: number;
};

export type RibbonConfig = {
  amplitude: number;
  frequency: number;
  phase: number;
  speed: number;
  thickness: number;
  yCenter: number;
  color: string;
  opacity: number;
};

export type GridConfig = {
  cellSize: number;
  rotation: number;
  driftSpeed: number;
  color: string;
  opacity: number;
  pulseSpeed: number;
};

export type ScenePlan = {
  palette: Palette;
  background: {
    style: BackgroundStyle;
    angle: number;
    stops: number;
  };
  orbs: OrbConfig[];
  polygons: PolygonConfig[];
  particles: ParticleConfig[];
  ribbons: RibbonConfig[];
  grid: GridConfig | null;
  noise: {
    intensity: number;
    scale: number;
  };
  vignette: number;
  cameraSway: {
    amplitude: number;
    frequency: number;
  };
};

export const planScene = (rng: Rng, width: number, height: number): ScenePlan => {
  const palette = createPalette(rng.fork("palette"));
  const longSide = Math.max(width, height);

  const bgRng = rng.fork("background");
  const background = {
    style: bgRng.pick<BackgroundStyle>(["radial", "linear", "conic", "mesh"]),
    angle: bgRng.range(0, 360),
    stops: bgRng.int(2, 4),
  };

  const orbRng = rng.fork("orbs");
  const orbCount = orbRng.int(4, 9);
  const orbs: OrbConfig[] = [];
  for (let i = 0; i < orbCount; i++) {
    orbs.push({
      cx: orbRng.range(0.1, 0.9) * width,
      cy: orbRng.range(0.1, 0.9) * height,
      radius: orbRng.range(0.12, 0.32) * longSide,
      driftX: orbRng.range(0.05, 0.18) * width,
      driftY: orbRng.range(0.05, 0.18) * height,
      phaseX: orbRng.range(0, Math.PI * 2),
      phaseY: orbRng.range(0, Math.PI * 2),
      color: orbRng.pick(palette.accents),
      speed: orbRng.range(0.3, 1.1),
      blur: orbRng.range(40, 120),
      opacity: orbRng.range(0.45, 0.85),
    });
  }

  const polyRng = rng.fork("polygons");
  const polygonCount = polyRng.bool(0.7) ? polyRng.int(2, 6) : 0;
  const polygons: PolygonConfig[] = [];
  for (let i = 0; i < polygonCount; i++) {
    polygons.push({
      sides: polyRng.int(3, 8),
      cx: polyRng.range(0.15, 0.85) * width,
      cy: polyRng.range(0.15, 0.85) * height,
      radius: polyRng.range(0.06, 0.22) * longSide,
      rotationSpeed: polyRng.range(-0.6, 0.6),
      startRotation: polyRng.range(0, Math.PI * 2),
      color: polyRng.pick(palette.accents),
      strokeWidth: polyRng.range(2, 6),
      opacity: polyRng.range(0.4, 0.9),
    });
  }

  const particleRng = rng.fork("particles");
  const particleCount = particleRng.int(80, 220);
  const particles: ParticleConfig[] = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: particleRng.range(0, 1) * width,
      y: particleRng.range(0, 1) * height,
      size: particleRng.range(1.5, 5),
      speed: particleRng.range(0.05, 0.35),
      angle: particleRng.range(0, Math.PI * 2),
      color: particleRng.pick(palette.accents),
      blur: particleRng.range(0, 4),
      twinkleSpeed: particleRng.range(0.8, 3),
      twinklePhase: particleRng.range(0, Math.PI * 2),
    });
  }

  const ribbonRng = rng.fork("ribbons");
  const ribbonCount = ribbonRng.bool(0.6) ? ribbonRng.int(1, 4) : 0;
  const ribbons: RibbonConfig[] = [];
  for (let i = 0; i < ribbonCount; i++) {
    ribbons.push({
      amplitude: ribbonRng.range(0.05, 0.18) * height,
      frequency: ribbonRng.range(0.8, 2.5),
      phase: ribbonRng.range(0, Math.PI * 2),
      speed: ribbonRng.range(0.4, 1.4) * (ribbonRng.bool() ? 1 : -1),
      thickness: ribbonRng.range(2, 8),
      yCenter: ribbonRng.range(0.2, 0.8) * height,
      color: ribbonRng.pick(palette.accents),
      opacity: ribbonRng.range(0.3, 0.7),
    });
  }

  const gridRng = rng.fork("grid");
  const grid: GridConfig | null = gridRng.bool(0.45)
    ? {
        cellSize: gridRng.range(60, 140),
        rotation: gridRng.range(-0.3, 0.3),
        driftSpeed: gridRng.range(0.2, 0.8),
        color: gridRng.pick(palette.accents),
        opacity: gridRng.range(0.05, 0.18),
        pulseSpeed: gridRng.range(0.5, 1.5),
      }
    : null;

  return {
    palette,
    background,
    orbs,
    polygons,
    particles,
    ribbons,
    grid,
    noise: {
      intensity: rng.range(0.02, 0.06),
      scale: rng.range(1.2, 2.4),
    },
    vignette: rng.range(0.25, 0.55),
    cameraSway: {
      amplitude: rng.range(4, 14),
      frequency: rng.range(0.3, 0.8),
    },
  };
};

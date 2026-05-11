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
  color: string;
  blur: number;
  twinkleSpeed: number;
  twinklePhase: number;
  // Personal offset into the shared flowfield, so two particles starting at
  // the same place still drift apart.
  fieldOffset: number;
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

export type LightRaysConfig = {
  // Origin of the rays expressed in normalised 0-1 space (off-screen origins
  // — e.g. cx < 0 or > 1 — feel more cinematic).
  cx: number;
  cy: number;
  count: number;
  spreadDeg: number;
  baseAngleDeg: number;
  rotateSpeed: number;
  beamWidth: number;
  length: number;
  color: string;
  opacity: number;
  pulseSpeed: number;
  blur: number;
};

export type MetaballConfig = {
  cx: number;
  cy: number;
  radius: number;
  driftX: number;
  driftY: number;
  phaseX: number;
  phaseY: number;
  speed: number;
};

export type MetaballsPlan = {
  color: string;
  threshold: number;
  blur: number;
  balls: MetaballConfig[];
};

export type FlowfieldConfig = {
  // Spatial scale of the value-noise field. Larger = smoother, broader swirls.
  scale: number;
  // How aggressively a particle is pulled along the field direction.
  strength: number;
  // Time evolution of the field — makes the field itself "breathe".
  timeDrift: number;
};

export type CameraConfig = {
  // Base scale held throughout the clip.
  baseScale: number;
  // How much the scale ramps from start to end.
  zoomDelta: number;
  // Pan in normalised units of the longest side.
  panX: number;
  panY: number;
  // Subtle tilt in radians applied uniformly.
  tilt: number;
  // Direction in which `zoomDelta` is applied: 1 = push in, -1 = pull out.
  direction: 1 | -1;
};

export type RevealConfig = {
  // Opener (0..1 progress through the first second(ish)).
  inFrames: number;
  inStartScale: number;
  // Closer (last few frames).
  outFrames: number;
};

export type EvolutionConfig = {
  // Total hue rotation in degrees across the entire clip.
  hueShiftDeg: number;
  // Saturation pulse depth (0 = none, 0.1 = ±10%).
  saturationPulse: number;
};

export type BloomConfig = {
  // Bloom blur radius in CSS pixels (used by feGaussianBlur stdDeviation).
  blur: number;
  // Brightness multiplier applied to the blurred copy. Values >1 brighten
  // the glow; <1 leave the image untouched but blurred.
  brightness: number;
  // 0..1, opacity of the glow halo composed on top of the source.
  intensity: number;
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
  lightRays: LightRaysConfig | null;
  metaballs: MetaballsPlan | null;
  noise: {
    intensity: number;
    scale: number;
  };
  vignette: number;
  flowfield: FlowfieldConfig;
  camera: CameraConfig;
  reveal: RevealConfig;
  evolution: EvolutionConfig;
  bloom: BloomConfig;
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
  const polygonCount = polyRng.bool(0.65) ? polyRng.int(2, 6) : 0;
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
  // Trailed particles are visually denser than the old straight dots, so we
  // ship a slightly lower headcount to keep the composition readable and the
  // SVG layer cheap.
  const particleCount = particleRng.int(60, 140);
  const particles: ParticleConfig[] = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: particleRng.range(0, 1) * width,
      y: particleRng.range(0, 1) * height,
      size: particleRng.range(1.5, 5),
      speed: particleRng.range(0.4, 1.4),
      color: particleRng.pick(palette.accents),
      blur: particleRng.range(0, 4),
      twinkleSpeed: particleRng.range(0.8, 3),
      twinklePhase: particleRng.range(0, Math.PI * 2),
      fieldOffset: particleRng.range(0, 1000),
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

  const rayRng = rng.fork("rays");
  const lightRays: LightRaysConfig | null = rayRng.bool(0.7)
    ? {
        // Pick an off-screen corner so the rays sweep diagonally across frame.
        cx: rayRng.pick([-0.15, -0.05, 1.05, 1.15]),
        cy: rayRng.pick([-0.15, -0.05, 1.05, 1.15]),
        count: rayRng.int(3, 6),
        spreadDeg: rayRng.range(35, 70),
        baseAngleDeg: rayRng.range(0, 360),
        rotateSpeed: rayRng.range(-3, 3),
        beamWidth: rayRng.range(0.08, 0.18),
        length: rayRng.range(1.4, 2.0),
        color: rayRng.pick(palette.accents),
        opacity: rayRng.range(0.18, 0.42),
        pulseSpeed: rayRng.range(0.4, 1.2),
        blur: rayRng.range(20, 60),
      }
    : null;

  const ballRng = rng.fork("metaballs");
  // Metaballs are visually dominant — only show them ~1 clip in 3 to keep
  // the catalogue varied. When present they have moderate threshold so
  // they read as soft liquid rather than hard cut-outs.
  const metaballs: MetaballsPlan | null = ballRng.bool(0.35)
    ? (() => {
        const count = ballRng.int(2, 5);
        const balls: MetaballConfig[] = [];
        for (let i = 0; i < count; i++) {
          balls.push({
            cx: ballRng.range(0.2, 0.8) * width,
            cy: ballRng.range(0.2, 0.8) * height,
            radius: ballRng.range(0.05, 0.11) * longSide,
            driftX: ballRng.range(0.08, 0.22) * width,
            driftY: ballRng.range(0.06, 0.18) * height,
            phaseX: ballRng.range(0, Math.PI * 2),
            phaseY: ballRng.range(0, Math.PI * 2),
            speed: ballRng.range(0.25, 0.7),
          });
        }
        return {
          color: ballRng.pick(palette.accents),
          threshold: ballRng.range(10, 16),
          blur: ballRng.range(22, 38),
          balls,
        };
      })()
    : null;

  const fieldRng = rng.fork("flowfield");
  const flowfield: FlowfieldConfig = {
    scale: fieldRng.range(0.0009, 0.0022),
    strength: fieldRng.range(70, 160),
    timeDrift: fieldRng.range(0.05, 0.2),
  };

  const camRng = rng.fork("camera");
  const camera: CameraConfig = {
    baseScale: 1.06,
    zoomDelta: camRng.range(0.05, 0.12),
    panX: camRng.range(-0.04, 0.04),
    panY: camRng.range(-0.03, 0.03),
    tilt: camRng.range(-0.012, 0.012),
    direction: camRng.bool(0.55) ? 1 : -1,
  };

  const reveal: RevealConfig = {
    inFrames: 30,
    inStartScale: 1.04,
    outFrames: 15,
  };

  const evoRng = rng.fork("evolution");
  const evolution: EvolutionConfig = {
    hueShiftDeg: evoRng.range(-15, 15),
    saturationPulse: evoRng.range(0.04, 0.1),
  };

  const bloomRng = rng.fork("bloom");
  const bloom: BloomConfig = {
    blur: bloomRng.range(5, 12),
    brightness: bloomRng.range(1.25, 1.6),
    intensity: bloomRng.range(0.7, 1.0),
  };

  return {
    palette,
    background,
    orbs,
    polygons,
    particles,
    ribbons,
    grid,
    lightRays,
    metaballs,
    noise: {
      intensity: rng.range(0.02, 0.06),
      scale: rng.range(1.2, 2.4),
    },
    vignette: rng.range(0.25, 0.55),
    flowfield,
    camera,
    reveal,
    evolution,
    bloom,
  };
};

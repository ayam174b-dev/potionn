/**
 * Immutable scene-plan editing utilities for the in-browser shape editor.
 *
 * Every public function returns a new `ScenePlan` rather than mutating the
 * input. The functions are deliberately small (one operation each) so the
 * UI reducer in `App.tsx` can stay a single straight-through dispatch.
 */

import type {
  ScenePlan,
  OrbConfig,
  PolygonConfig,
  RibbonConfig,
  MetaballConfig,
  MetaballsPlan,
  LightRaysConfig,
} from "../src/StockVideo/scene";

export type ShapeCategory =
  | "orbs"
  | "polygons"
  | "ribbons"
  | "metaballs"
  | "lightRays"
  | "grid";

const cloneShallow = <T>(v: T): T => ({ ...(v as object) }) as T;

// ── per-shape patch helpers ────────────────────────────────────────────

export const patchOrb = (
  plan: ScenePlan,
  index: number,
  patch: Partial<OrbConfig>,
): ScenePlan => {
  const orbs = plan.orbs.slice();
  if (orbs[index]) orbs[index] = { ...orbs[index], ...patch };
  return { ...plan, orbs };
};

export const patchPolygon = (
  plan: ScenePlan,
  index: number,
  patch: Partial<PolygonConfig>,
): ScenePlan => {
  const polygons = plan.polygons.slice();
  if (polygons[index]) polygons[index] = { ...polygons[index], ...patch };
  return { ...plan, polygons };
};

export const patchRibbon = (
  plan: ScenePlan,
  index: number,
  patch: Partial<RibbonConfig>,
): ScenePlan => {
  const ribbons = plan.ribbons.slice();
  if (ribbons[index]) ribbons[index] = { ...ribbons[index], ...patch };
  return { ...plan, ribbons };
};

export const patchMetaball = (
  plan: ScenePlan,
  index: number,
  patch: Partial<MetaballConfig>,
): ScenePlan => {
  if (!plan.metaballs) return plan;
  const balls = plan.metaballs.balls.slice();
  if (balls[index]) balls[index] = { ...balls[index], ...patch };
  return { ...plan, metaballs: { ...plan.metaballs, balls } };
};

export const patchMetaballsRoot = (
  plan: ScenePlan,
  patch: Partial<Omit<MetaballsPlan, "balls">>,
): ScenePlan => {
  if (!plan.metaballs) return plan;
  return { ...plan, metaballs: { ...plan.metaballs, ...patch } };
};

export const patchLightRays = (
  plan: ScenePlan,
  patch: Partial<LightRaysConfig>,
): ScenePlan => {
  if (!plan.lightRays) return plan;
  return { ...plan, lightRays: { ...plan.lightRays, ...patch } };
};

// ── add / delete / duplicate ──────────────────────────────────────────

export const deleteShape = (
  plan: ScenePlan,
  cat: ShapeCategory,
  index: number,
): ScenePlan => {
  switch (cat) {
    case "orbs":
      return { ...plan, orbs: plan.orbs.filter((_, i) => i !== index) };
    case "polygons":
      return { ...plan, polygons: plan.polygons.filter((_, i) => i !== index) };
    case "ribbons":
      return { ...plan, ribbons: plan.ribbons.filter((_, i) => i !== index) };
    case "metaballs": {
      if (!plan.metaballs) return plan;
      return {
        ...plan,
        metaballs: {
          ...plan.metaballs,
          balls: plan.metaballs.balls.filter((_, i) => i !== index),
        },
      };
    }
    default:
      return plan;
  }
};

export const duplicateShape = (
  plan: ScenePlan,
  cat: ShapeCategory,
  index: number,
): ScenePlan => {
  switch (cat) {
    case "orbs": {
      const src = plan.orbs[index];
      if (!src) return plan;
      const copy: OrbConfig = {
        ...src,
        cx: src.cx + 60,
        cy: src.cy + 40,
        hidden: false,
      };
      return { ...plan, orbs: [...plan.orbs, copy] };
    }
    case "polygons": {
      const src = plan.polygons[index];
      if (!src) return plan;
      const copy: PolygonConfig = {
        ...src,
        cx: src.cx + 60,
        cy: src.cy + 40,
        hidden: false,
      };
      return { ...plan, polygons: [...plan.polygons, copy] };
    }
    case "ribbons": {
      const src = plan.ribbons[index];
      if (!src) return plan;
      const copy: RibbonConfig = {
        ...src,
        yCenter: src.yCenter + 60,
        phase: src.phase + 0.7,
        hidden: false,
      };
      return { ...plan, ribbons: [...plan.ribbons, copy] };
    }
    case "metaballs": {
      if (!plan.metaballs) return plan;
      const src = plan.metaballs.balls[index];
      if (!src) return plan;
      const copy: MetaballConfig = {
        ...src,
        cx: src.cx + 60,
        cy: src.cy + 40,
        hidden: false,
      };
      return {
        ...plan,
        metaballs: { ...plan.metaballs, balls: [...plan.metaballs.balls, copy] },
      };
    }
    default:
      return plan;
  }
};

export const toggleHidden = (
  plan: ScenePlan,
  cat: ShapeCategory,
  index: number,
): ScenePlan => {
  switch (cat) {
    case "orbs": {
      const orbs = plan.orbs.slice();
      if (orbs[index]) orbs[index] = { ...orbs[index], hidden: !orbs[index].hidden };
      return { ...plan, orbs };
    }
    case "polygons": {
      const polygons = plan.polygons.slice();
      if (polygons[index])
        polygons[index] = { ...polygons[index], hidden: !polygons[index].hidden };
      return { ...plan, polygons };
    }
    case "ribbons": {
      const ribbons = plan.ribbons.slice();
      if (ribbons[index])
        ribbons[index] = { ...ribbons[index], hidden: !ribbons[index].hidden };
      return { ...plan, ribbons };
    }
    case "metaballs": {
      // index = -1 toggles the whole metaballs root; >=0 toggles a single ball.
      if (!plan.metaballs) return plan;
      if (index < 0) {
        return {
          ...plan,
          metaballs: { ...plan.metaballs, hidden: !plan.metaballs.hidden },
        };
      }
      const balls = plan.metaballs.balls.slice();
      if (balls[index])
        balls[index] = { ...balls[index], hidden: !balls[index].hidden };
      return { ...plan, metaballs: { ...plan.metaballs, balls } };
    }
    case "lightRays": {
      if (!plan.lightRays) return plan;
      return {
        ...plan,
        lightRays: { ...plan.lightRays, hidden: !plan.lightRays.hidden },
      };
    }
    case "grid": {
      if (!plan.grid) return plan;
      return { ...plan, grid: { ...plan.grid, hidden: !plan.grid.hidden } };
    }
  }
};

// ── add new shape with sensible defaults ───────────────────────────────

const pickPaletteColor = (plan: ScenePlan): string =>
  plan.palette.accents[
    Math.floor(rand() * plan.palette.accents.length)
  ] ?? plan.palette.accents[0] ?? "#7c5cff";

// Math.random() is a perfectly valid source of jitter for *new* shapes
// added via the editor — these helpers only run in response to user
// clicks in the browser, never inside a Remotion render frame. The
// rendered video sees the resulting plan as plain data with no randomness.
const rand = (): number => Math.random(); // eslint-disable-line @remotion/deterministic-randomness

export const addOrb = (plan: ScenePlan, width: number, height: number): ScenePlan => {
  const longSide = Math.max(width, height);
  const orb: OrbConfig = {
    cx: width * 0.5,
    cy: height * 0.5,
    radius: longSide * 0.18,
    driftX: width * 0.1,
    driftY: height * 0.08,
    phaseX: rand() * Math.PI * 2,
    phaseY: rand() * Math.PI * 2,
    color: pickPaletteColor(plan),
    speed: 0.6,
    blur: 70,
    opacity: 0.7,
  };
  return { ...plan, orbs: [...plan.orbs, orb] };
};

export const addPolygon = (
  plan: ScenePlan,
  width: number,
  height: number,
): ScenePlan => {
  const longSide = Math.max(width, height);
  const poly: PolygonConfig = {
    sides: 6,
    cx: width * 0.5,
    cy: height * 0.5,
    radius: longSide * 0.12,
    rotationSpeed: 0.3,
    startRotation: 0,
    color: pickPaletteColor(plan),
    strokeWidth: 4,
    opacity: 0.7,
  };
  return { ...plan, polygons: [...plan.polygons, poly] };
};

export const addRibbon = (plan: ScenePlan, height: number): ScenePlan => {
  const ribbon: RibbonConfig = {
    amplitude: height * 0.1,
    frequency: 1.5,
    phase: rand() * Math.PI * 2,
    speed: 0.8,
    thickness: 4,
    yCenter: height * 0.5,
    color: pickPaletteColor(plan),
    opacity: 0.5,
  };
  return { ...plan, ribbons: [...plan.ribbons, ribbon] };
};

export const addMetaball = (
  plan: ScenePlan,
  width: number,
  height: number,
): ScenePlan => {
  const longSide = Math.max(width, height);
  const ball: MetaballConfig = {
    cx: width * 0.5,
    cy: height * 0.5,
    radius: longSide * 0.08,
    driftX: width * 0.14,
    driftY: height * 0.12,
    phaseX: rand() * Math.PI * 2,
    phaseY: rand() * Math.PI * 2,
    speed: 0.45,
  };
  // If metaballs isn't enabled yet, create a default root so the user
  // can add their first one without rolling a new seed.
  if (!plan.metaballs) {
    const root: MetaballsPlan = {
      color: pickPaletteColor(plan),
      threshold: 13,
      blur: 28,
      balls: [ball],
    };
    return { ...plan, metaballs: root };
  }
  return {
    ...plan,
    metaballs: {
      ...plan.metaballs,
      balls: [...plan.metaballs.balls, ball],
      hidden: false,
    },
  };
};

export const ensureLightRays = (plan: ScenePlan): ScenePlan => {
  if (plan.lightRays) {
    return cloneShallow(plan); // no-op but mark dirty by returning new object
  }
  const cfg: LightRaysConfig = {
    cx: -0.05,
    cy: -0.05,
    count: 4,
    spreadDeg: 50,
    baseAngleDeg: 35,
    rotateSpeed: 1,
    beamWidth: 0.12,
    length: 1.7,
    color: pickPaletteColor(plan),
    opacity: 0.3,
    pulseSpeed: 0.7,
    blur: 40,
  };
  return { ...plan, lightRays: cfg };
};

export const ensureMetaballs = (
  plan: ScenePlan,
  width: number,
  height: number,
): ScenePlan => {
  if (plan.metaballs) return cloneShallow(plan);
  return addMetaball(plan, width, height);
};

export const ensureGrid = (plan: ScenePlan): ScenePlan => {
  if (plan.grid) return cloneShallow(plan);
  return {
    ...plan,
    grid: {
      cellSize: 90,
      rotation: 0,
      driftSpeed: 0.5,
      color: pickPaletteColor(plan),
      opacity: 0.1,
      pulseSpeed: 1,
    },
  };
};

// ── colour conversion helpers (hsla/hex bridges for native colour input) ──

const parseHslaTriplet = (
  color: string,
): { h: number; s: number; l: number } | null => {
  const m = color.match(
    /^hsla?\(\s*([\d.+-]+)\s*,\s*([\d.+-]+)%\s*,\s*([\d.+-]+)%/i,
  );
  if (!m) return null;
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) };
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = lig - c / 2;
  return [r + m, g + m, b + m];
};

const toHex2 = (v: number): string =>
  Math.round(Math.max(0, Math.min(1, v)) * 255)
    .toString(16)
    .padStart(2, "0");

export const colorToHex = (color: string): string => {
  if (color.startsWith("#")) {
    if (color.length === 7) return color;
    if (color.length === 4) {
      return (
        "#" +
        color[1] +
        color[1] +
        color[2] +
        color[2] +
        color[3] +
        color[3]
      );
    }
  }
  const hsl = parseHslaTriplet(color);
  if (!hsl) return "#888888";
  const [r, g, b] = hslToRgb(hsl.h, hsl.s, hsl.l);
  return "#" + toHex2(r) + toHex2(g) + toHex2(b);
};

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
};

const rgbToHsl = (
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      break;
    case g:
      h = ((b - r) / d + 2) * 60;
      break;
    default:
      h = ((r - g) / d + 4) * 60;
      break;
  }
  return { h, s: s * 100, l: l * 100 };
};

export const hexToHsla = (hex: string, alpha = 1): string => {
  const [r, g, b] = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  return `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${alpha})`;
};

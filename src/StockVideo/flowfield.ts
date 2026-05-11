/**
 * Lightweight 2D value-noise based flow field.
 *
 * Real Perlin noise is gratuitous overkill for our needs — we just want a
 * smoothly varying scalar over (x, y, t) that we can read as an angle to
 * push particles along. Value-noise on an integer lattice with cosine
 * interpolation gives that for ~10 lines of code and is fully
 * deterministic given a numeric seed.
 *
 * Output: `sampleAngle(x, y, t)` returns an angle in radians that smoothly
 * changes as you move through space and time. Two nearby particles
 * therefore drift in nearby directions — visually, you get coherent
 * swarms instead of independent random walks.
 */

const hash2 = (ix: number, iy: number, seed: number): number => {
  let h = (ix * 73856093) ^ (iy * 19349663) ^ (seed * 83492791);
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
};

const smooth = (t: number): number => t * t * (3 - 2 * t);

const valueNoise2D = (x: number, y: number, seed: number): number => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const v00 = hash2(ix, iy, seed);
  const v10 = hash2(ix + 1, iy, seed);
  const v01 = hash2(ix, iy + 1, seed);
  const v11 = hash2(ix + 1, iy + 1, seed);

  const ux = smooth(fx);
  const uy = smooth(fy);

  const a = v00 + (v10 - v00) * ux;
  const b = v01 + (v11 - v01) * ux;
  return a + (b - a) * uy;
};

export type FlowfieldSampler = (x: number, y: number, t: number) => number;

/**
 * Build a deterministic flow field sampler. Returns an angle (radians) at
 * any (x, y, t). `scale` controls the spatial frequency of the field —
 * smaller values give broader, smoother swirls.
 */
export const buildFlowfield = (
  seed: number,
  scale: number,
  timeDrift: number,
): FlowfieldSampler => {
  return (x: number, y: number, t: number) => {
    // The Z dimension is folded into the lattice by sliding the lookup
    // coordinates over time. Cheaper than 3D noise and looks identical to
    // the eye.
    const sx = x * scale + Math.sin(t * timeDrift) * 0.7;
    const sy = y * scale + Math.cos(t * timeDrift * 1.13) * 0.7;
    const n = valueNoise2D(sx, sy, seed);
    // Map 0..1 → 0..τ and pad by a constant offset so seeds with similar
    // hashes don't all start moving in the same direction.
    return n * Math.PI * 2 * 1.3;
  };
};

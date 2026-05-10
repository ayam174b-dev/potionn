/**
 * Procedural palette generation.
 *
 * Each render seed produces a coherent palette drawn from a randomly
 * selected mood family (e.g. neon, sunset, ocean) and then perturbed
 * with the PRNG so that no two seeds yield identical colors.
 */

import type { Rng } from "./random";

export type Palette = {
  name: string;
  background: [string, string];
  accents: string[];
  glow: string;
};

type PaletteFamily = {
  name: string;
  hueBase: number;
  hueSpread: number;
  saturation: [number, number];
  lightness: [number, number];
  backgroundLightness: [number, number];
};

const FAMILIES: PaletteFamily[] = [
  {
    name: "neon",
    hueBase: 280,
    hueSpread: 80,
    saturation: [85, 100],
    lightness: [55, 72],
    backgroundLightness: [6, 14],
  },
  {
    name: "sunset",
    hueBase: 18,
    hueSpread: 40,
    saturation: [75, 95],
    lightness: [55, 70],
    backgroundLightness: [12, 22],
  },
  {
    name: "ocean",
    hueBase: 200,
    hueSpread: 50,
    saturation: [60, 90],
    lightness: [45, 65],
    backgroundLightness: [8, 18],
  },
  {
    name: "forest",
    hueBase: 130,
    hueSpread: 60,
    saturation: [45, 80],
    lightness: [40, 65],
    backgroundLightness: [8, 16],
  },
  {
    name: "candy",
    hueBase: 330,
    hueSpread: 70,
    saturation: [70, 95],
    lightness: [60, 78],
    backgroundLightness: [14, 24],
  },
  {
    name: "amber",
    hueBase: 42,
    hueSpread: 35,
    saturation: [70, 95],
    lightness: [55, 72],
    backgroundLightness: [10, 18],
  },
  {
    name: "violet",
    hueBase: 260,
    hueSpread: 50,
    saturation: [70, 95],
    lightness: [55, 72],
    backgroundLightness: [8, 18],
  },
  {
    name: "mono-warm",
    hueBase: 30,
    hueSpread: 20,
    saturation: [25, 55],
    lightness: [50, 75],
    backgroundLightness: [10, 20],
  },
  {
    name: "mono-cool",
    hueBase: 220,
    hueSpread: 25,
    saturation: [25, 55],
    lightness: [50, 75],
    backgroundLightness: [8, 16],
  },
];

const hsl = (h: number, s: number, l: number, a = 1): string =>
  `hsla(${((h % 360) + 360) % 360}, ${s}%, ${l}%, ${a})`;

export const createPalette = (rng: Rng): Palette => {
  const family = rng.pick(FAMILIES);
  const baseHue = family.hueBase + rng.range(-15, 15);
  const accentCount = rng.int(3, 5);
  const accents: string[] = [];
  for (let i = 0; i < accentCount; i++) {
    const hue =
      baseHue + rng.range(-family.hueSpread / 2, family.hueSpread / 2);
    const saturation = rng.range(family.saturation[0], family.saturation[1]);
    const lightness = rng.range(family.lightness[0], family.lightness[1]);
    accents.push(hsl(hue, saturation, lightness));
  }

  const bgL1 = rng.range(
    family.backgroundLightness[0],
    family.backgroundLightness[1],
  );
  const bgL2 = Math.max(2, bgL1 - rng.range(3, 8));
  const bgHue1 = baseHue + rng.range(-20, 20);
  const bgHue2 = baseHue + rng.range(140, 220);
  const bgSaturation = rng.range(40, 75);

  const glow = hsl(baseHue, rng.range(70, 95), rng.range(55, 70), 0.55);

  return {
    name: family.name,
    background: [
      hsl(bgHue1, bgSaturation, bgL1),
      hsl(bgHue2, bgSaturation * 0.7, bgL2),
    ],
    accents,
    glow,
  };
};

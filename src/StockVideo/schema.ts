/**
 * Input props schema for the StockVideo composition.
 *
 * The Remotion Studio sidebar reads this schema to render an input form,
 * and the same shape is consumed by the render script. `seed` is the only
 * required knob for end-users — everything else has sensible defaults.
 *
 * `plan` is the editor's escape hatch: when present, the composition
 * skips its internal seed-derived planner and renders exactly what the
 * caller passed in. This lets the in-browser shape editor send a
 * user-edited scene through to the render API verbatim.
 */

import type { ScenePlan } from "./scene";

export type StockVideoProps = {
  seed: string;
  durationInSeconds: number;
  title?: string;
  subtitle?: string;
  plan?: ScenePlan | null;
};

export const defaultStockVideoProps: StockVideoProps = {
  seed: "potionn-001",
  durationInSeconds: 10,
};

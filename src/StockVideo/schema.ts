/**
 * Input props schema for the StockVideo composition.
 *
 * The Remotion Studio sidebar reads this schema to render an input form,
 * and the same shape is consumed by the render script. `seed` is the only
 * required knob for end-users — everything else has sensible defaults.
 */

export type StockVideoProps = {
  seed: string;
  durationInSeconds: number;
  title?: string;
  subtitle?: string;
};

export const defaultStockVideoProps: StockVideoProps = {
  seed: "potionn-001",
  durationInSeconds: 10,
};

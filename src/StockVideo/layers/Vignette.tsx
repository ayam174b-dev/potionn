import React from "react";
import { AbsoluteFill } from "remotion";

type Props = {
  intensity: number;
};

export const Vignette: React.FC<Props> = ({ intensity }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${intensity}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

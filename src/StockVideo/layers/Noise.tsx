import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";

type Props = {
  intensity: number;
  scale: number;
};

const buildNoiseSvg = (scale: number): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${scale}" numOctaves="2" stitchTiles="stitch"/></filter>
    <rect width="100%" height="100%" filter="url(#n)" opacity="1"/>
  </svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};

export const Noise: React.FC<Props> = ({ intensity, scale }) => {
  const backgroundImage = useMemo(() => buildNoiseSvg(scale), [scale]);
  return (
    <AbsoluteFill
      style={{
        backgroundImage,
        opacity: intensity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { createRng } from "./random";
import { planScene } from "./scene";
import { Background } from "./layers/Background";
import { Orbs } from "./layers/Orbs";
import { Polygons } from "./layers/Polygons";
import { Particles } from "./layers/Particles";
import { Ribbons } from "./layers/Ribbons";
import { Grid } from "./layers/Grid";
import { Vignette } from "./layers/Vignette";
import { Noise } from "./layers/Noise";
import type { StockVideoProps } from "./schema";

export const StockVideo: React.FC<StockVideoProps> = ({ seed }) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const plan = useMemo(
    () => planScene(createRng(seed), width, height),
    [seed, width, height],
  );

  const t = frame / fps;
  const swayX = Math.sin(t * plan.cameraSway.frequency) * plan.cameraSway.amplitude;
  const swayY =
    Math.cos(t * plan.cameraSway.frequency * 0.73) *
    plan.cameraSway.amplitude *
    0.6;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: plan.palette.background[1],
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          transform: `translate(${swayX}px, ${swayY}px) scale(1.04)`,
        }}
      >
        <Background plan={plan} width={width} height={height} fps={fps} />
        <Ribbons plan={plan} width={width} height={height} fps={fps} />
        <Orbs plan={plan} fps={fps} />
        <Polygons plan={plan} width={width} height={height} fps={fps} />
        <Particles plan={plan} width={width} height={height} fps={fps} />
        <Grid plan={plan} fps={fps} />
      </AbsoluteFill>
      <Noise intensity={plan.noise.intensity} scale={plan.noise.scale} />
      <Vignette intensity={plan.vignette} />
    </AbsoluteFill>
  );
};

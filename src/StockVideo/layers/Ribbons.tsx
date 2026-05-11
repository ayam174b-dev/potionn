import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { ScenePlan } from "../scene";

type Props = {
  plan: ScenePlan;
  width: number;
  height: number;
  fps: number;
};

const buildRibbonPath = (
  width: number,
  yCenter: number,
  amplitude: number,
  frequency: number,
  phase: number,
  thickness: number,
): string => {
  const steps = 80;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const wave = Math.sin((i / steps) * Math.PI * 2 * frequency + phase);
    const y = yCenter + wave * amplitude;
    top.push(`${x.toFixed(2)},${(y - thickness / 2).toFixed(2)}`);
    bottom.push(`${x.toFixed(2)},${(y + thickness / 2).toFixed(2)}`);
  }
  return `M ${top.join(" L ")} L ${bottom.reverse().join(" L ")} Z`;
};

export const Ribbons: React.FC<Props> = ({ plan, width, height, fps }) => {
  const frame = useCurrentFrame();
  const t = frame / fps;
  if (plan.ribbons.length === 0) return null;

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        {plan.ribbons.map((r, i) => {
          const phase = r.phase + t * r.speed;
          const d = buildRibbonPath(
            width,
            r.yCenter,
            r.amplitude,
            r.frequency,
            phase,
            r.thickness,
          );
          return (
            <path
              key={i}
              d={d}
              fill={r.color}
              opacity={r.opacity}
              style={{ filter: "blur(2px)" }}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

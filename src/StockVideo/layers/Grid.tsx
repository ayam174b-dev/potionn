import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { ScenePlan } from "../scene";

type Props = {
  plan: ScenePlan;
  fps: number;
};

export const Grid: React.FC<Props> = ({ plan, fps }) => {
  const frame = useCurrentFrame();
  const t = frame / fps;
  if (!plan.grid || plan.grid.hidden) return null;
  const { cellSize, rotation, driftSpeed, color, opacity, pulseSpeed } =
    plan.grid;
  const pulse = 0.7 + 0.3 * Math.sin(t * pulseSpeed);
  const offset = (t * driftSpeed * cellSize) % cellSize;

  return (
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: `${cellSize}px ${cellSize}px`,
        backgroundPosition: `${offset}px ${offset}px`,
        opacity: opacity * pulse,
        transform: `rotate(${rotation}rad) scale(1.5)`,
        transformOrigin: "center",
        mixBlendMode: "overlay",
      }}
    />
  );
};

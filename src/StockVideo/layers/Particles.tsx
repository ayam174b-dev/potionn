import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { ScenePlan } from "../scene";

type Props = {
  plan: ScenePlan;
  width: number;
  height: number;
  fps: number;
};

export const Particles: React.FC<Props> = ({ plan, width, height, fps }) => {
  const frame = useCurrentFrame();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {plan.particles.map((p, i) => {
        const distance = p.speed * t * 200;
        const rawX = p.x + Math.cos(p.angle) * distance;
        const rawY = p.y + Math.sin(p.angle) * distance;
        const x = ((rawX % width) + width) % width;
        const y = ((rawY % height) + height) % height;
        const twinkle =
          0.55 + 0.45 * Math.sin(t * p.twinkleSpeed + p.twinklePhase);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - p.size / 2,
              top: y - p.size / 2,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              opacity: twinkle,
              filter: p.blur > 0 ? `blur(${p.blur}px)` : undefined,
              boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

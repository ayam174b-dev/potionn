import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { ScenePlan } from "../scene";

type Props = {
  plan: ScenePlan;
  fps: number;
};

export const Orbs: React.FC<Props> = ({ plan, fps }) => {
  const frame = useCurrentFrame();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {plan.orbs.filter((o) => !o.hidden).map((orb, i) => {
        const x = orb.cx + Math.sin(t * orb.speed + orb.phaseX) * orb.driftX;
        const y = orb.cy + Math.cos(t * orb.speed * 0.83 + orb.phaseY) * orb.driftY;
        const breath = 1 + Math.sin(t * orb.speed * 0.6 + i) * 0.08;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - orb.radius,
              top: y - orb.radius,
              width: orb.radius * 2,
              height: orb.radius * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
              filter: `blur(${orb.blur}px)`,
              opacity: orb.opacity,
              transform: `scale(${breath})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

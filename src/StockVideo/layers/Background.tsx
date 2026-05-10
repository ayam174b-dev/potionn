import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { ScenePlan } from "../scene";
import { withAlpha } from "../palette";

type Props = {
  plan: ScenePlan;
  width: number;
  height: number;
  fps: number;
};

export const Background: React.FC<Props> = ({ plan, fps }) => {
  const frame = useCurrentFrame();
  const t = frame / fps;
  const [c1, c2] = plan.palette.background;
  const angle = plan.background.angle + t * 6;

  let backgroundImage: string;
  switch (plan.background.style) {
    case "radial":
      backgroundImage = `radial-gradient(circle at ${50 + Math.sin(t * 0.3) * 20}% ${50 + Math.cos(t * 0.25) * 20}%, ${c1}, ${c2})`;
      break;
    case "conic":
      backgroundImage = `conic-gradient(from ${angle}deg at 50% 50%, ${c1}, ${c2}, ${c1})`;
      break;
    case "mesh": {
      const a0 = withAlpha(plan.palette.accents[0], 0.25);
      const a1 = withAlpha(plan.palette.accents[1] ?? plan.palette.accents[0], 0.25);
      backgroundImage = [
        `radial-gradient(at 20% 30%, ${c1} 0%, transparent 60%)`,
        `radial-gradient(at 80% 70%, ${c2} 0%, transparent 65%)`,
        `radial-gradient(at 60% 20%, ${a0} 0%, transparent 55%)`,
        `radial-gradient(at 30% 85%, ${a1} 0%, transparent 55%)`,
      ].join(", ");
      break;
    }
    case "linear":
    default:
      backgroundImage = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
      break;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundImage,
        backgroundColor: c2,
      }}
    />
  );
};

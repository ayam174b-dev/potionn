import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { ScenePlan } from "../scene";

type Props = {
  plan: ScenePlan;
  width: number;
  height: number;
  fps: number;
};

const buildPolygonPath = (
  sides: number,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
): string => {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = rotation + (i * Math.PI * 2) / sides;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M ${points.join(" L ")} Z`;
};

export const Polygons: React.FC<Props> = ({ plan, width, height, fps }) => {
  const frame = useCurrentFrame();
  const t = frame / fps;
  if (plan.polygons.length === 0) return null;

  return (
    <AbsoluteFill>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        {plan.polygons.map((poly, i) => {
          const rotation = poly.startRotation + t * poly.rotationSpeed;
          const breath = 1 + Math.sin(t * 0.8 + i) * 0.06;
          const r = poly.radius * breath;
          const d = buildPolygonPath(poly.sides, poly.cx, poly.cy, r, rotation);
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={poly.color}
              strokeWidth={poly.strokeWidth}
              strokeLinejoin="round"
              opacity={poly.opacity}
              style={{ mixBlendMode: "screen" }}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

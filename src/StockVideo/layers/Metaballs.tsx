import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { ScenePlan } from "../scene";

type Props = {
  plan: ScenePlan;
  width: number;
  height: number;
  fps: number;
};

/**
 * Liquid-metal style blobs. The visual trick is a two-step SVG filter:
 *
 *   1. Heavy gaussian blur so each circle becomes a soft cloud.
 *   2. A `feColorMatrix` with a very high alpha gain plus a negative bias.
 *      This makes any pixel above a threshold alpha turn fully opaque
 *      and any below it transparent — i.e. the alpha channel is
 *      thresholded. When two soft clouds overlap, their combined alpha
 *      jumps the threshold *between* them too, producing the smooth
 *      "merging blob" look.
 *
 * Each ball drifts on independent sinusoids so the cluster slowly
 * reorganises throughout the clip.
 */
export const Metaballs: React.FC<Props> = ({ plan, width, height, fps }) => {
  const frame = useCurrentFrame();
  if (!plan.metaballs || plan.metaballs.hidden) return null;
  const cfg = plan.metaballs;
  const balls = cfg.balls.filter((b) => !b.hidden);
  if (balls.length === 0) return null;
  const t = frame / fps;
  const filterId = `metaballs-filter`;

  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={cfg.blur} />
            <feColorMatrix
              type="matrix"
              values={`1 0 0 0 0
                       0 1 0 0 0
                       0 0 1 0 0
                       0 0 0 ${cfg.threshold} -${cfg.threshold / 2 + 1}`}
            />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`} opacity={0.75}>
          {balls.map((b, i) => {
            const x = b.cx + Math.sin(t * b.speed + b.phaseX) * b.driftX;
            const y =
              b.cy + Math.cos(t * b.speed * 0.81 + b.phaseY) * b.driftY;
            const r = b.radius * (0.92 + 0.08 * Math.sin(t * b.speed + i));
            return <circle key={i} cx={x} cy={y} r={r} fill={cfg.color} />;
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

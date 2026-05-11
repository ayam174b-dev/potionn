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

/**
 * Volumetric "god rays" — long soft beams emitted from an off-screen
 * origin. Each beam is a tall rectangle with a vertical gradient (colour
 * at the source, transparent at the tip) plus heavy gaussian blur. The
 * whole group rotates slowly around the origin and the opacity pulses,
 * giving the classic "sun through clouds" look without any raster work.
 */
export const LightRays: React.FC<Props> = ({ plan, width, height, fps }) => {
  const frame = useCurrentFrame();
  if (!plan.lightRays || plan.lightRays.hidden) return null;
  const cfg = plan.lightRays;
  const t = frame / fps;

  const longSide = Math.max(width, height);
  const cx = cfg.cx * width;
  const cy = cfg.cy * height;
  const beamW = cfg.beamWidth * longSide;
  const beamH = cfg.length * longSide;

  const rotation = cfg.baseAngleDeg + cfg.rotateSpeed * t;
  const pulse = 0.85 + 0.15 * Math.sin(t * cfg.pulseSpeed * Math.PI);
  const overall = cfg.opacity * pulse;

  const gradId = `lr-grad`;
  const filterId = `lr-blur`;

  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        pointerEvents: "none",
        opacity: overall,
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={cfg.color} stopOpacity="0.9" />
            <stop offset="0.4" stopColor={cfg.color} stopOpacity="0.5" />
            <stop
              offset="1"
              stopColor={withAlpha(cfg.color, 0)}
              stopOpacity="0"
            />
          </linearGradient>
          <filter
            id={filterId}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation={cfg.blur} />
          </filter>
        </defs>
        <g
          transform={`translate(${cx} ${cy}) rotate(${rotation})`}
          filter={`url(#${filterId})`}
        >
          {Array.from({ length: cfg.count }).map((_, i) => {
            const baseAngle =
              ((i - (cfg.count - 1) / 2) / Math.max(1, cfg.count - 1)) *
              cfg.spreadDeg;
            const taper = 0.65 + 0.35 * Math.sin(t * (0.4 + i * 0.13) + i);
            return (
              <rect
                key={i}
                x={-beamW / 2}
                y={0}
                width={beamW}
                height={beamH}
                fill={`url(#${gradId})`}
                opacity={taper}
                transform={`rotate(${baseAngle})`}
              />
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

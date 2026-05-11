import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { ScenePlan } from "../scene";
import { buildFlowfield } from "../flowfield";
import { seedToNumber } from "../random";

type Props = {
  plan: ScenePlan;
  width: number;
  height: number;
  fps: number;
};

// Trail visualisation: number of look-back samples per particle, and the
// seconds between samples. The whole trail spans TRAIL_STEPS * TRAIL_DT
// seconds in the past.
const TRAIL_STEPS = 10;
const TRAIL_DT = 0.05;

const fieldSeed = (plan: ScenePlan): number =>
  seedToNumber(
    `${plan.palette.name}:${plan.flowfield.scale.toFixed(4)}:${plan.flowfield.timeDrift.toFixed(4)}`,
  ) >>>
  0;

/**
 * Closed-form swirly particle motion.
 *
 * Each particle's position at time `t` is a pure function of its spawn
 * point and personal offset — no path integration, no per-frame state.
 * The angle at any (x, y, t) is sampled from a value-noise flowfield,
 * which makes nearby particles drift in similar directions (coherent
 * swarms). We then advect a small "displacement budget" `lateral` along
 * that local direction. This is much cheaper than path integration and
 * produces visually equivalent results at video resolutions.
 */
const positionAt = (
  p: { x: number; y: number; speed: number; fieldOffset: number },
  t: number,
  field: (x: number, y: number, t: number) => number,
  strength: number,
  width: number,
  height: number,
): { x: number; y: number } => {
  const ot = t + p.fieldOffset;
  const angle = field(p.x, p.y, ot);
  // Local angular drift gives small in-place swirls on top of the larger
  // bulk advection — without it, all particles starting in the same
  // flowfield cell would move in identical straight lines.
  const wobble = 0.6 * Math.sin(ot * 0.7 + p.fieldOffset);
  const a = angle + wobble;
  // `lateral` is the cumulative advected distance. We grow it linearly
  // with time and clamp by the longest side so particles never escape.
  const lateral = p.speed * strength * t;
  // Add a second axis of motion derived from a different field tap so
  // the path curves rather than being a straight line.
  const lateral2 = p.speed * strength * 0.4 *
    Math.sin(ot * 0.2 + field(p.x * 0.7, p.y * 0.7, ot * 0.5) * 2);
  let x = p.x + Math.cos(a) * lateral + Math.cos(a + Math.PI / 2) * lateral2;
  let y = p.y + Math.sin(a) * lateral + Math.sin(a + Math.PI / 2) * lateral2;
  // Wrap so particles re-enter from the other side rather than escaping.
  x = ((x % width) + width) % width;
  y = ((y % height) + height) % height;
  return { x, y };
};

export const Particles: React.FC<Props> = ({ plan, width, height, fps }) => {
  const frame = useCurrentFrame();
  const t = frame / fps;
  const field = React.useMemo(
    () => buildFlowfield(fieldSeed(plan), plan.flowfield.scale, plan.flowfield.timeDrift),
    [plan],
  );

  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        {plan.particles.map((p, i) => {
          const head = positionAt(p, t, field, plan.flowfield.strength, width, height);
          const twinkle =
            0.55 + 0.45 * Math.sin(t * p.twinkleSpeed + p.twinklePhase);

          // Build the trail by sampling positions backwards in time.
          const trail: { x: number; y: number }[] = [];
          for (let s = TRAIL_STEPS; s >= 1; s--) {
            const ts = Math.max(0, t - s * TRAIL_DT);
            trail.push(
              positionAt(p, ts, field, plan.flowfield.strength, width, height),
            );
          }
          trail.push(head);

          return (
            <g key={i}>
              {trail.map((pt, j) => {
                if (j === 0) return null;
                const prev = trail[j - 1];
                // Suppress the segment that "jumps" across a screen wrap.
                const dx = Math.abs(pt.x - prev.x);
                const dy = Math.abs(pt.y - prev.y);
                if (dx > width / 2 || dy > height / 2) return null;
                const t01 = j / trail.length;
                return (
                  <line
                    key={j}
                    x1={prev.x}
                    y1={prev.y}
                    x2={pt.x}
                    y2={pt.y}
                    stroke={p.color}
                    strokeOpacity={t01 * 0.65 * twinkle}
                    strokeWidth={p.size * 0.6 * t01 + 0.3}
                    strokeLinecap="round"
                  />
                );
              })}
              {/* The bloom filter on the parent wrapper already provides
                  the glow halo, so we render the head as a plain dot to
                  avoid a per-particle drop-shadow rasterization. */}
              <circle
                cx={head.x}
                cy={head.y}
                r={p.size / 2}
                fill={p.color}
                opacity={twinkle}
                style={p.blur > 0 ? { filter: `blur(${p.blur * 0.5}px)` } : undefined}
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

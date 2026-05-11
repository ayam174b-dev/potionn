/**
 * Shape editor UI.
 *
 * Renders a per-element list editor for each shape category in the scene
 * plan: orbs, polygons, ribbons, metaballs, light rays, plus on/off
 * toggles for the grid. Every interaction returns a new `ScenePlan` via
 * the `onPlanChange` callback so the host (App.tsx) stays in charge of
 * state.
 *
 * Background, particles, noise, and vignette are intentionally NOT shown
 * here because they aren't shape-like — toggling/sliding them belongs to
 * a different (future) UI surface.
 */

import React from "react";
import type { ScenePlan } from "../src/StockVideo/scene";
import {
  addMetaball,
  addOrb,
  addPolygon,
  addRibbon,
  colorToHex,
  deleteShape,
  duplicateShape,
  ensureLightRays,
  hexToHsla,
  patchLightRays,
  patchMetaball,
  patchMetaballsRoot,
  patchOrb,
  patchPolygon,
  patchRibbon,
  toggleHidden,
} from "./planActions";

type Props = {
  plan: ScenePlan;
  width: number;
  height: number;
  onPlanChange: (next: ScenePlan) => void;
  onReset: () => void;
  dirty: boolean;
};

// ── small atomic input components ──────────────────────────────────────

const NumberRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  fmt?: (v: number) => string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, fmt, onChange }) => (
  <div className="ed-row">
    <span className="ed-label">{label}</span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="ed-range"
    />
    <span className="ed-value">{fmt ? fmt(value) : value.toFixed(step < 1 ? 2 : 0)}</span>
  </div>
);

const ColorRow: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="ed-row">
    <span className="ed-label">{label}</span>
    <input
      type="color"
      value={colorToHex(value)}
      onChange={(e) => onChange(hexToHsla(e.target.value, 1))}
      className="ed-color"
    />
    <span className="ed-value" style={{ fontFamily: "monospace" }}>
      {colorToHex(value)}
    </span>
  </div>
);

// ── per-shape row + edit panels ────────────────────────────────────────

type ExpandKey = string;

type RowProps = {
  expanded: boolean;
  hidden?: boolean;
  title: string;
  onToggleExpand: () => void;
  onToggleHidden: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
};

const ShapeRow: React.FC<React.PropsWithChildren<RowProps>> = ({
  expanded,
  hidden,
  title,
  onToggleExpand,
  onToggleHidden,
  onDuplicate,
  onDelete,
  children,
}) => (
  <div className={`ed-item ${hidden ? "hidden" : ""}`}>
    <div className="ed-item-head">
      <button
        type="button"
        className="ed-icon"
        title={hidden ? "Show" : "Hide"}
        onClick={onToggleHidden}
      >
        {hidden ? "○" : "●"}
      </button>
      <button
        type="button"
        className="ed-title"
        onClick={onToggleExpand}
        title={expanded ? "Collapse" : "Edit"}
      >
        <span className="ed-caret">{expanded ? "▾" : "▸"}</span>
        {title}
      </button>
      {onDuplicate && (
        <button
          type="button"
          className="ed-icon"
          title="Duplicate"
          onClick={onDuplicate}
        >
          ⎘
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="ed-icon danger"
          title="Delete"
          onClick={onDelete}
        >
          ✕
        </button>
      )}
    </div>
    {expanded && <div className="ed-item-body">{children}</div>}
  </div>
);

// ── section: orbs ──────────────────────────────────────────────────────

const OrbsSection: React.FC<{
  plan: ScenePlan;
  width: number;
  height: number;
  expanded: Set<ExpandKey>;
  toggleExpand: (k: ExpandKey) => void;
  onPlanChange: (p: ScenePlan) => void;
}> = ({ plan, width, height, expanded, toggleExpand, onPlanChange }) => {
  return (
    <div className="ed-section">
      <div className="ed-section-head">
        <h3>Orbs ({plan.orbs.length})</h3>
        <button
          type="button"
          className="ed-add"
          onClick={() => onPlanChange(addOrb(plan, width, height))}
        >
          + Add
        </button>
      </div>
      {plan.orbs.map((orb, i) => {
        const k = `orb-${i}`;
        const isOpen = expanded.has(k);
        return (
          <ShapeRow
            key={k}
            expanded={isOpen}
            hidden={orb.hidden}
            title={`Orb ${i + 1}`}
            onToggleExpand={() => toggleExpand(k)}
            onToggleHidden={() => onPlanChange(toggleHidden(plan, "orbs", i))}
            onDuplicate={() => onPlanChange(duplicateShape(plan, "orbs", i))}
            onDelete={() => onPlanChange(deleteShape(plan, "orbs", i))}
          >
            <NumberRow
              label="x"
              min={0}
              max={width}
              value={orb.cx}
              onChange={(v) => onPlanChange(patchOrb(plan, i, { cx: v }))}
            />
            <NumberRow
              label="y"
              min={0}
              max={height}
              value={orb.cy}
              onChange={(v) => onPlanChange(patchOrb(plan, i, { cy: v }))}
            />
            <NumberRow
              label="radius"
              min={20}
              max={Math.max(width, height)}
              value={orb.radius}
              onChange={(v) => onPlanChange(patchOrb(plan, i, { radius: v }))}
            />
            <NumberRow
              label="blur"
              min={0}
              max={200}
              value={orb.blur}
              onChange={(v) => onPlanChange(patchOrb(plan, i, { blur: v }))}
            />
            <NumberRow
              label="opacity"
              min={0}
              max={1}
              step={0.01}
              value={orb.opacity}
              onChange={(v) => onPlanChange(patchOrb(plan, i, { opacity: v }))}
            />
            <NumberRow
              label="speed"
              min={0}
              max={3}
              step={0.05}
              value={orb.speed}
              onChange={(v) => onPlanChange(patchOrb(plan, i, { speed: v }))}
            />
            <ColorRow
              label="colour"
              value={orb.color}
              onChange={(v) => onPlanChange(patchOrb(plan, i, { color: v }))}
            />
          </ShapeRow>
        );
      })}
    </div>
  );
};

// ── section: polygons ──────────────────────────────────────────────────

const PolygonsSection: React.FC<{
  plan: ScenePlan;
  width: number;
  height: number;
  expanded: Set<ExpandKey>;
  toggleExpand: (k: ExpandKey) => void;
  onPlanChange: (p: ScenePlan) => void;
}> = ({ plan, width, height, expanded, toggleExpand, onPlanChange }) => (
  <div className="ed-section">
    <div className="ed-section-head">
      <h3>Polygons ({plan.polygons.length})</h3>
      <button
        type="button"
        className="ed-add"
        onClick={() => onPlanChange(addPolygon(plan, width, height))}
      >
        + Add
      </button>
    </div>
    {plan.polygons.map((poly, i) => {
      const k = `poly-${i}`;
      const isOpen = expanded.has(k);
      return (
        <ShapeRow
          key={k}
          expanded={isOpen}
          hidden={poly.hidden}
          title={`Polygon ${i + 1} · ${poly.sides} sides`}
          onToggleExpand={() => toggleExpand(k)}
          onToggleHidden={() => onPlanChange(toggleHidden(plan, "polygons", i))}
          onDuplicate={() => onPlanChange(duplicateShape(plan, "polygons", i))}
          onDelete={() => onPlanChange(deleteShape(plan, "polygons", i))}
        >
          <NumberRow
            label="sides"
            min={3}
            max={12}
            value={poly.sides}
            onChange={(v) =>
              onPlanChange(patchPolygon(plan, i, { sides: Math.round(v) }))
            }
          />
          <NumberRow
            label="x"
            min={0}
            max={width}
            value={poly.cx}
            onChange={(v) => onPlanChange(patchPolygon(plan, i, { cx: v }))}
          />
          <NumberRow
            label="y"
            min={0}
            max={height}
            value={poly.cy}
            onChange={(v) => onPlanChange(patchPolygon(plan, i, { cy: v }))}
          />
          <NumberRow
            label="radius"
            min={20}
            max={Math.max(width, height) / 2}
            value={poly.radius}
            onChange={(v) => onPlanChange(patchPolygon(plan, i, { radius: v }))}
          />
          <NumberRow
            label="spin"
            min={-2}
            max={2}
            step={0.05}
            value={poly.rotationSpeed}
            onChange={(v) =>
              onPlanChange(patchPolygon(plan, i, { rotationSpeed: v }))
            }
          />
          <NumberRow
            label="stroke"
            min={1}
            max={20}
            value={poly.strokeWidth}
            onChange={(v) =>
              onPlanChange(patchPolygon(plan, i, { strokeWidth: v }))
            }
          />
          <NumberRow
            label="opacity"
            min={0}
            max={1}
            step={0.01}
            value={poly.opacity}
            onChange={(v) => onPlanChange(patchPolygon(plan, i, { opacity: v }))}
          />
          <ColorRow
            label="colour"
            value={poly.color}
            onChange={(v) => onPlanChange(patchPolygon(plan, i, { color: v }))}
          />
        </ShapeRow>
      );
    })}
  </div>
);

// ── section: ribbons ───────────────────────────────────────────────────

const RibbonsSection: React.FC<{
  plan: ScenePlan;
  height: number;
  expanded: Set<ExpandKey>;
  toggleExpand: (k: ExpandKey) => void;
  onPlanChange: (p: ScenePlan) => void;
}> = ({ plan, height, expanded, toggleExpand, onPlanChange }) => (
  <div className="ed-section">
    <div className="ed-section-head">
      <h3>Ribbons ({plan.ribbons.length})</h3>
      <button
        type="button"
        className="ed-add"
        onClick={() => onPlanChange(addRibbon(plan, height))}
      >
        + Add
      </button>
    </div>
    {plan.ribbons.map((r, i) => {
      const k = `ribbon-${i}`;
      const isOpen = expanded.has(k);
      return (
        <ShapeRow
          key={k}
          expanded={isOpen}
          hidden={r.hidden}
          title={`Ribbon ${i + 1}`}
          onToggleExpand={() => toggleExpand(k)}
          onToggleHidden={() => onPlanChange(toggleHidden(plan, "ribbons", i))}
          onDuplicate={() => onPlanChange(duplicateShape(plan, "ribbons", i))}
          onDelete={() => onPlanChange(deleteShape(plan, "ribbons", i))}
        >
          <NumberRow
            label="y center"
            min={0}
            max={height}
            value={r.yCenter}
            onChange={(v) => onPlanChange(patchRibbon(plan, i, { yCenter: v }))}
          />
          <NumberRow
            label="amplitude"
            min={0}
            max={height / 2}
            value={r.amplitude}
            onChange={(v) =>
              onPlanChange(patchRibbon(plan, i, { amplitude: v }))
            }
          />
          <NumberRow
            label="frequency"
            min={0.2}
            max={5}
            step={0.05}
            value={r.frequency}
            onChange={(v) =>
              onPlanChange(patchRibbon(plan, i, { frequency: v }))
            }
          />
          <NumberRow
            label="speed"
            min={0}
            max={3}
            step={0.05}
            value={r.speed}
            onChange={(v) => onPlanChange(patchRibbon(plan, i, { speed: v }))}
          />
          <NumberRow
            label="thickness"
            min={1}
            max={20}
            value={r.thickness}
            onChange={(v) =>
              onPlanChange(patchRibbon(plan, i, { thickness: v }))
            }
          />
          <NumberRow
            label="opacity"
            min={0}
            max={1}
            step={0.01}
            value={r.opacity}
            onChange={(v) => onPlanChange(patchRibbon(plan, i, { opacity: v }))}
          />
          <ColorRow
            label="colour"
            value={r.color}
            onChange={(v) => onPlanChange(patchRibbon(plan, i, { color: v }))}
          />
        </ShapeRow>
      );
    })}
  </div>
);

// ── section: metaballs ─────────────────────────────────────────────────

const MetaballsSection: React.FC<{
  plan: ScenePlan;
  width: number;
  height: number;
  expanded: Set<ExpandKey>;
  toggleExpand: (k: ExpandKey) => void;
  onPlanChange: (p: ScenePlan) => void;
}> = ({ plan, width, height, expanded, toggleExpand, onPlanChange }) => {
  const mb = plan.metaballs;
  return (
    <div className="ed-section">
      <div className="ed-section-head">
        <h3>Metaballs {mb ? `(${mb.balls.length} balls)` : "(off)"}</h3>
        <button
          type="button"
          className="ed-add"
          onClick={() => onPlanChange(addMetaball(plan, width, height))}
        >
          + Add ball
        </button>
      </div>
      {mb && (
        <ShapeRow
          expanded={expanded.has("mb-root")}
          hidden={mb.hidden}
          title="Group settings"
          onToggleExpand={() => toggleExpand("mb-root")}
          onToggleHidden={() =>
            onPlanChange(toggleHidden(plan, "metaballs", -1))
          }
        >
          <NumberRow
            label="threshold"
            min={5}
            max={30}
            step={0.5}
            value={mb.threshold}
            onChange={(v) =>
              onPlanChange(patchMetaballsRoot(plan, { threshold: v }))
            }
          />
          <NumberRow
            label="blur"
            min={5}
            max={80}
            value={mb.blur}
            onChange={(v) =>
              onPlanChange(patchMetaballsRoot(plan, { blur: v }))
            }
          />
          <ColorRow
            label="colour"
            value={mb.color}
            onChange={(v) =>
              onPlanChange(patchMetaballsRoot(plan, { color: v }))
            }
          />
        </ShapeRow>
      )}
      {mb?.balls.map((b, i) => {
        const k = `mb-ball-${i}`;
        const isOpen = expanded.has(k);
        return (
          <ShapeRow
            key={k}
            expanded={isOpen}
            hidden={b.hidden}
            title={`Ball ${i + 1}`}
            onToggleExpand={() => toggleExpand(k)}
            onToggleHidden={() => onPlanChange(toggleHidden(plan, "metaballs", i))}
            onDuplicate={() =>
              onPlanChange(duplicateShape(plan, "metaballs", i))
            }
            onDelete={() => onPlanChange(deleteShape(plan, "metaballs", i))}
          >
            <NumberRow
              label="x"
              min={0}
              max={width}
              value={b.cx}
              onChange={(v) => onPlanChange(patchMetaball(plan, i, { cx: v }))}
            />
            <NumberRow
              label="y"
              min={0}
              max={height}
              value={b.cy}
              onChange={(v) => onPlanChange(patchMetaball(plan, i, { cy: v }))}
            />
            <NumberRow
              label="radius"
              min={20}
              max={Math.max(width, height) / 3}
              value={b.radius}
              onChange={(v) =>
                onPlanChange(patchMetaball(plan, i, { radius: v }))
              }
            />
            <NumberRow
              label="speed"
              min={0}
              max={2}
              step={0.05}
              value={b.speed}
              onChange={(v) =>
                onPlanChange(patchMetaball(plan, i, { speed: v }))
              }
            />
          </ShapeRow>
        );
      })}
    </div>
  );
};

// ── section: light rays ────────────────────────────────────────────────

const LightRaysSection: React.FC<{
  plan: ScenePlan;
  expanded: Set<ExpandKey>;
  toggleExpand: (k: ExpandKey) => void;
  onPlanChange: (p: ScenePlan) => void;
}> = ({ plan, expanded, toggleExpand, onPlanChange }) => {
  const lr = plan.lightRays;
  return (
    <div className="ed-section">
      <div className="ed-section-head">
        <h3>Light rays {lr ? "" : "(off)"}</h3>
        {!lr && (
          <button
            type="button"
            className="ed-add"
            onClick={() => onPlanChange(ensureLightRays(plan))}
          >
            + Enable
          </button>
        )}
      </div>
      {lr && (
        <ShapeRow
          expanded={expanded.has("lr")}
          hidden={lr.hidden}
          title="God rays"
          onToggleExpand={() => toggleExpand("lr")}
          onToggleHidden={() => onPlanChange(toggleHidden(plan, "lightRays", 0))}
        >
          <NumberRow
            label="origin x"
            min={-0.5}
            max={1.5}
            step={0.01}
            value={lr.cx}
            onChange={(v) => onPlanChange(patchLightRays(plan, { cx: v }))}
          />
          <NumberRow
            label="origin y"
            min={-0.5}
            max={1.5}
            step={0.01}
            value={lr.cy}
            onChange={(v) => onPlanChange(patchLightRays(plan, { cy: v }))}
          />
          <NumberRow
            label="count"
            min={1}
            max={12}
            value={lr.count}
            onChange={(v) =>
              onPlanChange(patchLightRays(plan, { count: Math.round(v) }))
            }
          />
          <NumberRow
            label="spread°"
            min={5}
            max={180}
            value={lr.spreadDeg}
            onChange={(v) =>
              onPlanChange(patchLightRays(plan, { spreadDeg: v }))
            }
          />
          <NumberRow
            label="angle°"
            min={0}
            max={360}
            value={lr.baseAngleDeg}
            onChange={(v) =>
              onPlanChange(patchLightRays(plan, { baseAngleDeg: v }))
            }
          />
          <NumberRow
            label="width"
            min={0.02}
            max={0.5}
            step={0.01}
            value={lr.beamWidth}
            onChange={(v) =>
              onPlanChange(patchLightRays(plan, { beamWidth: v }))
            }
          />
          <NumberRow
            label="length"
            min={0.5}
            max={3}
            step={0.05}
            value={lr.length}
            onChange={(v) => onPlanChange(patchLightRays(plan, { length: v }))}
          />
          <NumberRow
            label="opacity"
            min={0}
            max={1}
            step={0.01}
            value={lr.opacity}
            onChange={(v) => onPlanChange(patchLightRays(plan, { opacity: v }))}
          />
          <NumberRow
            label="blur"
            min={0}
            max={100}
            value={lr.blur}
            onChange={(v) => onPlanChange(patchLightRays(plan, { blur: v }))}
          />
          <ColorRow
            label="colour"
            value={lr.color}
            onChange={(v) => onPlanChange(patchLightRays(plan, { color: v }))}
          />
        </ShapeRow>
      )}
    </div>
  );
};

// ── top-level Editor ───────────────────────────────────────────────────

export const Editor: React.FC<Props> = ({
  plan,
  width,
  height,
  onPlanChange,
  onReset,
  dirty,
}) => {
  const [expanded, setExpanded] = React.useState<Set<ExpandKey>>(new Set());
  const toggleExpand = React.useCallback((k: ExpandKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  return (
    <div className="card editor">
      <div className="ed-head">
        <h2>Shape editor {dirty && <span className="ed-dirty">· edited</span>}</h2>
        <button
          type="button"
          className="ed-reset"
          onClick={onReset}
          disabled={!dirty}
          title={
            dirty
              ? "Discard all edits and rebuild from seed"
              : "Nothing to reset — plan matches the seed"
          }
        >
          Reset to seed
        </button>
      </div>
      <p className="muted">
        Each shape can be hidden, duplicated, deleted, or edited. Add new
        shapes per category. Edits flow into both the live preview and the
        rendered video.
      </p>
      <OrbsSection
        plan={plan}
        width={width}
        height={height}
        expanded={expanded}
        toggleExpand={toggleExpand}
        onPlanChange={onPlanChange}
      />
      <PolygonsSection
        plan={plan}
        width={width}
        height={height}
        expanded={expanded}
        toggleExpand={toggleExpand}
        onPlanChange={onPlanChange}
      />
      <RibbonsSection
        plan={plan}
        height={height}
        expanded={expanded}
        toggleExpand={toggleExpand}
        onPlanChange={onPlanChange}
      />
      <MetaballsSection
        plan={plan}
        width={width}
        height={height}
        expanded={expanded}
        toggleExpand={toggleExpand}
        onPlanChange={onPlanChange}
      />
      <LightRaysSection
        plan={plan}
        expanded={expanded}
        toggleExpand={toggleExpand}
        onPlanChange={onPlanChange}
      />
    </div>
  );
};

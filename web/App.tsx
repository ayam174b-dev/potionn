import React from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { StockVideo } from "../src/StockVideo";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

const MIN_DURATION = 10;
const MAX_DURATION = 30;

type Format = "mp4" | "mov";
type Quality = "low" | "standard" | "high" | "max";

const randomSeed = (): string => {
  // 6-byte URL-safe seed — large enough to make collisions effectively impossible
  // while staying short and recognisable in the UI.
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

type RenderStatus =
  | { state: "idle" }
  | { state: "busy"; message: string; progress: number }
  | { state: "ok"; message: string }
  | { state: "err"; message: string };

export const App: React.FC = () => {
  const [seed, setSeed] = React.useState<string>(() => randomSeed());
  const [duration, setDuration] = React.useState<number>(15);
  const [format, setFormat] = React.useState<Format>("mp4");
  const [quality, setQuality] = React.useState<Quality>("high");
  const [status, setStatus] = React.useState<RenderStatus>({ state: "idle" });
  const playerRef = React.useRef<PlayerRef>(null);

  const inputProps = React.useMemo(
    () => ({ seed, durationInSeconds: duration }),
    [seed, duration],
  );

  const randomize = React.useCallback(() => {
    setSeed(randomSeed());
    // Reset playback so the viewer sees the change from the start.
    playerRef.current?.seekTo(0);
    playerRef.current?.play();
  }, []);

  // Allow pressing "R" to randomize, "Space" to play/pause.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        randomize();
      } else if (e.key === " ") {
        e.preventDefault();
        const player = playerRef.current;
        if (!player) return;
        if (player.isPlaying()) player.pause();
        else player.play();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [randomize]);

  const handleRender = async () => {
    setStatus({
      state: "busy",
      message: "Bundling & rendering...",
      progress: 0,
    });

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          seed,
          durationInSeconds: duration,
          format,
          quality,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Render failed: ${res.status}`);
      }

      // Stream the file body and watch progress via Content-Length.
      const total = Number(res.headers.get("content-length") ?? 0);
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.byteLength;
            const progress = total > 0 ? received / total : 0;
            setStatus({
              state: "busy",
              message: `Downloading ${(received / 1024 / 1024).toFixed(1)} MB${
                total > 0 ? ` of ${(total / 1024 / 1024).toFixed(1)} MB` : ""
              }`,
              progress,
            });
          }
        }
      }

      // Build a blob view over the chunks without copying their bytes.
      const blob = new Blob(chunks as BlobPart[], {
        type: format === "mov" ? "video/quicktime" : "video/mp4",
      });
      const sizeMb = blob.size / (1024 * 1024);
      const filename = `potionn-${seed}-${duration}s.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const sizeWarning =
        sizeMb < 20
          ? ` (under 20 MB threshold — try a higher quality preset)`
          : "";
      setStatus({
        state: "ok",
        message: `Rendered ${filename} · ${sizeMb.toFixed(2)} MB${sizeWarning}`,
      });
    } catch (err) {
      setStatus({
        state: "err",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const busy = status.state === "busy";

  return (
    <div className="app">
      <section className="preview">
        <div className="header">
          <h1>potionn · live preview</h1>
          <span>
            seed <code>{seed}</code> · {duration}s · 1080p30
          </span>
        </div>

        <div className="preview-frame">
          <div>
            <Player
              ref={playerRef}
              component={StockVideo}
              durationInFrames={Math.max(1, Math.round(duration * FPS))}
              fps={FPS}
              compositionWidth={WIDTH}
              compositionHeight={HEIGHT}
              inputProps={inputProps}
              controls
              autoPlay
              loop
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
      </section>

      <aside className="sidebar">
        <div className="card">
          <h2>Acak (Randomize)</h2>
          <p className="muted">
            Generate a fresh, visually distinct stock clip. Each seed yields a
            unique palette, layer mix, and motion — no near-duplicates.
          </p>
          <div className="seed-row">
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              spellCheck={false}
              aria-label="Seed"
            />
            <button className="btn primary" onClick={randomize}>
              Acak
            </button>
          </div>
          <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
            Shortcut: <span className="kbd">R</span> to randomize ·{" "}
            <span className="kbd">Space</span> to play/pause
          </p>
        </div>

        <div className="card">
          <h2>Duration</h2>
          <p className="muted">
            Stock clips are clamped to {MIN_DURATION}–{MAX_DURATION} seconds.
          </p>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="label" style={{ margin: 0 }}>
              Seconds
            </span>
            <span className="value">{duration}s</span>
          </div>
          <input
            type="range"
            min={MIN_DURATION}
            max={MAX_DURATION}
            step={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>

        <div className="card">
          <h2>Export</h2>
          <p className="muted">
            Renders happen on your laptop via Remotion. Bitrate is forced high
            enough that the output reliably exceeds 20 MB.
          </p>

          <div className="row" style={{ alignItems: "flex-end", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="fmt">
                Format
              </label>
              <select
                id="fmt"
                value={format}
                onChange={(e) => setFormat(e.target.value as Format)}
              >
                <option value="mp4">MP4 · H.264</option>
                <option value="mov">MOV · ProRes HQ</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="q">
                Quality
              </label>
              <select
                id="q"
                value={quality}
                onChange={(e) => setQuality(e.target.value as Quality)}
                disabled={format === "mov"}
                title={
                  format === "mov" ? "ProRes uses a fixed quality profile" : ""
                }
              >
                <option value="low">low · 16 Mb/s (~20 MB)</option>
                <option value="standard">standard · 24 Mb/s (~30 MB)</option>
                <option value="high">high · 32 Mb/s (~40 MB)</option>
                <option value="max">max · 60 Mb/s (~75 MB)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              className="btn secondary full"
              onClick={handleRender}
              disabled={busy}
            >
              {busy ? "Rendering..." : `Render & download .${format}`}
            </button>
          </div>

          {status.state !== "idle" && (
            <div className={`status ${status.state}`}>
              {status.state === "busy" && (
                <>
                  {status.message}
                  <div className="progress">
                    <div
                      style={{
                        width: `${Math.max(2, Math.round(status.progress * 100))}%`,
                      }}
                    />
                  </div>
                </>
              )}
              {status.state !== "busy" && status.message}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

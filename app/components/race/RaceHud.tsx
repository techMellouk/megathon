'use client'
import type { CSSProperties } from "react";
import type { LeaderboardEntry, RacePhase } from "./useRaceState";

type Props = {
  phase: RacePhase;
  countdown: number;
  lap: number;
  totalLaps: number;
  rank: number;
  totalRacers: number;
  speed: number;
  leaderboard: LeaderboardEntry[];
  onRestart: () => void;
  onExit: () => void;
};

const panel: CSSProperties = {
  position: "absolute",
  background: "rgba(10,14,22,0.72)",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 16px",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  backdropFilter: "blur(4px)",
  border: "1px solid rgba(255,255,255,0.12)",
  lineHeight: 1.1,
};

const label: CSSProperties = {
  fontSize: 11,
  letterSpacing: 2,
  opacity: 0.7,
  textTransform: "uppercase",
};

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatTime(t: number | null) {
  if (t == null) return "--";
  return `${t.toFixed(2)}s`;
}

export default function RaceHud({
  phase,
  countdown,
  lap,
  totalLaps,
  rank,
  totalRacers,
  speed,
  leaderboard,
  onRestart,
  onExit,
}: Props) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {/* Lap (top-left) */}
      <div style={{ ...panel, top: 16, left: 16 }}>
        <div style={label}>Current Lap</div>
        <div style={{ fontSize: 30, fontWeight: 800 }}>
          {lap}
          <span style={{ fontSize: 16, opacity: 0.6 }}> / {totalLaps}</span>
        </div>
      </div>

      {/* Position (top-right) */}
      <div style={{ ...panel, top: 16, right: 16, textAlign: "right" }}>
        <div style={label}>Position</div>
        <div style={{ fontSize: 30, fontWeight: 800 }}>
          {ordinal(rank)}
          <span style={{ fontSize: 16, opacity: 0.6 }}> / {totalRacers}</span>
        </div>
      </div>

      {/* Speed (bottom-right) */}
      <div style={{ ...panel, bottom: 20, right: 16, textAlign: "right" }}>
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{speed}</div>
        <div style={label}>MPH</div>
      </div>

      {/* Controls hint (bottom-left) */}
      <div style={{ ...panel, bottom: 20, left: 16, fontSize: 12, opacity: 0.95 }}>
        <div style={label}>Controls</div>
        <div style={{ marginTop: 4 }}>W/&uarr; accelerate &middot; S/&darr; brake</div>
        <div>A/&larr; left &middot; D/&rarr; right</div>
      </div>

      {/* Countdown (center) */}
      {phase === "countdown" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              fontSize: countdown > 0 ? 160 : 120,
              fontWeight: 900,
              color: countdown > 0 ? "#fff" : "#7CFC57",
              textShadow: "0 6px 30px rgba(0,0,0,0.6)",
            }}
          >
            {countdown > 0 ? countdown : "GO!"}
          </div>
        </div>
      ) : null}

      {/* Finish leaderboard (center modal) */}
      {phase === "finished" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
            background: "rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              ...panel,
              position: "relative",
              width: 420,
              maxWidth: "92%",
              padding: 24,
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 4 }}>
              {rank === 1 ? "You won! \uD83C\uDFC6" : `You finished ${ordinal(rank)}`}
            </div>
            <div style={{ ...label, marginBottom: 14 }}>Final results</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: entry.isPlayer
                      ? "rgba(47,107,255,0.35)"
                      : "rgba(255,255,255,0.06)",
                    fontWeight: entry.isPlayer ? 800 : 500,
                  }}
                >
                  <span>
                    {i + 1}. {entry.label}
                  </span>
                  <span style={{ opacity: 0.8 }}>
                    {entry.finished ? formatTime(entry.finishTime) : "DNF"}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={onRestart} style={primaryBtn}>
                Race again
              </button>
              <button onClick={onExit} style={secondaryBtn}>
                Back to studio
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const primaryBtn: CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#2f6bff",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn: CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.25)",
  background: "transparent",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

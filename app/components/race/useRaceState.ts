'use client'
import { useCallback, useEffect, useState } from "react";
import { TOTAL_LAPS } from "./trackPath";

export type RacePhase = "countdown" | "racing" | "finished";

export type LeaderboardEntry = {
  id: string;
  label: string;
  isPlayer: boolean;
  finished: boolean;
  finishTime: number | null;
};

// Owns the React-facing race state (HUD values + phase). The per-frame physics
// lives in RaceScene and pushes integer updates here, so renders stay cheap.
export function useRaceState() {
  const [phase, setPhase] = useState<RacePhase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [lap, setLap] = useState(1);
  const [rank, setRank] = useState(1);
  const [speed, setSpeed] = useState(0);
  const [totalRacers, setTotalRacers] = useState(4);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Pre-race countdown: 3, 2, 1, GO!, then race.
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown < 0) {
      setPhase("racing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, phase]);

  const reportProgress = useCallback(
    (next: { rank: number; lap: number; speed: number }) => {
      setRank((prev) => (prev === next.rank ? prev : next.rank));
      setLap((prev) => (prev === next.lap ? prev : next.lap));
      setSpeed((prev) => (prev === next.speed ? prev : next.speed));
    },
    [],
  );

  const finishRace = useCallback((board: LeaderboardEntry[]) => {
    setLeaderboard(board);
    setPhase((p) => (p === "finished" ? p : "finished"));
  }, []);

  return {
    phase,
    countdown,
    lap,
    rank,
    speed,
    totalLaps: TOTAL_LAPS,
    totalRacers,
    setTotalRacers,
    leaderboard,
    reportProgress,
    finishRace,
  };
}

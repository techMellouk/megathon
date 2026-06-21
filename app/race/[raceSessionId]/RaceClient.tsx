'use client'
import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import RaceScene from "@/app/components/race/RaceScene";
import RaceHud from "@/app/components/race/RaceHud";
import { useRaceState } from "@/app/components/race/useRaceState";
import { useRaceSoundtrack } from "@/app/components/race/useRaceSoundtrack";

type Props = {
  raceSessionId: string;
  modelId?: string;
};

export default function RaceClient({ modelId }: Props) {
  const router = useRouter();
  const {
    phase,
    countdown,
    lap,
    rank,
    speed,
    totalLaps,
    totalRacers,
    leaderboard,
    reportProgress,
    finishRace,
  } = useRaceState();

  useRaceSoundtrack(phase);

  // Memoize the 3D subtree so frequent HUD updates (speed/lap/rank) don't
  // re-render the canvas. It only rebuilds when modelId or phase changes.
  const scene = useMemo(
    () => (
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 70, near: 0.5, far: 2000, position: [0, 12, -20] }}
      >
        <RaceScene
          modelId={modelId}
          phase={phase}
          onReport={reportProgress}
          onFinish={finishRace}
        />
      </Canvas>
    ),
    [modelId, phase, reportProgress, finishRace],
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0d0b08",
        overflow: "hidden",
      }}
    >
      {scene}
      <RaceHud
        phase={phase}
        countdown={countdown}
        lap={lap}
        totalLaps={totalLaps}
        rank={rank}
        totalRacers={totalRacers}
        speed={speed}
        leaderboard={leaderboard}
        onRestart={() => window.location.reload()}
        onExit={() => router.push("/")}
      />
    </div>
  );
}

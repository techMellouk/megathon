"use client";

import { useEffect, useRef } from "react";
import type { RacePhase } from "./useRaceState";

const TRACK = "/audio/race-soundtrack.mp3";
const START_AT = 5; // seconds into the track when the race goes green

/** Plays the race BGM from the 5s mark once the countdown finishes. */
export function useRaceSoundtrack(phase: RacePhase) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (phase !== "racing") return;

    const audio = new Audio(TRACK);
    audio.currentTime = START_AT;
    audio.loop = true;
    audio.volume = 0.65;
    audioRef.current = audio;

    // Some browsers seek lazily; enforce the 5s start once metadata is ready.
    const onLoaded = () => {
      if (audio.currentTime < START_AT) audio.currentTime = START_AT;
    };
    audio.addEventListener("loadedmetadata", onLoaded);

    void audio.play().catch(() => {
      // Autoplay may be blocked until a gesture; entering the race usually counts.
    });

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [phase]);
}

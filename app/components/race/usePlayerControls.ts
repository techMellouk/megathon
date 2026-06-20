'use client'
import { useEffect, useRef } from "react";

export type PlayerControls = {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
};

const KEY_MAP: Record<string, keyof PlayerControls> = {
  KeyW: "throttle",
  ArrowUp: "throttle",
  KeyS: "brake",
  ArrowDown: "brake",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

// Keyboard driving input. Returns a stable ref so the render loop can read the
// latest state without re-rendering on every key press.
export function usePlayerControls() {
  const controls = useRef<PlayerControls>({
    throttle: false,
    brake: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    function set(code: string, value: boolean, event: KeyboardEvent) {
      const action = KEY_MAP[code];
      if (!action) return;
      event.preventDefault();
      controls.current[action] = value;
    }
    const onDown = (e: KeyboardEvent) => set(e.code, true, e);
    const onUp = (e: KeyboardEvent) => set(e.code, false, e);
    const onBlur = () => {
      controls.current.throttle = false;
      controls.current.brake = false;
      controls.current.left = false;
      controls.current.right = false;
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return controls;
}

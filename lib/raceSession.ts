// Race session storage.
//
// For the MVP this is backed by localStorage on the client. The interface is
// intentionally small and async-friendly so it can later be swapped for a real
// API/DB (e.g. POST /api/race-sessions) without touching the call sites.

export type RaceSession = {
  raceSessionId: string;
  modelId: string;
  paymentId?: string;
  paid: boolean;
  createdAt: number;
};

const SESSION_PREFIX = "megathon:race-session:";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `race_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** Create + persist a new race session and return it. */
export function createRaceSession(input: {
  modelId: string;
  paymentId?: string;
  paid?: boolean;
}): RaceSession {
  const session: RaceSession = {
    raceSessionId: newId(),
    modelId: input.modelId,
    paymentId: input.paymentId,
    paid: input.paid ?? true,
    createdAt: Date.now(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      `${SESSION_PREFIX}${session.raceSessionId}`,
      JSON.stringify(session),
    );
  }
  return session;
}

export function getRaceSession(raceSessionId: string): RaceSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${SESSION_PREFIX}${raceSessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RaceSession;
  } catch {
    return null;
  }
}

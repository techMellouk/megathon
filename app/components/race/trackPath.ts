// Pure track geometry/math shared by the Track mesh, the cars and the race sim.
//
// The track is a closed loop in the XZ plane (y = 0 is the ground). We build a
// smooth closed curve from convex control points (so it never self-intersects),
// then resample it at uniform arc-length spacing. Working in "distance travelled"
// makes constant-speed AI and lap/progress math trivial.

import * as THREE from "three";

export const ROAD_WIDTH = 20;
export const TOTAL_LAPS = 3;
export const GROUND_SIZE = 900;

export type TrackSample = { x: number; z: number; tx: number; tz: number };

const RX = 150;
const RZ = 100;
const CONTROL_COUNT = 16;
// Mild per-point radius variation gives the oval some character while staying
// convex enough to avoid self-intersections.
const RADIUS_VARIATION = [
  1.0, 1.04, 0.95, 1.08, 0.92, 1.0, 1.06, 0.94, 1.02, 0.97, 1.05, 0.9, 1.0, 1.05,
  0.96, 1.03,
];

function buildControlPoints(): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < CONTROL_COUNT; i++) {
    const angle = (i / CONTROL_COUNT) * Math.PI * 2;
    const r = RADIUS_VARIATION[i % RADIUS_VARIATION.length];
    points.push(new THREE.Vector3(Math.cos(angle) * RX * r, 0, Math.sin(angle) * RZ * r));
  }
  return points;
}

const curve = new THREE.CatmullRomCurve3(buildControlPoints(), true, "catmullrom", 0.5);

// 1) Dense sampling to measure arc length.
const DENSE = 4000;
const densePts: THREE.Vector3[] = [];
const denseCum: number[] = [];
{
  let total = 0;
  let prev: THREE.Vector3 | null = null;
  for (let i = 0; i <= DENSE; i++) {
    const p = curve.getPoint((i % DENSE) / DENSE);
    if (prev) total += p.distanceTo(prev);
    densePts.push(p);
    denseCum.push(total);
    prev = p;
  }
}

export const TRACK_LENGTH = denseCum[DENSE];

// 2) Resample at uniform arc-length spacing.
const SAMPLE_COUNT = 900;
export const UNIFORM_SAMPLES: TrackSample[] = [];
{
  const positions: { x: number; z: number }[] = [];
  let j = 0;
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const target = (i / SAMPLE_COUNT) * TRACK_LENGTH;
    while (j < DENSE - 1 && denseCum[j + 1] < target) j++;
    const segLen = denseCum[j + 1] - denseCum[j] || 1;
    const frac = (target - denseCum[j]) / segLen;
    const a = densePts[j];
    const b = densePts[j + 1];
    positions.push({ x: a.x + (b.x - a.x) * frac, z: a.z + (b.z - a.z) * frac });
  }
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const next = positions[(i + 1) % SAMPLE_COUNT];
    const prev = positions[(i - 1 + SAMPLE_COUNT) % SAMPLE_COUNT];
    let tx = next.x - prev.x;
    let tz = next.z - prev.z;
    const len = Math.hypot(tx, tz) || 1;
    tx /= len;
    tz /= len;
    UNIFORM_SAMPLES.push({ x: positions[i].x, z: positions[i].z, tx, tz });
  }
}

/** Position + tangent at a distance travelled along the loop (wraps). */
export function pointAtDistance(distance: number): TrackSample {
  const L = TRACK_LENGTH;
  const d = ((distance % L) + L) % L;
  const f = (d / L) * SAMPLE_COUNT;
  const i0 = Math.floor(f) % SAMPLE_COUNT;
  const i1 = (i0 + 1) % SAMPLE_COUNT;
  const frac = f - Math.floor(f);
  const a = UNIFORM_SAMPLES[i0];
  const b = UNIFORM_SAMPLES[i1];
  let tx = a.tx + (b.tx - a.tx) * frac;
  let tz = a.tz + (b.tz - a.tz) * frac;
  const len = Math.hypot(tx, tz) || 1;
  return {
    x: a.x + (b.x - a.x) * frac,
    z: a.z + (b.z - a.z) * frac,
    tx: tx / len,
    tz: tz / len,
  };
}

/** Nearest-point progress in [0, 1) for an arbitrary world position. */
export function progressFromPosition(x: number, z: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const s = UNIFORM_SAMPLES[i];
    const dx = x - s.x;
    const dz = z - s.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestD) {
      bestD = d2;
      best = i;
    }
  }
  return best / SAMPLE_COUNT;
}

/** Yaw (rotation about +Y) so that local +Z points along the tangent. */
export function headingFromTangent(tx: number, tz: number): number {
  return Math.atan2(tx, tz);
}

/** Centerline points (closed) for building the road ribbon. */
export function getCenterline(): { x: number; z: number }[] {
  return UNIFORM_SAMPLES.map((s) => ({ x: s.x, z: s.z }));
}

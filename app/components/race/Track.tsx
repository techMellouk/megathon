'use client'
import { useMemo } from "react";
import * as THREE from "three";
import {
  UNIFORM_SAMPLES,
  ROAD_WIDTH,
  GROUND_SIZE,
  headingFromTangent,
} from "./trackPath";

// Build a flat ribbon mesh that follows the centerline, offset laterally by
// `centerOffset` (along the road normal) and `width` wide.
function buildRibbon(centerOffset: number, width: number): THREE.BufferGeometry {
  const n = UNIFORM_SAMPLES.length;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < n; i++) {
    const s = UNIFORM_SAMPLES[i];
    // Normal in XZ plane (tangent rotated -90deg).
    const nx = s.tz;
    const nz = -s.tx;
    const cx = s.x + nx * centerOffset;
    const cz = s.z + nz * centerOffset;
    positions.push(cx + nx * (width / 2), 0, cz + nz * (width / 2)); // left
    positions.push(cx - nx * (width / 2), 0, cz - nz * (width / 2)); // right
  }

  for (let i = 0; i < n; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const i2 = (i + 1) % n;
    const c = i2 * 2;
    const d = i2 * 2 + 1;
    indices.push(a, b, c);
    indices.push(c, b, d);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

export default function Track() {
  const road = useMemo(() => buildRibbon(0, ROAD_WIDTH), []);
  const leftKerb = useMemo(() => buildRibbon(ROAD_WIDTH / 2, 1.6), []);
  const rightKerb = useMemo(() => buildRibbon(-ROAD_WIDTH / 2, 1.6), []);
  const centerLine = useMemo(() => buildRibbon(0, 0.6), []);

  const start = UNIFORM_SAMPLES[0];
  const startYaw = headingFromTangent(start.tx, start.tz);

  return (
    <group>
      {/* Ground (night turf) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial color="#14241a" />
      </mesh>

      {/* Road surface */}
      <mesh geometry={road} position={[0, 0.02, 0]} receiveShadow>
        <meshStandardMaterial color="#34343c" side={THREE.DoubleSide} />
      </mesh>

      {/* Glowing gold center line */}
      <mesh geometry={centerLine} position={[0, 0.04, 0]}>
        <meshBasicMaterial color="#f2b53a" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      {/* Kerbs / boundaries */}
      <mesh geometry={leftKerb} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#efe7d2" side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rightKerb} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#efe7d2" side={THREE.DoubleSide} />
      </mesh>

      {/* Start / finish line */}
      <mesh position={[start.x, 0.08, start.z]} rotation={[0, startYaw, 0]}>
        <boxGeometry args={[ROAD_WIDTH, 0.12, 3]} />
        <meshBasicMaterial color="#f4f4f6" toneMapped={false} />
      </mesh>
    </group>
  );
}

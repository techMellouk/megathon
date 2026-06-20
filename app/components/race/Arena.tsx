'use client'
import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { UNIFORM_SAMPLES, ROAD_WIDTH, headingFromTangent } from "./trackPath";

// --- Megathon arena dressing: waving flags, start gantry, floodlights, stands.
// All branding ("MEGATHON") is drawn into canvas textures so it reads in 3D.

const GOLD = "#f2b53a";
const GOLD_BRIGHT = "#ffd06a";
const DARK = "#0c0a07";

function makeBanner(
  text: string,
  sub: string,
  bg: string,
  fg: string,
  w = 512,
  h = 256,
): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = fg;
  ctx.lineWidth = Math.round(h * 0.05);
  ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);

  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${Math.round(h * 0.16)}px 'Arial Narrow', Impact, sans-serif`;
  ctx.fillText(sub, w / 2, h * 0.22);
  ctx.font = `900 ${Math.round(h * 0.42)}px 'Arial Narrow', Impact, sans-serif`;
  ctx.fillText(text, w / 2, h * 0.58);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

function makeCrowd(): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#0a0906";
  ctx.fillRect(0, 0, 512, 128);
  const palette = ["#ffd06a", "#f2b53a", "#d7d2c6", "#9a7b3a", "#fff4d6"];
  for (let i = 0; i < 1100; i++) {
    ctx.fillStyle = palette[(Math.random() * palette.length) | 0];
    ctx.globalAlpha = 0.5 + Math.random() * 0.5;
    ctx.fillRect(Math.random() * 512, Math.random() * 128, 3, 3);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(6, 1);
  return tex;
}

const FLAG_W = 6;
const FLAG_H = 3;
const FLAGS_PER_SIDE = 14;

type FlagInfo = { px: number; pz: number; heading: number; phase: number; gold: boolean };

export default function Arena() {
  const bannerGold = useMemo(() => makeBanner("MEGATHON", "THE RACE", "#100c06", GOLD, 512, 256), []);
  const bannerDark = useMemo(() => makeBanner("MEGATHON", "AMSTERDAM 2026", DARK, GOLD_BRIGHT, 512, 256), []);
  const gantryBanner = useMemo(
    () => makeBanner("MEGATHON", "START · FINISH", DARK, GOLD_BRIGHT, 1024, 256),
    [],
  );
  const crowd = useMemo(() => makeCrowd(), []);

  const baseGeo = useMemo(() => new THREE.PlaneGeometry(FLAG_W, FLAG_H, 16, 6), []);
  const basePos = useMemo(
    () => Float32Array.from(baseGeo.attributes.position.array as Float32Array),
    [baseGeo],
  );

  const flags = useMemo<FlagInfo[]>(() => {
    const n = UNIFORM_SAMPLES.length;
    const step = Math.floor(n / FLAGS_PER_SIDE);
    const arr: FlagInfo[] = [];
    for (let i = 0; i < n; i += step) {
      const s = UNIFORM_SAMPLES[i];
      const nx = s.tz;
      const nz = -s.tx;
      const heading = headingFromTangent(s.tx, s.tz);
      for (const side of [1, -1]) {
        arr.push({
          px: s.x + nx * side * (ROAD_WIDTH / 2 + 5),
          pz: s.z + nz * side * (ROAD_WIDTH / 2 + 5),
          heading,
          phase: (i * 0.6 + (side > 0 ? 0 : 3.1)) % 6.283,
          gold: arr.length % 2 === 0,
        });
      }
    }
    return arr;
  }, []);

  const clothGeos = useMemo(() => flags.map(() => baseGeo.clone()), [flags, baseGeo]);

  // Floodlight + grandstand placement at a few evenly spaced track samples.
  const fixtures = useMemo(() => {
    const n = UNIFORM_SAMPLES.length;
    const at = (frac: number) => {
      const s = UNIFORM_SAMPLES[Math.floor(frac * n) % n];
      return {
        x: s.x,
        z: s.z,
        nx: s.tz,
        nz: -s.tx,
        heading: headingFromTangent(s.tx, s.tz),
      };
    };
    const floodlights = [0.05, 0.3, 0.55, 0.8].map((f) => {
      const p = at(f);
      const off = ROAD_WIDTH / 2 + 16;
      return { x: p.x + p.nx * off, z: p.z + p.nz * off, tx: p.x, tz: p.z };
    });
    const stands = [0.18, 0.68].map((f) => {
      const p = at(f);
      const off = ROAD_WIDTH / 2 + 24;
      return {
        x: p.x + p.nx * off,
        z: p.z + p.nz * off,
        heading: p.heading,
      };
    });
    return { floodlights, stands };
  }, []);

  const start = UNIFORM_SAMPLES[0];
  const startYaw = headingFromTangent(start.tx, start.tz);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let f = 0; f < clothGeos.length; f++) {
      const geo = clothGeos[f];
      const pos = geo.attributes.position.array as Float32Array;
      const phase = flags[f].phase;
      for (let i = 0; i < pos.length; i += 3) {
        const x = basePos[i];
        const y = basePos[i + 1];
        const t01 = (x + FLAG_W / 2) / FLAG_W;
        pos[i + 2] =
          Math.sin(x * 1.4 + t * 5 + phase) * 0.6 * t01 +
          Math.sin(y * 2 + t * 3 + phase) * 0.12 * t01;
      }
      geo.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Waving Megathon flags lining the circuit */}
      {flags.map((fl, i) => (
        <group key={i} position={[fl.px, 0, fl.pz]} rotation={[0, fl.heading, 0]}>
          <mesh position={[0, 5, 0]}>
            <cylinderGeometry args={[0.13, 0.16, 10, 8]} />
            <meshStandardMaterial color="#cfd4da" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 10.2, 0]}>
            <sphereGeometry args={[0.28, 12, 12]} />
            <meshStandardMaterial
              color={GOLD_BRIGHT}
              emissive={GOLD}
              emissiveIntensity={0.7}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          <mesh geometry={clothGeos[i]} position={[FLAG_W / 2 + 0.15, 8.2, 0]}>
            <meshBasicMaterial
              map={fl.gold ? bannerGold : bannerDark}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Start / finish gantry */}
      <group position={[start.x, 0, start.z]} rotation={[0, startYaw, 0]}>
        {[-(ROAD_WIDTH / 2 + 1.5), ROAD_WIDTH / 2 + 1.5].map((x) => (
          <mesh key={x} position={[x, 6.5, 0]}>
            <boxGeometry args={[1.2, 13, 1.2]} />
            <meshStandardMaterial color="#16120c" metalness={0.5} roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, 13.4, 0]}>
          <boxGeometry args={[ROAD_WIDTH + 4, 1.4, 1.6]} />
          <meshStandardMaterial color="#16120c" metalness={0.5} roughness={0.6} />
        </mesh>
        <mesh position={[0, 11.4, 0.85]}>
          <planeGeometry args={[ROAD_WIDTH + 2.4, 3.4]} />
          <meshBasicMaterial map={gantryBanner} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, 11.4, -0.85]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[ROAD_WIDTH + 2.4, 3.4]} />
          <meshBasicMaterial map={gantryBanner} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>

      {/* Stadium floodlights */}
      {fixtures.floodlights.map((fl, i) => {
        const head = new THREE.Vector3(fl.x, 24, fl.z);
        const aim = new THREE.Vector3(fl.tx, 0, fl.tz);
        const dir = aim.clone().sub(head).normalize();
        const yaw = Math.atan2(dir.x, dir.z);
        return (
          <group key={i} position={[fl.x, 0, fl.z]}>
            <mesh position={[0, 12, 0]}>
              <cylinderGeometry args={[0.4, 0.6, 24, 8]} />
              <meshStandardMaterial color="#1a160f" metalness={0.6} roughness={0.5} />
            </mesh>
            <group position={[0, 24, 0]} rotation={[0, yaw, 0]}>
              <mesh>
                <boxGeometry args={[5, 2.4, 1]} />
                <meshStandardMaterial color="#100d08" />
              </mesh>
              <mesh position={[0, 0, 0.55]}>
                <boxGeometry args={[4.6, 2, 0.2]} />
                <meshBasicMaterial color={GOLD_BRIGHT} toneMapped={false} />
              </mesh>
            </group>
            <pointLight
              position={[0, 23, 0]}
              color={"#ffe6b0"}
              intensity={120}
              distance={150}
              decay={1.6}
            />
          </group>
        );
      })}

      {/* Grandstands */}
      {fixtures.stands.map((st, i) => (
        <group key={i} position={[st.x, 0, st.z]} rotation={[0, st.heading, 0]}>
          <mesh position={[0, 5, 3]}>
            <boxGeometry args={[72, 10, 16]} />
            <meshStandardMaterial color="#13100a" metalness={0.3} roughness={0.8} />
          </mesh>
          <mesh position={[0, 7.5, -4.4]} rotation={[-0.5, 0, 0]}>
            <planeGeometry args={[70, 13]} />
            <meshBasicMaterial map={crowd ?? undefined} color={crowd ? "#ffffff" : "#1a1610"} toneMapped={false} />
          </mesh>
          <mesh position={[0, 10.4, 3]}>
            <boxGeometry args={[73, 0.7, 17]} />
            <meshStandardMaterial
              color={GOLD}
              emissive={GOLD}
              emissiveIntensity={0.5}
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

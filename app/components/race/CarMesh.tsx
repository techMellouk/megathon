'use client'
// Simple low-poly arcade car used for opponents and as the player fallback.
// Local space: origin on the ground, car points along +Z (forward).

type Props = { color?: string };

export default function CarMesh({ color = "#d23b3b" }: Props) {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[3.6, 1.3, 7]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 2.4, -0.4]} castShadow>
        <boxGeometry args={[2.8, 1.1, 3.2]} />
        <meshStandardMaterial color="#1d2230" metalness={0.2} roughness={0.4} />
      </mesh>
      {/* Nose wedge (marks the front, +Z) */}
      <mesh position={[0, 1.0, 3.4]} castShadow>
        <boxGeometry args={[3.2, 0.5, 1.2]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Wheels */}
      {([
        [1.9, 0.9, 2.2],
        [-1.9, 0.9, 2.2],
        [1.9, 0.9, -2.2],
        [-1.9, 0.9, -2.2],
      ] as const).map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.9, 0.9, 0.7, 16]} />
          <meshStandardMaterial color="#101013" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

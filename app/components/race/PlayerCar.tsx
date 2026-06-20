'use client'
import { Component, ReactNode, Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import CarMesh from "./CarMesh";

const TARGET_LENGTH = 8; // world units for the car's longest horizontal side

// Loads the generated GLB (served from /api/models/<modelId>) and normalizes it:
// longest horizontal side aligned to +Z (forward), scaled to a consistent size,
// and resting on the ground. WaveSpeed exports are already y-up.
function GeneratedCar({ modelId }: { modelId: string }) {
  const url = `/api/models/${modelId}`;
  const gltf = useGLTF(url);

  const prepared = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.updateMatrixWorld(true);

    let box = new THREE.Box3().setFromObject(root);
    let size = box.getSize(new THREE.Vector3());

    // Align the longer horizontal axis with Z so the car tends to face forward.
    if (size.x > size.z) {
      root.rotation.y += Math.PI / 2;
      root.updateMatrixWorld(true);
      box = new THREE.Box3().setFromObject(root);
      size = box.getSize(new THREE.Vector3());
    }

    const maxHorizontal = Math.max(size.x, size.z) || 1;
    const scale = TARGET_LENGTH / maxHorizontal;

    const group = new THREE.Group();
    group.add(root);
    group.scale.setScalar(scale);
    group.updateMatrixWorld(true);

    const finalBox = new THREE.Box3().setFromObject(group);
    const center = finalBox.getCenter(new THREE.Vector3());
    group.position.x -= center.x;
    group.position.z -= center.z;
    group.position.y -= finalBox.min.y; // sit on the ground

    return group;
  }, [gltf]);

  return <primitive object={prepared} />;
}

// Falls back to the placeholder car if the GLB cannot be fetched/parsed.
class CarErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type Props = { modelId?: string; color?: string };

export default function PlayerCar({ modelId, color = "#3b82f6" }: Props) {
  if (!modelId) {
    return <CarMesh color={color} />;
  }
  return (
    <CarErrorBoundary fallback={<CarMesh color={color} />}>
      <Suspense fallback={<CarMesh color={color} />}>
        <GeneratedCar modelId={modelId} />
      </Suspense>
    </CarErrorBoundary>
  );
}

'use client'
import CarMesh from "./CarMesh";

// Opponent cars use the placeholder mesh. Transform (position/heading) is driven
// by RaceScene via a group ref; this component is purely the visual.
type Props = { color?: string };

export default function OpponentCar({ color }: Props) {
  return <CarMesh color={color} />;
}

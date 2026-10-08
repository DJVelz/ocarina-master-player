"use client";

import type { HoleId } from "@/lib/instruments/twelveHoleC";

type FingeringDiagramProps = {
  covered: HoleId[];
  size?: "sm" | "md" | "lg";
};

type HolePosition = {
  id: HoleId;
  x: number;
  y: number;
  radius: number;
};

const holes: HolePosition[] = [
  // Left hand
  { id: "leftPinky", x: 20, y: 25, radius: 8 },
  { id: "leftRing", x: 42, y: 25, radius: 8 },
  { id: "leftMiddle", x: 64, y: 25, radius: 8 },
  { id: "leftIndex", x: 86, y: 25, radius: 8 },

  // Right hand
  { id: "rightIndex", x: 124, y: 25, radius: 8 },
  { id: "rightMiddle", x: 146, y: 25, radius: 8 },
  { id: "rightRing", x: 168, y: 25, radius: 8 },
  { id: "rightPinky", x: 190, y: 25, radius: 8 },

  // Subholes
  { id: "leftSubhole", x: 64, y: 44, radius: 4 },
  { id: "rightSubhole", x: 146, y: 44, radius: 4 },

  // Thumb holes
  { id: "leftThumb", x: 64, y: 66, radius: 7 },
  { id: "rightThumb", x: 146, y: 66, radius: 7 },
];

const sizes = {
  sm: "w-[105px]",
  md: "w-[180px]",
  lg: "w-[260px]",
};

export default function FingeringDiagram({
  covered,
  size = "md",
}: FingeringDiagramProps) {
  const coveredSet = new Set(covered);

  return (
    <svg
      viewBox="0 0 210 80"
      className={`${sizes[size]} h-auto shrink-0`}
      role="img"
      aria-label="Ocarina fingering diagram"
    >
      {/* Main hole groups */}
      <line
        x1="105"
        y1="12"
        x2="105"
        y2="38"
        stroke="#94a3b8"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {holes.map(({ id, x, y, radius }) => {
        const isCovered = coveredSet.has(id);

        return (
          <circle
            key={id}
            cx={x}
            cy={y}
            r={radius}
            fill={isCovered ? "#0f172a" : "#ffffff"}
            stroke="#0f172a"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}
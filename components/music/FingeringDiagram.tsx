"use client";

import type { HoleId } from "@/lib/instruments/twelveHoleC";

type FingeringDiagramProps = {
  covered: HoleId[];
  size?: "sm" | "md" | "lg";
};

type HolePosition = {
  x: number;
  y: number;
  label: string;
  dashed?: boolean;
};

const holePositions: Record<HoleId, HolePosition> = {
  leftSubhole: {
    x: 65,
    y: 42,
    label: "S",
  },

  leftIndex: {
    x: 115,
    y: 42,
    label: "1",
  },

  leftMiddle: {
    x: 150,
    y: 42,
    label: "2",
  },

  leftRing: {
    x: 185,
    y: 42,
    label: "3",
  },

  leftPinky: {
    x: 220,
    y: 42,
    label: "4",
  },

  rightIndex: {
    x: 260,
    y: 42,
    label: "1",
  },

  rightMiddle: {
    x: 295,
    y: 42,
    label: "2",
  },

  rightRing: {
    x: 330,
    y: 42,
    label: "3",
  },

  rightPinky: {
    x: 365,
    y: 42,
    label: "4",
  },

  rightSubhole: {
    x: 330,
    y: 78,
    label: "S",
  },

  leftThumb: {
    x: 135,
    y: 82,
    label: "T",
    dashed: true,
  },

  rightThumb: {
    x: 295,
    y: 82,
    label: "T",
    dashed: true,
  },
};

const sizeClasses = {
  sm: "w-[180px]",
  md: "w-[280px]",
  lg: "w-[360px]",
};

export default function FingeringDiagram({
  covered,
  size = "md",
}: FingeringDiagramProps) {
  const coveredSet = new Set(covered);

  return (
    <div className={sizeClasses[size]}>
      <svg
        viewBox="0 0 430 125"
        className="h-auto w-full"
        aria-label="12-hole ocarina fingering diagram"
      >
        {/* Ocarina body */}
        <ellipse
          cx="215"
          cy="62"
          rx="190"
          ry="42"
          className="fill-slate-700 stroke-slate-500"
          strokeWidth="2"
        />

        {/* Mouthpiece */}
        <rect
          x="5"
          y="49"
          width="40"
          height="26"
          rx="7"
          className="fill-slate-600 stroke-slate-500"
          strokeWidth="2"
        />

        {(
          Object.entries(holePositions) as [
            HoleId,
            HolePosition,
          ][]
        ).map(([holeId, position]) => {
          const isCovered =
            coveredSet.has(holeId);

          return (
            <g key={holeId}>
              <circle
                cx={position.x}
                cy={position.y}
                r="10"
                className={
                  isCovered
                    ? "fill-slate-950 stroke-white"
                    : "fill-white stroke-slate-950"
                }
                strokeWidth="2"
                strokeDasharray={
                  position.dashed
                    ? "3 2"
                    : undefined
                }
              />

              <text
                x={position.x}
                y={position.y + 3}
                textAnchor="middle"
                className={
                  isCovered
                    ? "fill-white"
                    : "fill-slate-950"
                }
                fontSize="7"
                fontWeight="bold"
              >
                {position.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
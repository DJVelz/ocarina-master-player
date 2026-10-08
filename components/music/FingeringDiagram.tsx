"use client";

import type { HoleId } from "@/lib/instruments/twelveHoleC";

type FingeringDiagramProps = {
  covered: HoleId[];
  size?: "sm" | "md" | "lg";
};

const holePositions: Record<
  HoleId,
  { x: number; y: number; label: string }
> = {
  leftThumb: {
    x: 42,
    y: 38,
    label: "LT",
  },

  leftIndex: {
    x: 82,
    y: 50,
    label: "LI",
  },

  leftMiddle: {
    x: 116,
    y: 50,
    label: "LM",
  },

  leftRing: {
    x: 150,
    y: 50,
    label: "LR",
  },

  leftPinky: {
    x: 184,
    y: 50,
    label: "LP",
  },

  leftSubhole: {
    x: 116,
    y: 82,
    label: "LS",
  },

  rightIndex: {
    x: 216,
    y: 50,
    label: "RI",
  },

  rightMiddle: {
    x: 250,
    y: 50,
    label: "RM",
  },

  rightRing: {
    x: 284,
    y: 50,
    label: "RR",
  },

  rightPinky: {
    x: 318,
    y: 50,
    label: "RP",
  },

  rightThumb: {
    x: 360,
    y: 38,
    label: "RT",
  },

  rightSubhole: {
    x: 250,
    y: 82,
    label: "RS",
  },
};

const sizeClasses = {
  sm: "w-[180px]",
  md: "w-[260px]",
  lg: "w-[340px]",
};

export default function FingeringDiagram({
  covered,
  size = "md",
}: FingeringDiagramProps) {
  const coveredSet = new Set(covered);

  return (
    <div className={sizeClasses[size]}>
      <svg
        viewBox="0 0 400 120"
        className="h-auto w-full"
        aria-label="Ocarina fingering diagram"
      >
        {/* Ocarina body */}
        <rect
          x="25"
          y="25"
          width="350"
          height="55"
          rx="27"
          className="fill-slate-700 stroke-slate-500"
          strokeWidth="2"
        />

        {/* Mouthpiece */}
        <rect
          x="5"
          y="38"
          width="35"
          height="29"
          rx="8"
          className="fill-slate-600 stroke-slate-500"
          strokeWidth="2"
        />

        {/* Holes */}
        {(
          Object.entries(holePositions) as [
            HoleId,
            (typeof holePositions)[HoleId],
          ][]
        ).map(([holeId, position]) => {
          const isCovered =
            coveredSet.has(holeId);

          return (
            <g key={holeId}>
              <circle
                cx={position.x}
                cy={position.y}
                r={11}
                className={
                  isCovered
                    ? "fill-slate-950 stroke-white"
                    : "fill-white stroke-slate-950"
                }
                strokeWidth="2"
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

        {/* Subhole indicator */}
        <text
          x="116"
          y="105"
          textAnchor="middle"
          className="fill-slate-400"
          fontSize="7"
        >
          SUB
        </text>

        <text
          x="250"
          y="105"
          textAnchor="middle"
          className="fill-slate-400"
          fontSize="7"
        >
          SUB
        </text>
      </svg>
    </div>
  );
}
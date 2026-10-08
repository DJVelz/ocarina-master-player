"use client";

import { useMemo } from "react";

import type { OcarinaSong } from "@/lib/music/types";
import { buildSongTimeline } from "@/lib/music/timeline";

import FingeringDiagram from "./FingeringDiagram";
import { getInstrument } from "@/lib/instruments";

type HighwayViewProps = {
  song: OcarinaSong;
  currentTimeMs: number;
};

const PLAY_LINE_PERCENT = 20;
const LOOK_AHEAD_MS = 5000;
const LOOK_BEHIND_MS = 1500;
const PIXELS_PER_SECOND = 240;

export default function HighwayView({
  song,
  currentTimeMs,
}: HighwayViewProps) {
  const timeline = useMemo(
    () => buildSongTimeline(song),
    [song],
  );

  const visibleNotes = timeline.filter((timedNote) => {
    if (timedNote.note.type === "rest") {
      return false;
    }

    return (
      timedNote.endMs >=
        currentTimeMs - LOOK_BEHIND_MS &&
      timedNote.startMs <=
        currentTimeMs + LOOK_AHEAD_MS
    );
  });

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
      {/* Highway background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />

      {/* Lane */}
      <div className="absolute left-0 right-0 top-1/2 h-40 -translate-y-1/2 border-y border-slate-700 bg-slate-800/50" />

      {/* Play line */}
      <div
        className="absolute bottom-0 top-0 z-20 w-1 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
        style={{
          left: `${PLAY_LINE_PERCENT}%`,
        }}
      />

      {/* Play line label */}
      <div
        className="absolute top-3 z-20 -translate-x-1/2 rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950"
        style={{
          left: `${PLAY_LINE_PERCENT}%`,
        }}
      >
        PLAY
      </div>

      {/* Notes */}
      {visibleNotes.map((timedNote) => {
        const offsetSeconds =
          (timedNote.startMs - currentTimeMs) /
          1000;

        const width =
          (timedNote.durationMs / 1000) *
          PIXELS_PER_SECOND;

        const offsetPixels =
          offsetSeconds *
          PIXELS_PER_SECOND;

        const leftPosition =
          `calc(${PLAY_LINE_PERCENT}% + ${offsetPixels}px)`;

        const isActive =
          currentTimeMs >= timedNote.startMs &&
          currentTimeMs < timedNote.endMs;

        return (
            <div
                key={timedNote.note.id}
                className={[
                "absolute top-1/2 z-10",
                "flex h-20 -translate-y-1/2",
                "items-center justify-center",
                "rounded-md border-2 font-bold",
                isActive
                    ? "border-cyan-300 bg-cyan-400 text-slate-950"
                    : "border-indigo-300 bg-indigo-600 text-white",
                ].join(" ")}
                style={{
                left: leftPosition,
                width: `${width}px`,
                }}
            >
                <span className="text-sm">
                {timedNote.note.pitch}
                </span>
            </div>
        );
      })}

      {/* Empty-state message */}
      {visibleNotes.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-slate-400">
          No notes currently visible
        </div>
      )}
    </div>
  );
}
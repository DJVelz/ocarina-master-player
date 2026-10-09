"use client";

import { useMemo } from "react";

import type { OcarinaSong } from "@/lib/music/types";
import { buildSongTimeline, getActiveNote } from "@/lib/music/timeline";

import FingeringDiagram from "./FingeringDiagram";
import { getInstrument } from "@/lib/instruments";

type HighwayViewProps = {
  song: OcarinaSong;
  currentTimeMs: number;
};

const PLAY_LINE_PERCENT = 18;
const PIXELS_PER_BEAT = 480;

export default function HighwayView({
  song,
  currentTimeMs,
}: HighwayViewProps) {
  const timeline = useMemo(
    () => buildSongTimeline(song),
    [song],
  );

  const currentBeat =
  (currentTimeMs / 60000) * song.tempo;

  const activeNote = getActiveNote(
    timeline,
    currentTimeMs,
    );

  const visibleNotes = timeline.filter((timedNote) => {
  if (timedNote.note.type === "rest") {
    return false;
  }

  const relativeStart =
    timedNote.startBeat - currentBeat;

  const relativeEnd =
    timedNote.endBeat - currentBeat;

  return relativeEnd >= -2 &&
    relativeStart <= 8;
});

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
      {/* Highway background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />

      {/* Lane */}
      <div className="absolute left-0 right-0 top-1/2 h-48 -translate-y-1/2 border-y border-slate-700 bg-slate-800/50" />

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
        const offsetBeats =
        timedNote.startBeat - currentBeat;

        const width =
        timedNote.durationBeats *
        PIXELS_PER_BEAT;

        const offsetPixels =
        offsetBeats *
        PIXELS_PER_BEAT;

        const leftPosition =
        `calc(${PLAY_LINE_PERCENT}% + ${offsetPixels}px)`;

        const isActive =
          currentTimeMs >= timedNote.startMs &&
          currentTimeMs < timedNote.endMs;

        const instrument = getInstrument(song.instrument);

        const fingering = timedNote.note.pitch
        ? instrument?.fingerings[
            timedNote.note.pitch as keyof typeof instrument.fingerings
            ]
        : undefined;

        return (
            <div
                key={timedNote.note.id}
                className={[
                "absolute top-1/2 z-10",
                "flex h-34 -translate-y-1/2",
                "flex-col items-center justify-center",
                "gap-2 overflow-hidden rounded-lg border-2",
                "font-bold shadow-lg",
                isActive
                    ? "border-cyan-300 bg-cyan-400 text-slate-950"
                    : "border-indigo-300 bg-indigo-600 text-white",
                ].join(" ")}
                style={{
                left: leftPosition,
                width: `${width}px`,
                }}
            >
                <span className="text-base font-bold">
                {timedNote.note.pitch}
                </span>

                {fingering ? (
                <div className="rounded-md bg-white py-1">
                    <FingeringDiagram
                    covered={fingering.covered}
                    size="sm"
                    />
                </div>
                ) : (
                <span className="text-xs">
                    No fingering
                </span>
                )}
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
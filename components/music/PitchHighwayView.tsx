
"use client";

import { useMemo } from "react";

import type { OcarinaSong } from "@/lib/music/types";
import { buildSongTimeline } from "@/lib/music/timeline";

type PitchHighwayViewProps = {
  song: OcarinaSong;
  currentTimeMs: number;
};

const PIXELS_PER_BEAT = 480;
const PLAY_LINE_PERCENT = 18;

// How far ahead we consider notes for camera framing.
const CAMERA_LOOK_AHEAD_BEATS = 3;

// How much recent pitch context to retain.
const CAMERA_LOOK_BEHIND_BEATS = 0.5;

// Minimum vertical range, measured in semitones.
const MIN_VISIBLE_SEMITONES = 7;

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
];

function pitchToMidi(pitch: string): number | null {
  const match = pitch.match(/^([A-G])([#b]?)(\d+)$/i);

  if (!match) return null;

  const [, letter, accidental, octaveText] = match;

  const naturalNotes: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };

  let semitone = naturalNotes[letter.toUpperCase()];

  if (accidental === "#") semitone++;
  if (accidental === "b") semitone--;

  return (
    (Number(octaveText) + 1) * 12 +
    semitone
  );
}

function midiToPitch(midi: number): string {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;

  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export default function PitchHighwayView({
  song,
  currentTimeMs,
}: PitchHighwayViewProps) {
  const timeline = useMemo(
    () => buildSongTimeline(song),
    [song],
  );

  const pitchedNotes = useMemo(
    () =>
      timeline.flatMap((timedNote) => {
        if (
          timedNote.note.type !== "note" ||
          !timedNote.note.pitch
        ) {
          return [];
        }

        const midi = pitchToMidi(timedNote.note.pitch);

        if (midi === null) return [];

        return [{ ...timedNote, midi }];
      }),
    [timeline],
  );

  const currentBeat =
    (currentTimeMs / 60000) * song.tempo;

  // Notes that influence the vertical camera.
  const cameraNotes = pitchedNotes.filter(
    (note) =>
      note.endBeat >=
        currentBeat - CAMERA_LOOK_BEHIND_BEATS &&
      note.startBeat <=
        currentBeat + CAMERA_LOOK_AHEAD_BEATS,
  );

  // Look at the local melody range rather
  // than the range of the entire song.
  const rangeNotes =
    cameraNotes.length > 0
      ? cameraNotes
      : pitchedNotes;

  const pitches = rangeNotes.map(
    (note) => note.midi,
  );

  const lowestPitch =
    pitches.length > 0 ? Math.min(...pitches) : 60;

  const highestPitch =
    pitches.length > 0 ? Math.max(...pitches) : 72;

  const centerPitch =
    (lowestPitch + highestPitch) / 2;

  const visibleRange = Math.max(
    MIN_VISIBLE_SEMITONES,
    highestPitch - lowestPitch + 3,
  );

  const visibleMin =
    centerPitch - visibleRange / 2;

  const visibleMax =
    centerPitch + visibleRange / 2;

  // Pitch-to-vertical-position mapping.
  // Higher pitches appear nearer the top.
  function pitchY(midi: number): number {
    return (
      10 +
      ((visibleMax - midi) / visibleRange) * 80
    );
  }

  // Display only a small range around playback.
  const visibleNotes = pitchedNotes.filter(
    (note) =>
      note.endBeat >= currentBeat - 2 &&
      note.startBeat <= currentBeat + 5,
  );

  // Only label pitches appearing in the
  // current camera window.
  const visiblePitchLabels = Array.from(
    new Set(cameraNotes.map((note) => note.midi)),
  ).sort((a, b) => b - a);

  const pixelsPerSemitone =
    (0.8 * 380) / visibleRange;

  const noteHeight = Math.max(
    12,
    Math.min(34, pixelsPerSemitone * 0.7),
  );

  return (
    <div className="relative h-[380px] w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-slate-950" />

      {/* Pitch guide lines */}
      {visiblePitchLabels.map((midi) => (
        <div
          key={midi}
          className="absolute left-0 right-0 border-t border-dashed border-slate-700/70 transition-[top] duration-300 ease-in-out"
          style={{
            top: `${pitchY(midi)}%`,
          }}
        >
          <span className="absolute left-2 -translate-y-1/2 rounded bg-slate-950/90 px-1 text-xs text-slate-400">
            {midiToPitch(midi)}
          </span>
        </div>
      ))}

      {/* Play line */}
      <div
        className="absolute bottom-0 top-0 z-20 w-[3px] bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]"
        style={{
          left: `${PLAY_LINE_PERCENT}%`,
        }}
      />

      <div
        className="absolute top-3 z-20 -translate-x-1/2 rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950"
        style={{
          left: `${PLAY_LINE_PERCENT}%`,
        }}
      >
        PLAY
      </div>

      {/* Scrolling pitch notes */}
      {visibleNotes.map((timedNote) => {
        const relativeBeat =
          timedNote.startBeat - currentBeat;

        const leftPixels =
          relativeBeat * PIXELS_PER_BEAT;

        const width =
          timedNote.durationBeats *
          PIXELS_PER_BEAT;

        const isActive =
          currentBeat >= timedNote.startBeat &&
          currentBeat < timedNote.endBeat;

        return (
          <div
            key={timedNote.note.id}
            className={[
              "absolute z-10 flex items-center",
              "justify-center rounded-md border",
              "font-bold shadow-md",
              "transition-[top,height,background-color]",
              "duration-300 ease-in-out",
              isActive
                ? "border-cyan-200 bg-cyan-400 text-slate-950"
                : "border-indigo-300 bg-indigo-600 text-white",
            ].join(" ")}
            style={{
              left: `calc(${PLAY_LINE_PERCENT}% + ${leftPixels}px)`,
              top: `${pitchY(timedNote.midi)}%`,
              transform: "translateY(-50%)",
              width: `${width}px`,
              height: `${noteHeight}px`,
            }}
          >
            <span className="sticky left-2 rounded px-2 text-xs">
              {timedNote.note.pitch}
            </span>
          </div>
        );
      })}

      <div className="absolute bottom-3 left-3 rounded bg-slate-950/80 px-2 py-1 text-xs text-slate-400">
        Adaptive pitch range
      </div>
    </div>
  );
}

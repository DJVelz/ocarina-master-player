
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { OcarinaSong } from "@/lib/music/types";
import { buildSongTimeline } from "@/lib/music/timeline";
import { getInstrument } from "@/lib/instruments";
import FingeringDiagram from "./FingeringDiagram";

type CombinedHighwayViewProps = {
  song: OcarinaSong;
  currentTimeMs: number;
  isFullscreen?: boolean;
};

// Shared horizontal timing
const PIXELS_PER_BEAT = 480;
const PLAY_LINE_PERCENT = 18;

// Adaptive camera settings
const CAMERA_LOOK_AHEAD = 4;
const CAMERA_LOOK_BEHIND = 0.5;
const MIN_VISIBLE_SEMITONES = 7;
const PITCH_PADDING = 2;

// Fixed fullscreen pitch range
const FULL_RANGE_MIN = 69; // A4
const FULL_RANGE_MAX = 89; // F6

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
];

const NATURAL_NOTES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function pitchToMidi(pitch: string): number | null {
  const match = pitch.match(
    /^([A-G])([#b]?)(\d+)$/i,
  );

  if (!match) return null;

  const [, letter, accidental, octave] = match;

  let semitone = NATURAL_NOTES[letter.toUpperCase()];

  if (accidental === "#") semitone++;
  if (accidental === "b") semitone--;

  return (Number(octave) + 1) * 12 + semitone;
}

function midiToPitch(midi: number): string {
  const index = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;

  return `${NOTE_NAMES[index]}${octave}`;
}

function isNaturalPitch(midi: number): boolean {
  return !midiToPitch(midi).includes("#");
}

export default function CombinedHighwayView({
  song,
  currentTimeMs,
  isFullscreen = false,
}: CombinedHighwayViewProps) {
  const pitchAreaRef = useRef<HTMLDivElement>(null);

  const [pitchAreaHeight, setPitchAreaHeight] =
    useState(300);

  // Measure the actual available pitch area height.
  // This changes automatically when the parent enters
  // fullscreen or the practice dock changes size.
  useEffect(() => {
    const element = pitchAreaRef.current;

    if (!element) return;

    const updateHeight = () => {
      const nextHeight = element.clientHeight;

      setPitchAreaHeight((previous) =>
        previous === nextHeight
          ? previous
          : nextHeight,
      );
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Build the timeline once per song.
  const timeline = useMemo(
    () => buildSongTimeline(song),
    [song],
  );

  const instrument = getInstrument(song.instrument);

  // Convert notes into numerical pitches.
  const pitchedNotes = useMemo(() => {
    return timeline.flatMap((timedNote) => {
      if (
        timedNote.note.type !== "note" ||
        !timedNote.note.pitch
      ) {
        return [];
      }

      const midi = pitchToMidi(timedNote.note.pitch);

      if (midi === null) return [];

      return [
        {
          ...timedNote,
          midi,
          pitch: timedNote.note.pitch,
        },
      ];
    });
  }, [timeline]);

  // Practice speed is already applied by the
  // playback engine to currentTimeMs.
  const currentBeat =
    (currentTimeMs / 60_000) * song.tempo;

  // Both highways use this exact same list.
  const visibleNotes = pitchedNotes.filter(
    (note) =>
      note.endBeat >= currentBeat - 2 &&
      note.startBeat <= currentBeat + 6,
  );

  // Find notes that influence the adaptive camera.
  const cameraNotes = pitchedNotes.filter(
    (note) =>
      note.endBeat >=
        currentBeat - CAMERA_LOOK_BEHIND &&
      note.startBeat <=
        currentBeat + CAMERA_LOOK_AHEAD,
  );

  const nextNote = pitchedNotes.find(
    (note) => note.startBeat > currentBeat,
  );

  const rangeNotes =
    cameraNotes.length > 0
      ? cameraNotes
      : nextNote
        ? [nextNote]
        : pitchedNotes.slice(-1);

  const pitches = rangeNotes.map((note) => note.midi);

  const lowestPitch =
    pitches.length > 0
      ? Math.min(...pitches)
      : 72;

  const highestPitch =
    pitches.length > 0
      ? Math.max(...pitches)
      : 79;

  // Adaptive vertical camera
  const centerPitch =
    (lowestPitch + highestPitch) / 2;

  const visibleRange = Math.max(
    MIN_VISIBLE_SEMITONES,
    highestPitch -
      lowestPitch +
      PITCH_PADDING * 2,
  );

  // Fullscreen always shows A4 through F6.
  const visibleMin = isFullscreen
    ? FULL_RANGE_MIN
    : centerPitch - visibleRange / 2;

  const visibleMax = isFullscreen
    ? FULL_RANGE_MAX
    : centerPitch + visibleRange / 2;

  const effectiveRange = visibleMax - visibleMin;

  // Use the actual available height to size the
  // pitch bars, especially in fullscreen.
  const verticalPadding = isFullscreen ? 32 : 20;

  const availableLaneHeight = Math.max(
    1,
    pitchAreaHeight - verticalPadding * 2,
  );

  const pixelsPerSemitone =
    availableLaneHeight / effectiveRange;

  const noteHeight = isFullscreen
    ? Math.max(
        8,
        Math.min(24, pixelsPerSemitone * 0.7),
      )
    : Math.max(
        12,
        Math.min(30, pixelsPerSemitone * 0.7),
      );

  const topPaddingPx = Math.max(
    24,
    noteHeight / 2 + 8,
  );

  const bottomPaddingPx = Math.max(
    16,
    noteHeight / 2 + 8,
  );

  const usablePitchHeight = Math.max(
    1,
    pitchAreaHeight -
      topPaddingPx -
      bottomPaddingPx,
  );

  // Actual pixel position within the pitch area.
  function pitchY(midi: number): number {
    return (
      topPaddingPx +
      ((visibleMax - midi) / effectiveRange) *
        usablePitchHeight
    );
  }

  // Fullscreen displays the entire chromatic scale.
  const pitchLabels = isFullscreen
    ? Array.from(
        {
          length:
            FULL_RANGE_MAX - FULL_RANGE_MIN + 1,
        },
        (_, index) => FULL_RANGE_MAX - index,
      )
    : Array.from(
        {
          length:
            Math.floor(visibleMax) -
            Math.ceil(visibleMin) +
            1,
        },
        (_, index) =>
          Math.floor(visibleMax) - index,
      ).filter(
        (midi) => midi >= Math.ceil(visibleMin),
      );

  function getFingering(pitch: string) {
    if (!instrument) return undefined;

    return instrument.fingerings[
      pitch as keyof typeof instrument.fingerings
    ];
  }

  // Shared geometry for both sections.
  function getNotePosition(
    startBeat: number,
    durationBeats: number,
  ) {
    const offsetBeats = startBeat - currentBeat;

    return {
      left: `calc(${PLAY_LINE_PERCENT}% + ${
        offsetBeats * PIXELS_PER_BEAT
      }px)`,
      width: `${durationBeats * PIXELS_PER_BEAT}px`,
    };
  }

  return (
    <div
      className={[
        "relative flex w-full flex-col overflow-hidden",
        "border border-slate-700 bg-slate-950",
        isFullscreen
          ? "h-full min-h-0 rounded-none"
          : "rounded-xl",
      ].join(" ")}
    >
      {/* SINGLE SHARED PLAY LINE */}
      <div
        className="pointer-events-none absolute inset-y-0 z-30 w-[3px] bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)]"
        style={{
          left: `${PLAY_LINE_PERCENT}%`,
        }}
      />

      <div
        className="pointer-events-none absolute top-2 z-40 -translate-x-1/2 rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950"
        style={{
          left: `${PLAY_LINE_PERCENT}%`,
        }}
      >
        PLAY
      </div>

      {/* UPPER: FINGERING HIGHWAY */}
      <div
        className={[
          "relative shrink-0 overflow-hidden bg-slate-800/80",
          isFullscreen
            ? "h-[clamp(140px,25dvh,205px)]"
            : "h-[205px]",
        ].join(" ")}
      >
        <span className="absolute left-3 top-3 z-20 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Fingerings
        </span>

        <div className="absolute inset-x-0 bottom-4 top-10 border-y border-slate-700 bg-slate-800/40" />

        {visibleNotes.map((timedNote) => {
          const position = getNotePosition(
            timedNote.startBeat,
            timedNote.durationBeats,
          );

          const isActive =
            currentBeat >= timedNote.startBeat &&
            currentBeat < timedNote.endBeat;

          const fingering = getFingering(
            timedNote.pitch,
          );

          return (
            <div
              key={timedNote.note.id}
              className={[
                "absolute top-[56%] z-10",
                "flex h-[125px] -translate-y-1/2",
                "items-center justify-center",
                "overflow-hidden rounded-lg border-2 shadow-lg",
                isActive
                  ? "border-cyan-200 bg-cyan-400"
                  : "border-indigo-300 bg-indigo-600",
              ].join(" ")}
              style={position}
            >
              <div className="absolute left-1 top-1/2 flex w-[112px] -translate-y-1/2 flex-col items-center gap-2">
                <span
                  className={[
                    "text-sm font-bold",
                    isActive
                      ? "text-slate-950"
                      : "text-white",
                  ].join(" ")}
                >
                  {timedNote.pitch}
                </span>

                {fingering ? (
                  <div className="rounded-md bg-white p-1 shadow-sm">
                    <FingeringDiagram
                      covered={fingering.covered}
                      size="sm"
                    />
                  </div>
                ) : (
                  <span className="rounded bg-white/90 px-2 py-2 text-center text-[10px] text-slate-700">
                    No fingering
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION DIVIDER */}
      <div className="relative z-20 h-px shrink-0 bg-slate-600" />

      {/* LOWER: PITCH HIGHWAY */}
      <div
        ref={pitchAreaRef}
        className={[
          "relative min-h-0 overflow-hidden bg-slate-900",
          isFullscreen
            ? "h-0 flex-1"
            : "h-[300px] shrink-0",
        ].join(" ")}
      >
        <span className="absolute left-3 top-2 z-20 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Pitch
        </span>

        {/* PITCH GRID */}
        {pitchLabels.map((midi) => (
          <div
            key={midi}
            className={[
              "pointer-events-none absolute inset-x-0",
              "border-t border-dashed border-slate-700/60",
              !isFullscreen
                ? "transition-[top] duration-300 ease-in-out"
                : "",
            ].join(" ")}
            style={{
              top: `${pitchY(midi)}px`,
            }}
          >
            {(!isFullscreen || isNaturalPitch(midi)) && (
              <span className="absolute left-2 -translate-y-1/2 bg-slate-900/90 px-1 text-[10px] text-slate-400">
                {midiToPitch(midi)}
              </span>
            )}
          </div>
        ))}

        {/* PITCH NOTE BARS */}
        {visibleNotes.map((timedNote) => {
          const position = getNotePosition(
            timedNote.startBeat,
            timedNote.durationBeats,
          );

          // Same active-note condition as fingerings.
          const isActive =
            currentBeat >= timedNote.startBeat &&
            currentBeat < timedNote.endBeat;

          return (
            <div
              key={timedNote.note.id}
              className={[
                "absolute z-10 flex items-center",
                "overflow-hidden rounded-md border shadow-md",
                !isFullscreen
                  ? "transition-[top,height] duration-300 ease-in-out"
                  : "",
                isActive
                  ? "border-cyan-200 bg-cyan-400 text-slate-950"
                  : "border-indigo-300 bg-indigo-600 text-white",
              ].join(" ")}
              style={{
                ...position,
                top: `${pitchY(timedNote.midi)}px`,
                transform: "translateY(-50%)",
                height: `${noteHeight}px`,
              }}
            >
              <span className="sticky left-2 px-2 text-xs font-bold">
                {timedNote.pitch}
              </span>
            </div>
          );
        })}

        {!isFullscreen && (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded bg-slate-950/80 px-2 py-1 text-xs text-slate-400">
            Adaptive pitch range
          </div>
        )}
      </div>
    </div>
  );
}

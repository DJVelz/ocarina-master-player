
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
};

// Shared horizontal settings
const PIXELS_PER_BEAT = 480;
const PLAY_LINE_PERCENT = 18;

// Adaptive pitch camera
const CAMERA_LOOK_AHEAD = 4;
const CAMERA_LOOK_BEHIND = 0.5;
const MIN_VISIBLE_SEMITONES = 7;
const PITCH_PADDING = 2;
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

export default function CombinedHighwayView({
  song,
  currentTimeMs,
}: CombinedHighwayViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(
        document.fullscreenElement === containerRef.current,
      );
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen();
      } else if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen unavailable:", error);
    }
  }

  const timeline = useMemo(
    () => buildSongTimeline(song),
    [song],
  );

  const instrument = getInstrument(song.instrument);

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

      return [{
        ...timedNote,
        midi,
      }];
    });
  }, [timeline]);

  // The engine already adjusts currentTimeMs
  // according to practice speed.
  const currentBeat =
    (currentTimeMs / 60000) * song.tempo;

  // Visible timeline section.
  const visibleNotes = pitchedNotes.filter(
    (note) =>
      note.endBeat >= currentBeat - 2 &&
      note.startBeat <= currentBeat + 6,
  );

  // Determine which pitches affect the camera.
  const cameraNotes = pitchedNotes.filter(
    (note) =>
      note.endBeat >=
        currentBeat - CAMERA_LOOK_BEHIND &&
      note.startBeat <=
        currentBeat + CAMERA_LOOK_AHEAD,
  );

  // If there are no nearby notes, prefer the
  // next upcoming note rather than the whole song.
  const nextNote = pitchedNotes.find(
    (note) => note.startBeat > currentBeat,
  );

  const rangeNotes =
    cameraNotes.length > 0
      ? cameraNotes
      : nextNote
        ? [nextNote]
        : pitchedNotes.slice(-1);

  const pitches = rangeNotes.map(
    (note) => note.midi,
  );

  const lowestPitch =
    pitches.length > 0
      ? Math.min(...pitches)
      : 72;

  const highestPitch =
    pitches.length > 0
      ? Math.max(...pitches)
      : 79;

  // Adaptive vertical framing.
  const centerPitch =
    (lowestPitch + highestPitch) / 2;

  const visibleRange = Math.max(
    MIN_VISIBLE_SEMITONES,
    highestPitch - lowestPitch + PITCH_PADDING * 2,
  );

  const visibleMax = isFullscreen
    ? FULL_RANGE_MAX + 0.5
    : centerPitch + visibleRange / 2;

  const visibleMin = isFullscreen
    ? FULL_RANGE_MIN - 0.5
    : centerPitch - visibleRange / 2;

  const effectiveRange = visibleMax - visibleMin;

  // Map MIDI pitch into the pitch section.
  function pitchY(midi: number): number {
    return (
      10 +
      ((visibleMax - midi) / visibleRange) * 80
    );
  }

  // Show the chromatic lanes currently in view.
  const pitchLabels = Array.from(
    {
      length:
        Math.floor(visibleMax) -
        Math.ceil(visibleMin) +
        1,
    },
    (_, index) =>
      Math.floor(visibleMax) - index,
  ).filter(
    (midi) =>
      midi >= Math.ceil(visibleMin),
  );

  const noteHeight = isFullscreen
  ? 20
  : Math.max(
      16,
      Math.min(
        30,
        (280 * 0.8 / effectiveRange) * 0.75,
      ),
    );

  function getFingering(pitch: string) {
    if (!instrument) return undefined;

    return instrument.fingerings[
      pitch as keyof typeof instrument.fingerings
    ];
  }

  return (
    <div
      ref={containerRef}
      className={[
        "relative flex w-full flex-col overflow-hidden",
        "border border-slate-700 bg-slate-950",
        isFullscreen
          ? "h-screen rounded-none"
          : "rounded-xl",
      ].join(" ")}
    >

    <button
      type="button"
      onClick={toggleFullscreen}
      className="absolute right-4 top-3 z-50 rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-slate-800"
    >
      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
    </button>

      {/* One shared play line */}
      <div
        className="pointer-events-none absolute bottom-0 top-0 z-30 w-[3px] bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)]"
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

      {/* UPPER SECTION: FINGERINGS */}
      <div
        className={[
          "relative shrink-0 overflow-hidden bg-slate-800/80",
          isFullscreen ? "h-[205px]" : "h-[205px]",
        ].join(" ")}
      >

        <span className="absolute left-3 top-3 z-20 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Fingerings
        </span>

        <div className="absolute inset-x-0 bottom-4 top-10 border-y border-slate-700 bg-slate-800/40" />

        {visibleNotes.map((timedNote) => {
          const offsetBeats =
            timedNote.startBeat - currentBeat;

          const width =
            timedNote.durationBeats *
            PIXELS_PER_BEAT;

          const left =
            `calc(${PLAY_LINE_PERCENT}% + ${
              offsetBeats * PIXELS_PER_BEAT
            }px)`;

          const isActive =
            currentBeat >= timedNote.startBeat &&
            currentBeat < timedNote.endBeat;

          const fingering = getFingering(
            timedNote.note.pitch!,
          );

          return (
            <div
              key={timedNote.note.id}
              className={[
                "absolute top-[53%] z-10",
                "flex h-[125px] -translate-y-1/2",
                "items-center justify-center",
                "rounded-lg border-2 shadow-lg",
                isActive
                  ? "border-cyan-200 bg-cyan-400"
                  : "border-indigo-300 bg-indigo-600",
              ].join(" ")}
              style={{
                left,
                width: `${width}px`,
              }}
            >
              {/* Label and diagram near note start.
                  Do not stretch them with duration. */}
              <div className="absolute left-2 top-1/2 flex w-[112px] -translate-y-1/2 flex-col items-center gap-2">

                <span
                  className={[
                    "text-sm font-bold",
                    isActive
                      ? "text-slate-950"
                      : "text-white",
                  ].join(" ")}
                >
                  {timedNote.note.pitch}
                </span>

                {fingering ? (
                  <div className="rounded-md bg-white p-1 shadow-sm">
                    <FingeringDiagram
                      covered={fingering.covered}
                      size="sm"
                    />
                  </div>
                ) : (
                  <span className="rounded bg-white/90 px-1 py-2 text-center text-[10px] text-slate-700">
                    No fingering
                  </span>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* Divider between the two areas */}
      <div className="relative z-20 h-px bg-slate-600" />

      {/* LOWER SECTION: ADAPTIVE PITCH */}
      <div
        className={[
          "relative overflow-hidden bg-slate-900",
          isFullscreen
            ? "min-h-0 flex-1"
            : "h-[300px] shrink-0",
        ].join(" ")}
      >

        <span className="absolute left-3 top-3 z-20 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Pitch
        </span>

        {/* Pitch grid lines */}
        {pitchLabels.map((midi) => (
          <div
            key={midi}
            className="absolute inset-x-0 border-t border-dashed border-slate-700/60 transition-[top] duration-300 ease-in-out"
            style={{
              top: `${pitchY(midi)}%`,
            }}
          >
            <span className="absolute left-2 -translate-y-1/2 bg-slate-900/90 px-1 text-[10px] text-slate-400">
              {midiToPitch(midi)}
            </span>
          </div>
        ))}

        {/* Pitched note bars */}
        {visibleNotes.map((timedNote) => {
          const offsetBeats =
            timedNote.startBeat - currentBeat;

          const width =
            timedNote.durationBeats *
            PIXELS_PER_BEAT;

          const left =
            `calc(${PLAY_LINE_PERCENT}% + ${
              offsetBeats * PIXELS_PER_BEAT
            }px)`;

          const isActive =
            currentBeat >= timedNote.startBeat &&
            currentBeat < timedNote.endBeat;

          return (
            <div
              key={timedNote.note.id}
              className={[
                "absolute z-10 flex",
                "items-center justify-start",
                "overflow-hidden rounded-md border",
                "shadow-md",
                "transition-[top,height,background-color]",
                "duration-300 ease-in-out",
                isActive
                  ? "border-cyan-200 bg-cyan-400 text-slate-950"
                  : "border-indigo-300 bg-indigo-600 text-white",
              ].join(" ")}
              style={{
                left,
                top: `${pitchY(timedNote.midi)}%`,
                transform: "translateY(-50%)",
                width: `${width}px`,
                height: `${noteHeight}px`,
              }}
            >
              <span className="sticky left-2 px-2 text-xs font-bold">
                {timedNote.note.pitch}
              </span>
            </div>
          );
        })}

        <div className="absolute bottom-3 right-3 rounded bg-slate-950/80 px-2 py-1 text-xs text-slate-400">
          Adaptive pitch range
        </div>
      </div>
    </div>
  );
}

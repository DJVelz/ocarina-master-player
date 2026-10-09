
"use client";

import { useEffect, useRef } from "react";

import {
  Accidental,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from "vexflow";

import type {
  OcarinaSong,
  SongNote,
} from "@/lib/music/types";

import { validateMeasure } from "@/lib/music/validation";

type SheetViewProps = {
  song: OcarinaSong;
  activeNoteId?: string | null;

  loopEnabled?: boolean;
  loopStartMeasure?: number;
  loopEndMeasure?: number;

  onMeasureClick?: (measureNumber: number) => void;
};

// Sheet layout settings
const MEASURES_PER_ROW = 4;
const MEASURE_WIDTH = 200;
const MEASURE_HEIGHT = 150;

const LEFT_MARGIN = 40;
const TOP_MARGIN = 30;

const durationToVexFlow = {
  whole: "w",
  half: "h",
  quarter: "q",
  eighth: "8",
  sixteenth: "16",
} as const;

// Convert our SongNote into a VexFlow note
function songNoteToVexFlow(note: SongNote): StaveNote {
  const duration = note.dotted
    ? `${durationToVexFlow[note.duration]}d`
    : durationToVexFlow[note.duration];

  // Rest
  if (note.type === "rest") {
    const rest = new StaveNote({
      keys: ["b/4"],
      duration: `${duration}r`,
    });

    if (note.dotted) {
      Dot.buildAndAttach([rest], { all: true });
    }

    return rest;
  }

  if (!note.pitch) {
    throw new Error(
      `Note ${note.id} is missing a pitch.`,
    );
  }

  const match = note.pitch.match(
    /^([A-Ga-g])([#b]?)(\d)$/,
  );

  if (!match) {
    throw new Error(
      `Invalid pitch: ${note.pitch}`,
    );
  }

  const [, letter, accidental, octave] = match;

  const vexNote = new StaveNote({
    keys: [`${letter.toLowerCase()}/${octave}`],
    duration,
  });

  if (accidental) {
    vexNote.addModifier(
      new Accidental(accidental),
      0,
    );
  }

  if (note.dotted) {
    Dot.buildAndAttach([vexNote], {
      all: true,
    });
  }

  return vexNote;
}

// Get the position of a measure on the sheet
function getMeasurePosition(index: number) {
  const row = Math.floor(
    index / MEASURES_PER_ROW,
  );

  const column = index % MEASURES_PER_ROW;

  return {
    x: LEFT_MARGIN + column * MEASURE_WIDTH,
    y: TOP_MARGIN + row * MEASURE_HEIGHT,
  };
}

export default function SheetView({
  song,
  activeNoteId,
  loopEnabled = false,
  loopStartMeasure,
  loopEndMeasure,
  onMeasureClick,
}: SheetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const rowCount = Math.ceil(
    song.measures.length / MEASURES_PER_ROW,
  );

  const sheetWidth =
    LEFT_MARGIN +
    MEASURES_PER_ROW * MEASURE_WIDTH +
    40;

  const sheetHeight =
    TOP_MARGIN +
    rowCount * MEASURE_HEIGHT +
    30;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // Clear previous SVG before re-rendering
    container.innerHTML = "";

    const renderer = new Renderer(
      container,
      Renderer.Backends.SVG,
    );

    renderer.resize(
      sheetWidth,
      sheetHeight,
    );

    const context = renderer.getContext();

    song.measures.forEach((measure, index) => {
      const { x, y } = getMeasurePosition(index);

      const validation = validateMeasure(
        measure,
        song,
      );

      // Log invalid measures
      if (!validation.valid) {
        console.warn(
          `Measure ${measure.number} is invalid.`,
          validation,
        );

        return;
      }

      // Create stave
      const stave = new Stave(
        x,
        y,
        MEASURE_WIDTH,
      );

      // First measure gets clef and time signature
      if (index === 0) {
        stave.addClef("treble");

        stave.addTimeSignature(
          `${song.timeSignature.beats}/${song.timeSignature.beatValue}`,
        );
      }

      stave.setContext(context).draw();

      // Convert song notes to VexFlow notes
      const notes = measure.notes.map((note) => {
        const vexNote = songNoteToVexFlow(note);

        // Highlight active note
        if (note.id === activeNoteId) {
          vexNote.setStyle({
            fillStyle: "#06b6d4",
            strokeStyle: "#06b6d4",
          });
        }

        return vexNote;
      });

      const voice = new Voice({
        numBeats: song.timeSignature.beats,
        beatValue: song.timeSignature.beatValue,
      });

      voice.addTickables(notes);

      // Format notes within the measure
      new Formatter()
        .joinVoices([voice])
        .format(
          [voice],
          MEASURE_WIDTH - 20,
        );

      voice.draw(context, stave);
    });

    return () => {
      container.innerHTML = "";
    };
  }, [
    song,
    activeNoteId,
    sheetWidth,
    sheetHeight,
  ]);

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-6">
      <div
        className="relative"
        style={{
          width: sheetWidth,
          height: sheetHeight,
        }}
      >
        {/* VexFlow rendering */}
        <div ref={containerRef} />

        {/* Clickable measure overlays */}
        {song.measures.map((measure, index) => {
          const { x, y } = getMeasurePosition(index);

          const isSelected =
            loopEnabled &&
            loopStartMeasure !== undefined &&
            loopEndMeasure !== undefined &&
            measure.number >= loopStartMeasure &&
            measure.number <= loopEndMeasure;

          return (
            <button
              key={measure.number}
              type="button"
              disabled={!onMeasureClick}
              onClick={() => {
                onMeasureClick?.(measure.number);
              }}
              aria-label={
                `Select measure ${measure.number} for looping`
              }
              aria-pressed={isSelected}
              title={`Measure ${measure.number}`}
              className={[
                "absolute z-10 rounded-md border-2",
                "transition-colors",
                "focus-visible:outline",
                "focus-visible:outline-2",
                "focus-visible:outline-cyan-600",
                isSelected
                  ? "border-cyan-500 bg-cyan-400/10"
                  : "border-transparent hover:border-cyan-400/60 hover:bg-cyan-400/10",
                onMeasureClick
                  ? "cursor-pointer"
                  : "cursor-default",
              ].join(" ")}
              style={{
                left: x,
                top: y + 5,
                width: MEASURE_WIDTH,
                height: 105,
              }}
            >
              {/* Measure number */}
              <span className="absolute left-2 top-1 rounded bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {measure.number}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


"use client";

import { useEffect, useRef } from "react";

import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Accidental,
  Dot,
} from "vexflow";

import type {
  OcarinaSong,
  SongNote,
} from "@/lib/music/types";

type DroppedNote = {
  type: "note" | "rest";
  pitch?: string;
  duration: SongNote["duration"];
};

type SheetViewProps = {
  song: OcarinaSong;

  // Playback highlighting
  activeNoteId?: string | null;

  // Practice mode: measure looping
  loopEnabled?: boolean;
  loopStartMeasure?: number;
  loopEndMeasure?: number;
  onMeasureClick?: (measureNumber: number) => void;

  // Song builder: drag-and-drop
  onNoteDrop?: (
    measureNumber: number,
    note: DroppedNote,
  ) => void;
};

// Layout constants
const MEASURES_PER_ROW = 4;
const MEASURE_WIDTH = 220;
const ROW_HEIGHT = 165;

const LEFT_MARGIN = 20;
const TOP_MARGIN = 34;
const BOTTOM_MARGIN = 32;

const STAVE_TOP_OFFSET = 25;

// VexFlow duration values
const DURATION_MAP: Record<
  SongNote["duration"],
  string
> = {
  whole: "w",
  half: "h",
  quarter: "q",
  eighth: "8",
  sixteenth: "16",
};

const DURATION_BEATS: Record<
  SongNote["duration"],
  number
> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
};

function noteBeats(note: SongNote): number {
  const beats = DURATION_BEATS[note.duration];
  return note.dotted ? beats * 1.5 : beats;
}

function measureBeats(
  song: OcarinaSong,
): number {
  return (
    song.timeSignature.beats *
    (4 / song.timeSignature.beatValue)
  );
}

function pitchToVexKey(pitch?: string): string {
  if (!pitch) return "b/4";

  const match = pitch.match(
    /^([A-G])([#b]?)(\d+)$/i,
  );

  if (!match) return "c/5";

  const [, letter, accidental, octave] = match;

  return `${letter.toLowerCase()}${accidental}/${octave}`;
}

function getAccidental(
  note: SongNote,
): string | null {
  if (note.accidental === "sharp") return "#";
  if (note.accidental === "flat") return "b";
  if (note.accidental === "natural") return "n";

  if (note.pitch?.includes("#")) return "#";

  if (/^[A-G]b\d+$/i.test(note.pitch ?? "")) {
    return "b";
  }

  return null;
}

function createVexNote(
  note: SongNote,
  isActive: boolean,
): StaveNote {
  const isRest = note.type === "rest";

  const duration = [
    DURATION_MAP[note.duration],
    note.dotted ? "d" : "",
    isRest ? "r" : "",
  ].join("");

  const vexNote = new StaveNote({
    clef: "treble",
    keys: [
      isRest
        ? "b/4"
        : pitchToVexKey(note.pitch),
    ],
    duration,
  });

  if (!isRest) {
    const accidental = getAccidental(note);

    if (accidental) {
      vexNote.addModifier(
        new Accidental(accidental),
      );
    }
  }

  if (note.dotted) {
    Dot.buildAndAttach(
      [vexNote],
      { all: true },
    );
  }

  // Highlight the currently playing note.
  if (isActive) {
    vexNote.setStyle({
      fillStyle: "#06b6d4",
      strokeStyle: "#06b6d4",
    });
  }

  return vexNote;
}

function isValidDroppedNote(
  value: unknown,
): value is DroppedNote {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const note = value as Partial<DroppedNote>;

  const validDurations = [
    "whole",
    "half",
    "quarter",
    "eighth",
    "sixteenth",
  ];

  if (
    note.type !== "note" &&
    note.type !== "rest"
  ) {
    return false;
  }

  if (!validDurations.includes(note.duration ?? "")) {
    return false;
  }

  if (note.type === "note") {
    return (
      typeof note.pitch === "string" &&
      /^[A-G][#b]?\d+$/i.test(note.pitch)
    );
  }

  return true;
}

export default function SheetView({
  song,
  activeNoteId = null,

  loopEnabled = false,
  loopStartMeasure = 1,
  loopEndMeasure = 1,
  onMeasureClick,

  onNoteDrop,
}: SheetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const rowCount = Math.max(
    1,
    Math.ceil(
      song.measures.length / MEASURES_PER_ROW,
    ),
  );

  const canvasWidth =
    LEFT_MARGIN * 2 +
    MEASURE_WIDTH * MEASURES_PER_ROW;

  const canvasHeight =
    TOP_MARGIN +
    ROW_HEIGHT * rowCount +
    BOTTOM_MARGIN;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    container.innerHTML = "";

    const renderer = new Renderer(
      container,
      Renderer.Backends.SVG,
    );

    renderer.resize(
      canvasWidth,
      canvasHeight,
    );

    const context = renderer.getContext();
    context.setFillStyle("#0f172a");
    context.setStrokeStyle("#0f172a");

    const expectedBeats = measureBeats(song);

    song.measures.forEach((measure, index) => {
      const row = Math.floor(
        index / MEASURES_PER_ROW,
      );

      const column =
        index % MEASURES_PER_ROW;

      const x =
        LEFT_MARGIN +
        column * MEASURE_WIDTH;

      const y =
        TOP_MARGIN +
        row * ROW_HEIGHT +
        STAVE_TOP_OFFSET;

      const stave = new Stave(
        x,
        y,
        MEASURE_WIDTH,
      );

      // Each staff row starts with a treble clef
      // and time signature.
      if (column === 0) {
        stave.addClef("treble");

        stave.addTimeSignature(
          `${song.timeSignature.beats}/` +
          `${song.timeSignature.beatValue}`,
        );
      }

      stave.setContext(context).draw();

      // Display measure numbers above the staff.
      context.save();
      context.setFillStyle("#64748b");
      context.setFont("Arial", 11, "");

      context.fillText(
        String(measure.number),
        x + 5,
        y - 10,
      );

      context.restore();

      if (measure.notes.length === 0) {
        return;
      }

      const actualBeats = measure.notes.reduce(
        (total, note) =>
          total + noteBeats(note),
        0,
      );

      // Prevent overfull measures from crashing VexFlow.
      if (actualBeats > expectedBeats + 0.00001) {
        console.warn(
          `Measure ${measure.number} is overfull.`,
        );
        return;
      }

      try {
        const vexNotes = measure.notes.map(
          (note) =>
            createVexNote(
              note,
              note.id === activeNoteId,
            ),
        );

        const voice = new Voice({
          num_beats: song.timeSignature.beats,
          beat_value: song.timeSignature.beatValue,
        });

        // Soft mode allows incomplete measures
        // while the user is editing a composition.
        voice.setMode(Voice.Mode.SOFT);
        voice.addTickables(vexNotes);

        const reservedWidth =
          column === 0 ? 75 : 25;

        new Formatter()
          .joinVoices([voice])
          .format(
            [voice],
            MEASURE_WIDTH - reservedWidth,
          );

        voice.draw(context, stave);
      } catch (error) {
        console.error(
          `Failed to render measure ${measure.number}:`,
          error,
        );
      }
    });

    return () => {
      container.innerHTML = "";
    };
  }, [
    song,
    activeNoteId,
    canvasWidth,
    canvasHeight,
  ]);

  const interactive =
    Boolean(onMeasureClick) ||
    Boolean(onNoteDrop);

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-700 bg-slate-50 p-3">
      <div
        className="relative"
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        {/* VexFlow SVG renderer */}
        <div
          ref={containerRef}
          className="absolute inset-0"
        />

        {/* Measure selection and drop targets */}
        {song.measures.map((measure, index) => {
          const row = Math.floor(
            index / MEASURES_PER_ROW,
          );

          const column =
            index % MEASURES_PER_ROW;

          const x =
            LEFT_MARGIN +
            column * MEASURE_WIDTH;

          const y =
            TOP_MARGIN +
            row * ROW_HEIGHT +
            STAVE_TOP_OFFSET;

          const isLoopSelected =
            loopEnabled &&
            measure.number >= loopStartMeasure &&
            measure.number <= loopEndMeasure;

          return (
            <div
              key={measure.number}
              role={
                interactive ? "button" : undefined
              }
              tabIndex={
                onMeasureClick ? 0 : undefined
              }
              aria-label={
                interactive
                  ? `Measure ${measure.number}`
                  : undefined
              }
              onClick={() => {
                onMeasureClick?.(measure.number);
              }}
              onKeyDown={(event) => {
                if (
                  onMeasureClick &&
                  (event.key === "Enter" ||
                    event.key === " ")
                ) {
                  event.preventDefault();

                  onMeasureClick(measure.number);
                }
              }}
              onDragOver={(event) => {
                if (!onNoteDrop) return;

                event.preventDefault();

                event.dataTransfer.dropEffect =
                  "copy";
              }}
              onDrop={(event) => {
                if (!onNoteDrop) return;

                event.preventDefault();

                const raw =
                  event.dataTransfer.getData(
                    "application/x-ocarina-note",
                  );

                if (!raw) return;

                try {
                  const parsed: unknown =
                    JSON.parse(raw);

                  if (!isValidDroppedNote(parsed)) {
                    console.warn(
                      "Invalid note drop:",
                      parsed,
                    );
                    return;
                  }

                  onNoteDrop(
                    measure.number,
                    parsed,
                  );
                } catch (error) {
                  console.error(
                    "Could not process dropped note:",
                    error,
                  );
                }
              }}
              className={[
                "absolute rounded-md border-2",
                "transition-colors",
                interactive
                  ? "cursor-pointer"
                  : "pointer-events-none",
                isLoopSelected
                  ? "border-cyan-400/70 bg-cyan-400/10"
                  : interactive
                    ? "border-transparent hover:border-cyan-400/50 hover:bg-cyan-400/10"
                    : "border-transparent",
              ].join(" ")}
              style={{
                left: x,
                top: y - 10,
                width: MEASURE_WIDTH,
                height: 115,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

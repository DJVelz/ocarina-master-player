
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

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
  activeNoteId?: string | null;

  loopEnabled?: boolean;
  loopStartMeasure?: number;
  loopEndMeasure?: number;
  onMeasureClick?: (measureNumber: number) => void;

  onNoteDrop?: (
    measureNumber: number,
    note: DroppedNote,
    insertionIndex: number,
  ) => void;
};

const MEASURES_PER_ROW = 4;
const MEASURE_WIDTH = 220;
const ROW_HEIGHT = 185;
const LEFT_MARGIN = 20;
const TOP_MARGIN = 45;
const BOTTOM_MARGIN = 30;
const STAVE_TOP_OFFSET = 20;

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

// Natural pitches, starting at C4.
const NATURAL_NOTES = [
  "C", "D", "E", "F", "G", "A", "B",
];

const MIN_PITCH_INDEX = 5;  // A4
const MAX_PITCH_INDEX = 17; // F6

type StaffGeometry = {
  bottomLineY: number;
  halfSpace: number;
};

type DropPreview = {
  measureNumber: number;
  pitch: string;
  type: "note" | "rest";
  x: number;
  y: number;
  insertionIndex: number;
};

function noteBeats(note: SongNote): number {
  const beats = DURATION_BEATS[note.duration];
  return note.dotted ? beats * 1.5 : beats;
}

function measureBeats(song: OcarinaSong): number {
  return (
    song.timeSignature.beats *
    (4 / song.timeSignature.beatValue)
  );
}

function pitchToVexKey(pitch?: string): string {
  const match = pitch?.match(
    /^([A-G])([#b]?)(\d+)$/i,
  );

  if (!match) return "c/5";

  return (
    `${match[1].toLowerCase()}` +
    `${match[2]}/${match[3]}`
  );
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
  if (!value || typeof value !== "object") {
    return false;
  }

  const note = value as Partial<DroppedNote>;

  if (
    note.type !== "note" &&
    note.type !== "rest"
  ) {
    return false;
  }

  if (
    !note.duration ||
    !(note.duration in DURATION_MAP)
  ) {
    return false;
  }

  if (
    note.type === "note" &&
    (typeof note.pitch !== "string" ||
      !/^[A-G][#b]?\d+$/i.test(note.pitch))
  ) {
    return false;
  }

  return true;
}

// E4 is the bottom line of a treble-clef staff.
// Every line/space movement is one natural note.
function staffStepToPitch(stepFromE4: number): string {
  const e4Index = 2;
  const index = Math.max(
    MIN_PITCH_INDEX,
    Math.min(
      MAX_PITCH_INDEX,
      e4Index + stepFromE4,
    ),
  );

  const letter = NATURAL_NOTES[index % 7];
  const octave = 4 + Math.floor(index / 7);

  return `${letter}${octave}`;
}

function pitchToStaffStep(pitch: string): number {
  const match = pitch.match(/^([A-G])[#b]?(\d+)$/i);

  if (!match) return 0;

  const letterIndex = NATURAL_NOTES.indexOf(
    match[1].toUpperCase(),
  );

  return (
    (Number(match[2]) - 4) * 7 +
    letterIndex -
    2
  );
}

function isAutoRest(note: SongNote): boolean {
  return (
    note.type === "rest" &&
    note.id.startsWith("auto-rest-")
  );
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

  const staffGeometryRef = useRef(
    new Map<number, StaffGeometry>(),
  );

  const [preview, setPreview] =
    useState<DropPreview | null>(null);

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
    staffGeometryRef.current.clear();

    const renderer = new Renderer(
      container,
      Renderer.Backends.SVG,
    );

    renderer.resize(canvasWidth, canvasHeight);

    const context = renderer.getContext();
    context.setFillStyle("#0f172a");
    context.setStrokeStyle("#0f172a");

    const expectedBeats = measureBeats(song);

    song.measures.forEach((measure, index) => {
      const row = Math.floor(
        index / MEASURES_PER_ROW,
      );

      const column = index % MEASURES_PER_ROW;

      const x =
        LEFT_MARGIN + column * MEASURE_WIDTH;

      const y =
        TOP_MARGIN +
        row * ROW_HEIGHT +
        STAVE_TOP_OFFSET;

      const stave = new Stave(
        x,
        y,
        MEASURE_WIDTH,
      );

      if (column === 0) {
        stave.addClef("treble");

        stave.addTimeSignature(
          `${song.timeSignature.beats}/` +
          `${song.timeSignature.beatValue}`,
        );
      }

      stave.setContext(context).draw();

      // Record actual staff coordinates for dragging.
      const bottomLineY = stave.getYForLine(4);

      const halfSpace =
        (stave.getYForLine(4) -
          stave.getYForLine(3)) / 2;

      staffGeometryRef.current.set(
        measure.number,
        {
          bottomLineY,
          halfSpace,
        },
      );

      context.save();
      context.setFillStyle("#64748b");
      context.setFont("Arial", 11, "");
      context.fillText(
        String(measure.number),
        x + 5,
        y - 10,
      );
      context.restore();

      if (measure.notes.length === 0) return;

      const actualBeats = measure.notes.reduce(
        (total, note) =>
          total + noteBeats(note),
        0,
      );

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
          numBeats: song.timeSignature.beats,
          beatValue: song.timeSignature.beatValue,
        });

        voice.setMode(Voice.Mode.SOFT);
        voice.addTickables(vexNotes);

        new Formatter()
          .joinVoices([voice])
          .format(
            [voice],
            MEASURE_WIDTH -
              (column === 0 ? 75 : 25),
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

  function getDropPosition(
    event: React.DragEvent<HTMLDivElement>,
    measureNumber: number,
    measureIndex: number,
    template: DroppedNote,
  ): DropPreview | null {
    const geometry =
      staffGeometryRef.current.get(measureNumber);

    const target = event.currentTarget;

    if (!geometry) return null;

    const rect = target.getBoundingClientRect();

    const row = Math.floor(
      measureIndex / MEASURES_PER_ROW,
    );

    const column =
      measureIndex % MEASURES_PER_ROW;

    const measureX =
      LEFT_MARGIN + column * MEASURE_WIDTH;

    // Coordinates within the complete notation canvas.
    const pointerX =
      measureX + (event.clientX - rect.left);

    const pointerY =
      TOP_MARGIN +
      row * ROW_HEIGHT +
      (event.clientY - rect.top) -
      28;

    // Snap to the nearest line or space.
    const step = Math.round(
      (geometry.bottomLineY - pointerY) /
        geometry.halfSpace,
    );

    const naturalPitch = staffStepToPitch(step);

    // The current palette's accidental is preserved.
    // Vertical placement chooses letter + octave.
    const accidental = template.pitch?.includes("#")
      ? "#"
      : /^[A-G]b\d+$/i.test(
          template.pitch ?? "",
        )
        ? "b"
        : "";

    const pitch =
      template.type === "rest"
        ? ""
        : naturalPitch.replace(
            /^([A-G])(\d+)$/,
            `$1${accidental}$2`,
          );

    const snappedStep = pitchToStaffStep(
      naturalPitch,
    );

    const snappedY =
      geometry.bottomLineY -
      snappedStep * geometry.halfSpace;

    const measure = song.measures[measureIndex];

    // Auto-rests are placeholders, not user notes.
    const existingNotes = measure.notes.filter(
      (note) => !isAutoRest(note),
    );

    // Horizontal position maps to the point where
    // the note is inserted in the existing sequence.
    //
    // This first version shifts later notes.
    const contentLeft = measureX +
      (column === 0 ? 80 : 25);

    const contentRight =
      measureX + MEASURE_WIDTH - 15;

    const ratio = Math.max(
      0,
      Math.min(
        1,
        (pointerX - contentLeft) /
          (contentRight - contentLeft),
      ),
    );

    const insertionIndex = Math.min(
      existingNotes.length,
      Math.floor(
        ratio * (existingNotes.length + 1),
      ),
    );

    const previewX =
      contentLeft +
      ratio * (contentRight - contentLeft);

    return {
      measureNumber,
      pitch,
      type: template.type,
      x: previewX,
      y: template.type === "rest"
        ? geometry.bottomLineY - 20
        : snappedY,
      insertionIndex,
    };
  }

  function readDraggedNote(
    event: React.DragEvent<HTMLDivElement>,
  ): DroppedNote | null {
    const raw = event.dataTransfer.getData(
      "application/x-ocarina-note",
    );

    if (!raw) return null;

    try {
      const parsed: unknown = JSON.parse(raw);

      return isValidDroppedNote(parsed)
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

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
        <div
          ref={containerRef}
          className="absolute inset-0"
        />

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
            row * ROW_HEIGHT;

          const isSelected =
            loopEnabled &&
            measure.number >= loopStartMeasure &&
            measure.number <= loopEndMeasure;

          return (
            <div
              key={measure.number}
              role={
                onMeasureClick
                  ? "button"
                  : undefined
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
              onDragEnter={(event) => {
                if (onNoteDrop) {
                  event.preventDefault();
                }
              }}
              onDragOver={(event) => {
                if (!onNoteDrop) return;

                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";

                // Browsers generally don't expose drag
                // payload data during dragover. The
                // palette supplies a text/plain fallback.
                const rawType = event.dataTransfer.types
                  .includes("application/x-ocarina-note");

                if (!rawType) return;

                const selectedTemplate: DroppedNote = {
                  type: "note",
                  pitch: "C5",
                  duration: "quarter",
                };

                // The palette's actual note data is read
                // when dropped. The preview uses a natural
                // note until then.
                const position = getDropPosition(
                  event,
                  measure.number,
                  index,
                  selectedTemplate,
                );

                setPreview(position);
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                ) {
                  setPreview(null);
                }
              }}
              onDrop={(event) => {
                if (!onNoteDrop) return;

                event.preventDefault();

                const template = readDraggedNote(event);

                if (!template) {
                  setPreview(null);
                  return;
                }

                const position = getDropPosition(
                  event,
                  measure.number,
                  index,
                  template,
                );

                if (!position) return;

                onNoteDrop(
                  measure.number,
                  {
                    type: template.type,
                    pitch:
                      template.type === "note"
                        ? position.pitch
                        : undefined,
                    duration: template.duration,
                  },
                  position.insertionIndex,
                );

                setPreview(null);
              }}
              className={[
                "absolute rounded-md border-2",
                "transition-colors",
                interactive
                  ? "cursor-pointer"
                  : "pointer-events-none",
                isSelected
                  ? "border-cyan-400/70 bg-cyan-400/10"
                  : interactive
                    ? "border-transparent hover:border-cyan-400/50 hover:bg-cyan-400/10"
                    : "border-transparent",
              ].join(" ")}
              style={{
                left: x,
                top: y - 28,
                width: MEASURE_WIDTH,
                height: 155,
              }}
            />
          );
        })}

        {/* GHOST NOTE PREVIEW */}
        {preview && onNoteDrop && (
          <div
            className="pointer-events-none absolute z-30"
            style={{
              left: preview.x,
              top: preview.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            {preview.type === "note" ? (
              <>
                <div className="h-[9px] w-[13px] -rotate-20 rounded-full border border-cyan-700 bg-cyan-400/75" />
                <div className="absolute -right-[1px] -top-[25px] h-[27px] w-[2px] bg-cyan-600/70" />
                <div className="absolute left-5 top-[-5px] whitespace-nowrap rounded bg-cyan-600 px-1.5 py-0.5 text-xs font-bold text-white">
                  {preview.pitch}
                </div>
              </>
            ) : (
              <div className="rounded bg-cyan-500 px-2 py-1 text-xs font-bold text-white">
                Rest
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

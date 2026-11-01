
"use client";

import type { SongNote } from "@/lib/music/types";

export type NoteTemplate = {
  type: "note" | "rest";
  pitch?: string;
  duration: SongNote["duration"];
};

type SongBuilderDockProps = {
  title: string;
  tempo: number;
  pitch: string;
  noteType: "note" | "rest";

  onTitleChange: (value: string) => void;
  onTempoChange: (value: number) => void;
  onPitchChange: (value: string) => void;
  onNoteTypeChange: (value: "note" | "rest") => void;

  onAdd: (duration: SongNote["duration"]) => void;
  onAddMeasure: () => void;
  onClearMeasure: () => void;
  onExport: () => void;
};

const durations: {
  value: SongNote["duration"];
  label: string;
  symbol: string;
}[] = [
  { value: "whole", label: "Whole", symbol: "𝅝" },
  { value: "half", label: "Half", symbol: "𝅗𝅥" },
  { value: "quarter", label: "Quarter", symbol: "♩" },
  { value: "eighth", label: "Eighth", symbol: "♪" },
  { value: "sixteenth", label: "16th", symbol: "♬" },
];

const pitchNames = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
];

const allPitches: string[] = [];

for (let octave = 4; octave <= 6; octave++) {
  for (let index = 0; index < pitchNames.length; index++) {
    const pitch = `${pitchNames[index]}${octave}`;

    const midi = (octave + 1) * 12 + index;

    // STL 12-hole Alto C range: A4–F6
    if (midi >= 69 && midi <= 89) {
      allPitches.push(pitch);
    }
  }
}

export default function SongBuilderDock({
  title,
  tempo,
  pitch,
  noteType,
  onTitleChange,
  onTempoChange,
  onPitchChange,
  onNoteTypeChange,
  onAdd,
  onAddMeasure,
  onClearMeasure,
  onExport,
}: SongBuilderDockProps) {
  function beginDrag(
    event: React.DragEvent<HTMLButtonElement>,
    duration: SongNote["duration"],
  ) {
    const template: NoteTemplate = {
      type: noteType,
      pitch: noteType === "note" ? pitch : undefined,
      duration,
    };

    event.dataTransfer.setData(
      "application/x-ocarina-note",
      JSON.stringify(template),
    );

    event.dataTransfer.effectAllowed = "copy";
  }

  const fieldClass =
    "rounded-md border border-slate-600 bg-slate-800 " +
    "px-3 py-2 text-sm text-white outline-none " +
    "focus:border-cyan-400";

  return (
    <div className="sticky top-0 z-40 border-b border-slate-700 bg-slate-900 text-white shadow-lg">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">

        {/* SONG INFORMATION */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={title}
            onChange={(event) =>
              onTitleChange(event.target.value)
            }
            placeholder="Song title"
            aria-label="Song title"
            className={`${fieldClass} min-w-48 flex-1`}
          />

          <label className="flex items-center gap-2 text-sm text-slate-300">
            BPM
            <input
              type="number"
              min={20}
              max={300}
              value={tempo}
              onChange={(event) => {
                const value = Number(event.target.value);

                if (
                  Number.isFinite(value) &&
                  value >= 20 &&
                  value <= 300
                ) {
                  onTempoChange(value);
                }
              }}
              className={`${fieldClass} w-20`}
            />
          </label>

          <button
            type="button"
            onClick={onExport}
            className="rounded-md border border-cyan-500 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10"
          >
            Export JSON
          </button>
        </div>

        {/* NOTE PALETTE */}
        <div className="flex flex-wrap items-center gap-3">

          <label className="flex items-center gap-2 text-sm">
            Pitch
            <select
              value={pitch}
              onChange={(event) =>
                onPitchChange(event.target.value)
              }
              disabled={noteType === "rest"}
              className={fieldClass}
            >
              {allPitches.map((notePitch) => (
                <option
                  key={notePitch}
                  value={notePitch}
                >
                  {notePitch}
                </option>
              ))}
            </select>
          </label>

          <div className="flex rounded-md border border-slate-600 bg-slate-800 p-1">
            {(["note", "rest"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onNoteTypeChange(type)}
                className={[
                  "rounded px-3 py-2 text-sm capitalize",
                  noteType === type
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-700",
                ].join(" ")}
              >
                {type}
              </button>
            ))}
          </div>

          <span className="hidden text-xs text-slate-400 lg:inline">
            Drag a duration onto the sheet
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {durations.map((duration) => (
            <button
              key={duration.value}
              type="button"
              draggable
              onDragStart={(event) =>
                beginDrag(event, duration.value)
              }
              onClick={() => onAdd(duration.value)}
              title={`Drag ${duration.label} onto a measure, or click to add to the selected measure`}
              className="flex min-w-20 cursor-grab flex-col items-center rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 hover:border-cyan-400 hover:bg-slate-700 active:cursor-grabbing"
            >
              <span className="text-2xl leading-7">
                {duration.symbol}
              </span>
              <span className="text-[11px] text-slate-300">
                {duration.label}
              </span>
            </button>
          ))}

          <div className="mx-1 hidden h-9 w-px bg-slate-700 sm:block" />

          <button
            type="button"
            onClick={onAddMeasure}
            className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
          >
            + Measure
          </button>

          <button
            type="button"
            onClick={onClearMeasure}
            className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
          >
            Clear Measure
          </button>
        </div>
      </div>
    </div>
  );
}

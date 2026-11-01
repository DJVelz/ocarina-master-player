
"use client";

import { useState } from "react";

import SheetView from "@/components/music/SheetView";
import SongBuilderDock, {
  type NoteTemplate,
} from "@/components/creator/SongBuilderDock";

import type {
  Measure,
  OcarinaSong,
  SongNote,
  NoteDuration,
} from "@/lib/music/types";

import {
  durationInBeats,
  expectedMeasureLengthInBeats,
} from "@/lib/music/timing";

const REST_DURATIONS: {
  duration: NoteDuration;
  beats: number;
}[] = [
  { duration: "whole", beats: 4 },
  { duration: "half", beats: 2 },
  { duration: "quarter", beats: 1 },
  { duration: "eighth", beats: 0.5 },
  { duration: "sixteenth", beats: 0.25 },
];

// Generate rests to fill all remaining time.
function createAutoRests(
  remainingBeats: number,
  measureNumber: number,
): SongNote[] {
  const rests: SongNote[] = [];

  // Work in sixteenth-note units to avoid
  // accumulating floating-point rounding.
  let units = Math.round(remainingBeats * 4);

  for (const { duration, beats } of REST_DURATIONS) {
    const requiredUnits = beats * 4;

    while (units >= requiredUnits) {
      rests.push({
        id: `auto-rest-${measureNumber}-${rests.length}`,
        type: "rest",
        duration,
      });

      units -= requiredUnits;
    }
  }

  return rests;
}

function createEmptyMeasure(number: number): Measure {
  return {
    number,
    notes: createAutoRests(4, number),
  };
}

function createNewSong(): OcarinaSong {
  return {
    id: crypto.randomUUID(),
    title: "Untitled Song",
    tempo: 80,
    timeSignature: {
      beats: 4,
      beatValue: 4,
    },
    instrument: "12-hole-c",
    measures: [
      createEmptyMeasure(1),
      createEmptyMeasure(2),
      createEmptyMeasure(3),
      createEmptyMeasure(4),
    ],
  };
}

export default function CreateSongPage() {
  const [song, setSong] =
    useState<OcarinaSong>(createNewSong);

  const [selectedMeasure, setSelectedMeasure] =
    useState(1);

  const [pitch, setPitch] = useState("C5");
  const [noteType, setNoteType] =
    useState<"note" | "rest">("note");

  const [message, setMessage] = useState("");

  const measureCapacity =
    expectedMeasureLengthInBeats(
      song.timeSignature.beats,
      song.timeSignature.beatValue,
    );

  function addNote(
    measureNumber: number,
    template: NoteTemplate,
  ) {


    setSong((previous) => {
      const measures = previous.measures.map((measure) => {
        if (measure.number !== measureNumber) {
          return measure;
        }

        // Remove only automatically generated rests.
        // User-added rests are preserved.
        const existingNotes = measure.notes.filter(
          (note) => !note.id.startsWith("auto-rest-"),
        );

        const usedBeats = existingNotes.reduce(
          (total, note) =>
            total + durationInBeats(note),
          0,
        );

        const newNote: SongNote = {
          id: crypto.randomUUID(),
          type: template.type,
          duration: template.duration,
          ...(template.type === "note"
            ? { pitch: template.pitch ?? "C5" }
            : {}),
        };

        const newDuration = durationInBeats(newNote);

        if (
          usedBeats + newDuration >
          measureCapacity + 0.00001
        ) {
          return measure;
        }

        const remaining =
          measureCapacity - usedBeats - newDuration;

        return {
          ...measure,
          notes: [
            ...existingNotes,
            newNote,
            ...createAutoRests(
              remaining,
              measure.number,
            ),
          ],
        };
      });

      return {
        ...previous,
        measures,
      };
    });

    setSelectedMeasure(measureNumber);
    setMessage(
      `Attempted to add ${template.type} to measure ${measureNumber}.`,
    );
  }

  function addSelectedDuration(duration: NoteDuration) {
    addNote(selectedMeasure, {
      type: noteType,
      pitch: noteType === "note" ? pitch : undefined,
      duration,
    });
  }

  function clearMeasure() {
    setSong((previous) => ({
      ...previous,
      measures: previous.measures.map((measure) =>
        measure.number === selectedMeasure
          ? {
              ...measure,
              notes: createAutoRests(
                measureCapacity,
                measure.number,
              ),
            }
          : measure,
      ),
    }));

    setMessage(`Cleared measure ${selectedMeasure}.`);
  }

  function addMeasure() {
    setSong((previous) => {
      const number = previous.measures.length + 1;

      return {
        ...previous,
        measures: [
          ...previous.measures,
          {
            number,
            notes: createAutoRests(
              measureCapacity,
              number,
            ),
          },
        ],
      };
    });

    setSelectedMeasure(song.measures.length + 1);
    setMessage("Added a measure.");
  }

  function exportSong() {
    const json = JSON.stringify(song, null, 2);

    const blob = new Blob([json], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${song.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") || "song"}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white">

      {/* TOP EDITING DOCK */}
      <SongBuilderDock
        title={song.title}
        tempo={song.tempo}
        pitch={pitch}
        noteType={noteType}
        onTitleChange={(title) =>
          setSong((previous) => ({
            ...previous,
            title,
          }))
        }
        onTempoChange={(tempo) =>
          setSong((previous) => ({
            ...previous,
            tempo,
          }))
        }
        onPitchChange={setPitch}
        onNoteTypeChange={setNoteType}
        onAdd={addSelectedDuration}
        onAddMeasure={addMeasure}
        onClearMeasure={clearMeasure}
        onExport={exportSong}
      />

      {/* EDITOR CONTENT */}
      <div className="mx-auto max-w-6xl space-y-5 px-6 py-8">

        <div>
          <h1 className="text-2xl font-bold">
            {song.title || "Untitled Song"}
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {song.tempo} BPM ·{" "}
            {song.timeSignature.beats}/
            {song.timeSignature.beatValue}
            {" · "}
            {song.instrument}
          </p>
        </div>

        {/* SELECTION INFORMATION */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">
              Sheet Music
            </h2>

            <p className="text-xs text-slate-400">
              Selected measure: {selectedMeasure}
            </p>
          </div>

          <p className="text-sm text-cyan-400">
            Drag a note onto the sheet
          </p>
        </div>

        {/* REUSED VEXFLOW SHEET */}
        <SheetView
          song={song}
          onMeasureClick={setSelectedMeasure}
          onNoteDrop={(measureNumber, note) => {
            addNote(measureNumber, note);
          }}
          loopEnabled
          loopStartMeasure={selectedMeasure}
          loopEndMeasure={selectedMeasure}
        />

        {/* GUIDANCE */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-300">
            Select a pitch and note duration in the
            toolbar, then drag it onto a measure.
            You can also click a measure and click
            a duration button to add the note.
          </p>

          {message && (
            <p
              aria-live="polite"
              className="mt-2 text-xs text-cyan-400"
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

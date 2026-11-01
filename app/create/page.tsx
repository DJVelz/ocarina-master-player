
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

// ---------------------------------------
// NOTE DURATIONS
// ---------------------------------------

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

// ---------------------------------------
// AUTOMATIC REST GENERATION
// ---------------------------------------

// Generate rests that fill the unused beats
// of a measure.
//
// Using sixteenth-note units avoids floating
// point issues during calculations.

function createAutoRests(
  remainingBeats: number,
  measureNumber: number,
): SongNote[] {
  const rests: SongNote[] = [];

  let remainingUnits = Math.max(
    0,
    Math.round(remainingBeats * 4),
  );

  for (const { duration, beats } of REST_DURATIONS) {
    const units = beats * 4;

    while (remainingUnits >= units) {
      rests.push({
        id: `auto-rest-${measureNumber}-${rests.length}`,
        type: "rest",
        duration,
      });

      remainingUnits -= units;
    }
  }

  return rests;
}

// ---------------------------------------
// MEASURE HELPERS
// ---------------------------------------

function isAutoRest(note: SongNote): boolean {
  return (
    note.type === "rest" &&
    note.id.startsWith("auto-rest-")
  );
}

function getMeasureCapacity(
  song: OcarinaSong,
): number {
  return expectedMeasureLengthInBeats(
    song.timeSignature.beats,
    song.timeSignature.beatValue,
  );
}

function createEmptyMeasure(
  number: number,
  capacity: number,
): Measure {
  return {
    number,
    notes: createAutoRests(capacity, number),
  };
}

// ---------------------------------------
// INITIAL SONG
// ---------------------------------------

function createNewSong(): OcarinaSong {
  const song: OcarinaSong = {
    id: crypto.randomUUID(),
    title: "Untitled Song",
    tempo: 80,
    timeSignature: {
      beats: 4,
      beatValue: 4,
    },
    instrument: "12-hole-c",
    measures: [],
  };

  const capacity = getMeasureCapacity(song);

  song.measures = Array.from(
    { length: 4 },
    (_, index) =>
      createEmptyMeasure(index + 1, capacity),
  );

  return song;
}

// ---------------------------------------
// SONG BUILDER PAGE
// ---------------------------------------

export default function CreateSongPage() {
  // ---------------------------------------
  // SONG STATE
  // ---------------------------------------

  const [song, setSong] = useState<OcarinaSong>(
    createNewSong,
  );

  const [
    selectedMeasure,
    setSelectedMeasure,
  ] = useState(1);

  const [pitch, setPitch] = useState("C5");

  const [noteType, setNoteType] = useState<
    "note" | "rest"
  >("note");

  const [message, setMessage] = useState("");

  const measureCapacity = getMeasureCapacity(song);

  // ---------------------------------------
  // ADD NOTE / REST
  // ---------------------------------------

  function addNote(
    measureNumber: number,
    template: NoteTemplate,
    insertionIndex?: number,
  ) {
    const targetMeasure = song.measures.find(
      (measure) =>
        measure.number === measureNumber,
    );

    if (!targetMeasure) {
      setMessage(
        `Measure ${measureNumber} was not found.`,
      );
      return;
    }

    // User-created notes and rests are retained.
    // Automatically generated rests are placeholders.
    const existingNotes = targetMeasure.notes.filter(
      (note) => !isAutoRest(note),
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
        ? {
            pitch: template.pitch ?? pitch,
          }
        : {}),
    };

    const newDuration = durationInBeats(newNote);

    // Stop notes from exceeding the measure's
    // time signature.
    if (
      usedBeats + newDuration >
      measureCapacity + 0.00001
    ) {
      setMessage(
        `Measure ${measureNumber} is too full for a ${template.duration} ${template.type}.`,
      );

      return;
    }

    // Create an editable copy of the notes.
    const updatedNotes = [...existingNotes];

    // Clicking a duration appends it.
    // Dragging onto the sheet supplies an index.
    const insertAt = Math.max(
      0,
      Math.min(
        insertionIndex ?? updatedNotes.length,
        updatedNotes.length,
      ),
    );

    updatedNotes.splice(
      insertAt,
      0,
      newNote,
    );

    // Fill the unused time with automatically
    // generated rests.
    const remainingBeats =
      measureCapacity -
      usedBeats -
      newDuration;

    const completedNotes: SongNote[] = [
      ...updatedNotes,
      ...createAutoRests(
        remainingBeats,
        measureNumber,
      ),
    ];

    // Update only the selected measure.
    setSong((previous) => ({
      ...previous,

      measures: previous.measures.map(
        (measure) =>
          measure.number === measureNumber
            ? {
                ...measure,
                notes: completedNotes,
              }
            : measure,
      ),
    }));

    setSelectedMeasure(measureNumber);

    const description =
      template.type === "rest"
        ? `${template.duration} rest`
        : `${newNote.pitch} ${template.duration} note`;

    setMessage(
      `Added ${description} to measure ${measureNumber}.`,
    );
  }

  // ---------------------------------------
  // CLICK-TO-ADD FALLBACK
  // ---------------------------------------

  function addSelectedDuration(
    duration: NoteDuration,
  ) {
    addNote(selectedMeasure, {
      type: noteType,
      pitch:
        noteType === "note"
          ? pitch
          : undefined,
      duration,
    });
  }

  // ---------------------------------------
  // CLEAR SELECTED MEASURE
  // ---------------------------------------

  function clearMeasure() {
    setSong((previous) => {
      const capacity = getMeasureCapacity(previous);

      return {
        ...previous,

        measures: previous.measures.map(
          (measure) =>
            measure.number === selectedMeasure
              ? createEmptyMeasure(
                  measure.number,
                  capacity,
                )
              : measure,
        ),
      };
    });

    setMessage(
      `Cleared measure ${selectedMeasure}.`,
    );
  }

  // ---------------------------------------
  // ADD NEW MEASURE
  // ---------------------------------------

  function addMeasure() {
    const newMeasureNumber =
      song.measures.length + 1;

    setSong((previous) => {
      const number =
        previous.measures.length + 1;

      const capacity =
        getMeasureCapacity(previous);

      return {
        ...previous,

        measures: [
          ...previous.measures,
          createEmptyMeasure(
            number,
            capacity,
          ),
        ],
      };
    });

    setSelectedMeasure(newMeasureNumber);

    setMessage(
      `Added measure ${newMeasureNumber}.`,
    );
  }

  // ---------------------------------------
  // SONG METADATA
  // ---------------------------------------

  function updateTitle(title: string) {
    setSong((previous) => ({
      ...previous,
      title,
    }));
  }

  function updateTempo(tempo: number) {
    if (
      !Number.isFinite(tempo) ||
      tempo < 20 ||
      tempo > 300
    ) {
      return;
    }

    setSong((previous) => ({
      ...previous,
      tempo,
    }));
  }

  // ---------------------------------------
  // EXPORT SONG JSON
  // ---------------------------------------

  function exportSong() {
    const json = JSON.stringify(
      song,
      null,
      2,
    );

    const blob = new Blob([json], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `${
      song.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "song"
    }.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    setMessage("Song exported successfully.");
  }

  // ---------------------------------------
  // RENDER
  // ---------------------------------------

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white">

      {/* TOP CREATION DOCK */}
      <SongBuilderDock
        title={song.title}
        tempo={song.tempo}
        pitch={pitch}
        noteType={noteType}
        onTitleChange={updateTitle}
        onTempoChange={updateTempo}
        onPitchChange={setPitch}
        onNoteTypeChange={setNoteType}
        onAdd={addSelectedDuration}
        onAddMeasure={addMeasure}
        onClearMeasure={clearMeasure}
        onExport={exportSong}
      />

      {/* MAIN EDITOR CONTENT */}
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">

        {/* SONG INFORMATION */}
        <header>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">
              {song.title || "Untitled Song"}
            </h1>

            <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
              Song Builder
            </span>
          </div>

          <p className="text-sm text-slate-400">
            {song.tempo} BPM
            {" · "}
            {song.timeSignature.beats}/
            {song.timeSignature.beatValue}
            {" · "}
            12-Hole Alto C Ocarina
          </p>
        </header>

        {/* SHEET SECTION */}
        <section className="space-y-3">

          <div className="flex flex-wrap items-end justify-between gap-3">

            <div>
              <h2 className="text-lg font-semibold">
                Sheet Music
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Selected measure:{" "}
                <span className="font-semibold text-cyan-400">
                  {selectedMeasure}
                </span>
              </p>
            </div>

            <p className="text-sm text-cyan-400">
              Drag notes onto the staff
            </p>

          </div>

          {/* VEXFLOW SHEET */}
          <SheetView
            song={song}
            onMeasureClick={setSelectedMeasure}
            onNoteDrop={(
              measureNumber,
              note,
              insertionIndex,
            ) => {
              addNote(
                measureNumber,
                note,
                insertionIndex,
              );
            }}
            loopEnabled={true}
            loopStartMeasure={selectedMeasure}
            loopEndMeasure={selectedMeasure}
          />
        </section>

        {/* EDITOR INSTRUCTIONS */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-2 text-sm font-semibold">
            How to use the Song Builder
          </h3>

          <p className="text-sm leading-relaxed text-slate-300">
            Drag a note duration from the top toolbar
            onto a line or space of the sheet music.
            The vertical position determines the pitch,
            while the horizontal position determines
            where the note is inserted in the measure.
            You can also select a measure and click
            a duration button to add a note directly.
          </p>

          <p className="mt-3 text-xs text-slate-400">
            Each measure must fit within the song&apos;s
            time signature. Any unused beats are
            automatically filled with rests.
          </p>
        </section>

        {/* FEEDBACK */}
        {message && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300"
          >
            {message}
          </div>
        )}

        {/* SONG INFORMATION */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5 text-xs text-slate-400">

          <span>
            {song.measures.length} measures
          </span>

          <span>
            {song.timeSignature.beats}/
            {song.timeSignature.beatValue}
            {" · "}
            {measureCapacity} quarter-note beats per measure
          </span>

          <span>
            Changes are not yet saved automatically
          </span>

        </footer>

      </div>
    </main>
  );
}

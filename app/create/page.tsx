
"use client";

import { useEffect, useMemo, useState } from "react";

import SheetView from "@/components/music/SheetView";
import SongBuilderDock, {
  type NoteTemplate,
} from "@/components/creator/SongBuilderDock";

import PracticeDock from "@/components/practice/PracticeDock";
import CountInDisplay from "@/components/practice/CountInDisplay";

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

import {
  buildSongTimeline,
  getActiveNote,
  getSongDurationMs,
} from "@/lib/music/timeline";

import { usePlayback } from "@/lib/music/usePlayback";
import { useOcarinaAudio } from "@/lib/music/useOcarinaAudio";

// -----------------------------------------
// REST AND MEASURE HELPERS
// -----------------------------------------

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

function isAutoRest(note: SongNote): boolean {
  return (
    note.type === "rest" &&
    note.id.startsWith("auto-rest-")
  );
}

function getMeasureCapacity(song: OcarinaSong): number {
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
    (_, index) => createEmptyMeasure(index + 1, capacity),
  );

  return song;
}

// -----------------------------------------
// PLAYBACK + SHEET COMPONENT
// -----------------------------------------
// Keeping playback in a separate component
// lets us reset its clock after song edits,
// while retaining the song editor's state.

type CreatorPlaybackAreaProps = {
  song: OcarinaSong;
  selectedMeasure: number;

  onSelectMeasure: (number: number) => void;

  onNoteDrop: (
    measureNumber: number,
    note: NoteTemplate,
    insertionIndex: number,
  ) => void;

  noteAudioEnabled: boolean;
  onNoteAudioChange: (enabled: boolean) => void;
};

function CreatorPlaybackArea({
  song,
  selectedMeasure,
  onSelectMeasure,
  onNoteDrop,
  noteAudioEnabled,
  onNoteAudioChange,
}: CreatorPlaybackAreaProps) {
  // ---------------------------------------
  // PLAYBACK ENGINE
  // ---------------------------------------

  const {
    currentTimeMs,
    isPlaying,
    isCountingIn,
    countInBeat,
    countInEnabled,
    playbackRate,
    metronomeMode,

    play,
    pause,
    stop,
    seek,

    setPlaybackRate,
    setCountInEnabled,
    setMetronomeMode,
    setLoopEnabled,
    setLoopRange,
  } = usePlayback({
    tempo: song.tempo,
    beats: song.timeSignature.beats,
    beatValue: song.timeSignature.beatValue,
  });

  const timeline = useMemo(
    () => buildSongTimeline(song),
    [song],
  );

  const durationMs = useMemo(
    () => getSongDurationMs(song),
    [song],
  );

  const activeNote = getActiveNote(
    timeline,
    currentTimeMs,
  );

  // ---------------------------------------
  // OCARINA AUDIO
  // ---------------------------------------

  const { unlockAudio } = useOcarinaAudio({
    timeline,
    currentTimeMs,
    isPlaying,
    isCountingIn,
    enabled: noteAudioEnabled,
  });

  // ---------------------------------------
  // LOOPING
  // ---------------------------------------

  const [loopEnabled, setLoopEnabledState] =
    useState(false);

  const [loopStart, setLoopStart] = useState(1);

  const [loopEnd, setLoopEnd] =
    useState(song.measures.length);

  const measureStartTimes = useMemo(() => {
    const starts = [0];
    let accumulatedBeats = 0;

    for (const measure of song.measures) {
      for (const note of measure.notes) {
        accumulatedBeats += durationInBeats(note);
      }

      starts.push(
        accumulatedBeats * (60_000 / song.tempo),
      );
    }

    return starts;
  }, [song]);

  const loopStartMs =
    measureStartTimes[loopStart - 1] ?? 0;

  const loopEndMs =
    measureStartTimes[loopEnd] ?? durationMs;

  useEffect(() => {
    setLoopRange(loopStartMs, loopEndMs);
    setLoopEnabled(loopEnabled);
  }, [
    loopStartMs,
    loopEndMs,
    loopEnabled,
    setLoopRange,
    setLoopEnabled,
  ]);

  // ---------------------------------------
  // RENDER
  // ---------------------------------------

  return (
    <>
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
            Drag notes onto the staff to compose
          </p>
        </div>

        <div className="relative">
          <SheetView
            song={song}
            activeNoteId={activeNote?.note.id ?? null}
            onMeasureClick={onSelectMeasure}
            onNoteDrop={onNoteDrop}
            loopEnabled={true}
            loopStartMeasure={selectedMeasure}
            loopEndMeasure={selectedMeasure}
          />

          {/* Count-in above the sheet */}
          {isCountingIn && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              <div className="rounded-xl border border-cyan-500/50 bg-slate-950/95 p-5 shadow-2xl">
                <CountInDisplay
                  isCountingIn={isCountingIn}
                  countInBeat={countInBeat}
                  beats={song.timeSignature.beats}
                  isPlaying={isPlaying}
                />
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Press Play in the bottom toolbar to preview
          your composition. The active note will
          highlight as the song plays.
        </p>
      </section>

      {/* PERSISTENT BOTTOM PLAYBACK DOCK */}
      <PracticeDock
        song={song}
        isFullscreen={false}
        currentTimeMs={currentTimeMs}
        durationMs={durationMs}
        isPlaying={isPlaying}
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
        countInEnabled={countInEnabled}
        onCountInChange={setCountInEnabled}
        metronomeMode={metronomeMode}
        onMetronomeModeChange={setMetronomeMode}
        loopEnabled={loopEnabled}
        loopStart={loopStart}
        loopEnd={loopEnd}
        onLoopEnabledChange={(enabled) => {
          setLoopEnabledState(enabled);
        }}
        onLoopRangeChange={(start, end) => {
          setLoopStart(start);
          setLoopEnd(end);
        }}
        noteAudioEnabled={noteAudioEnabled}
        onNoteAudioChange={(enabled) => {
          onNoteAudioChange(enabled);

          if (enabled) {
            void unlockAudio();
          }
        }}
        onPlay={() => {
          if (noteAudioEnabled) {
            void unlockAudio();
          }

          play();
        }}
        onPause={pause}
        onStop={stop}
        onSeek={seek}
      />
    </>
  );
}

// -----------------------------------------
// MAIN SONG BUILDER
// -----------------------------------------

export default function CreateSongPage() {
  const [song, setSong] =
    useState<OcarinaSong>(createNewSong);

  const [selectedMeasure, setSelectedMeasure] =
    useState(1);

  const [pitch, setPitch] = useState("C5");

  const [noteType, setNoteType] =
    useState<"note" | "rest">("note");

  const [message, setMessage] = useState("");

  // Preserve this toggle when the playback
  // component resets after editing the song.
  const [noteAudioEnabled, setNoteAudioEnabled] =
    useState(false);

  // Incrementing this remounts the playback
  // component so its clock is rebuilt for
  // the current song.
  const [songRevision, setSongRevision] =
    useState(0);

  const measureCapacity = getMeasureCapacity(song);

  function markSongEdited() {
    setSongRevision((revision) => revision + 1);
  }

  // ---------------------------------------
  // ADD NOTE OR REST
  // ---------------------------------------

  function addNote(
    measureNumber: number,
    template: NoteTemplate,
    insertionIndex?: number,
  ) {
    const targetMeasure = song.measures.find(
      (measure) => measure.number === measureNumber,
    );

    if (!targetMeasure) {
      setMessage(
        `Measure ${measureNumber} was not found.`,
      );
      return;
    }

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

    if (
      usedBeats + newDuration >
      measureCapacity + 0.00001
    ) {
      setMessage(
        `Measure ${measureNumber} does not have enough room for that ${template.duration} ${template.type}.`,
      );

      return;
    }

    const updatedNotes = [...existingNotes];

    const insertAt = Math.max(
      0,
      Math.min(
        insertionIndex ?? updatedNotes.length,
        updatedNotes.length,
      ),
    );

    updatedNotes.splice(insertAt, 0, newNote);

    const remainingBeats =
      measureCapacity - usedBeats - newDuration;

    const completedNotes: SongNote[] = [
      ...updatedNotes,
      ...createAutoRests(
        remainingBeats,
        measureNumber,
      ),
    ];

    setSong((previous) => ({
      ...previous,
      measures: previous.measures.map((measure) =>
        measure.number === measureNumber
          ? {
              ...measure,
              notes: completedNotes,
            }
          : measure,
      ),
    }));

    setSelectedMeasure(measureNumber);
    markSongEdited();

    const description =
      template.type === "rest"
        ? `${template.duration} rest`
        : `${newNote.pitch} ${template.duration} note`;

    setMessage(
      `Added ${description} to measure ${measureNumber}.`,
    );
  }

  // ---------------------------------------
  // CLICK TO ADD
  // ---------------------------------------

  function addSelectedDuration(
    duration: NoteDuration,
  ) {
    addNote(selectedMeasure, {
      type: noteType,
      pitch:
        noteType === "note" ? pitch : undefined,
      duration,
    });
  }

  // ---------------------------------------
  // CLEAR MEASURE
  // ---------------------------------------

  function clearMeasure() {
    setSong((previous) => {
      const capacity = getMeasureCapacity(previous);

      return {
        ...previous,
        measures: previous.measures.map((measure) =>
          measure.number === selectedMeasure
            ? createEmptyMeasure(
                measure.number,
                capacity,
              )
            : measure,
        ),
      };
    });

    markSongEdited();

    setMessage(
      `Cleared measure ${selectedMeasure}.`,
    );
  }

  // ---------------------------------------
  // ADD MEASURE
  // ---------------------------------------

  function addMeasure() {
    const newMeasureNumber =
      song.measures.length + 1;

    setSong((previous) => {
      const number = previous.measures.length + 1;
      const capacity = getMeasureCapacity(previous);

      return {
        ...previous,
        measures: [
          ...previous.measures,
          createEmptyMeasure(number, capacity),
        ],
      };
    });

    setSelectedMeasure(newMeasureNumber);
    markSongEdited();

    setMessage(
      `Added measure ${newMeasureNumber}.`,
    );
  }

  // ---------------------------------------
  // METADATA
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
      tempo > 300 ||
      tempo === song.tempo
    ) {
      return;
    }

    setSong((previous) => ({
      ...previous,
      tempo,
    }));

    markSongEdited();
  }

  // ---------------------------------------
  // EXPORT JSON
  // ---------------------------------------

  function exportSong() {
    const json = JSON.stringify(song, null, 2);

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
  // PAGE
  // ---------------------------------------

  return (
    <main className="min-h-screen bg-slate-950 pb-44 text-white">
      {/* TOP: CREATION TOOLS */}
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

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {/* SONG HEADING */}
        <header>
          <h1 className="text-2xl font-bold">
            {song.title || "Untitled Song"}
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {song.tempo} BPM
            {" · "}
            {song.timeSignature.beats}/
            {song.timeSignature.beatValue}
            {" · "}
            12-Hole Alto C Ocarina
          </p>
        </header>

        {/* SHEET AND PLAYBACK */}
        <CreatorPlaybackArea
          key={songRevision}
          song={song}
          selectedMeasure={selectedMeasure}
          onSelectMeasure={setSelectedMeasure}
          onNoteDrop={addNote}
          noteAudioEnabled={noteAudioEnabled}
          onNoteAudioChange={setNoteAudioEnabled}
        />

        {/* INSTRUCTIONS */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-2 text-sm font-semibold">
            Song Builder
          </h2>

          <p className="text-sm leading-relaxed text-slate-300">
            Drag notes from the top toolbar onto the
            sheet music. Their vertical position
            determines their pitch, while their
            horizontal position determines where
            they are inserted.
          </p>

          <p className="mt-3 text-sm text-slate-300">
            Use the bottom playback toolbar to hear
            your composition, change practice speed,
            enable ocarina audio, and loop measures.
          </p>

          <p className="mt-3 text-xs text-slate-400">
            Editing notes or changing BPM resets
            playback to the beginning.
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

        <footer className="flex flex-wrap justify-between gap-3 border-t border-slate-800 pt-5 text-xs text-slate-400">
          <span>
            {song.measures.length} measures
          </span>

          <span>
            {measureCapacity} quarter-note beats
            per measure
          </span>

          <span>
            Export JSON to save your work
          </span>
        </footer>
      </div>
    </main>
  );
}

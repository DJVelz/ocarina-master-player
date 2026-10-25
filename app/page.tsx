
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import SheetView from "@/components/music/SheetView";
import HighwayView from "@/components/music/HighwayView";
import PitchHighwayView from "@/components/music/PitchHighwayView";
import CombinedHighwayView from "@/components/music/CombinedHighwayView";

import PracticeDock from "@/components/practice/PracticeDock";
import CountInDisplay from "@/components/practice/CountInDisplay";

import { testSong } from "@/data/testSong";

import {
  buildSongTimeline,
  getActiveNote,
  getSongDurationMs,
} from "@/lib/music/timeline";

import { durationInBeats } from "@/lib/music/timing";
import { usePlayback } from "@/lib/music/usePlayback";

import { useOcarinaAudio } from "@/lib/music/useOcarinaAudio";

type HighwayMode = "fingering" | "pitch" | "combined";

export default function PracticePage() {
  // --------------------------------
  // Playback
  // --------------------------------

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
    tempo: testSong.tempo,
    beats: testSong.timeSignature.beats,
    beatValue: testSong.timeSignature.beatValue,
  });

  // --------------------------------
  // Song timeline
  // --------------------------------

  const timeline = useMemo(
    () => buildSongTimeline(testSong),
    [],
  );

  const [noteAudioEnabled, setNoteAudioEnabled] =
    useState(false);

  const { unlockAudio } = useOcarinaAudio({
    timeline,
    currentTimeMs,
    isPlaying,
    isCountingIn,
    enabled: noteAudioEnabled,
  });

  const durationMs = useMemo(
    () => getSongDurationMs(testSong),
    [],
  );

  const activeNote = getActiveNote(
    timeline,
    currentTimeMs,
  );

  // --------------------------------
  // Highway mode
  // --------------------------------

  const [highwayMode, setHighwayMode] =
    useState<HighwayMode>("combined");

  // --------------------------------
  // Loop selection
  // --------------------------------

  const [loopEnabled, setLoopEnabledState] =
    useState(false);

  const [loopStart, setLoopStart] =
    useState(1);

  const [loopEnd, setLoopEnd] =
    useState(testSong.measures.length);

  const [selectionAnchor, setSelectionAnchor] =
    useState<number | null>(null);

  // Calculate the starting beat of a measure.
  const measureStartBeat = useCallback(
    (measureIndex: number) => {
      return testSong.measures
        .slice(0, measureIndex)
        .flatMap((measure) => measure.notes)
        .reduce(
          (total, note) =>
            total + durationInBeats(note),
          0,
        );
    },
    [],
  );

  // Loop boundaries in the original song timeline.
  const loopStartMs =
    measureStartBeat(loopStart - 1) *
    (60_000 / testSong.tempo);

  const loopEndMs =
    measureStartBeat(loopEnd) *
    (60_000 / testSong.tempo);

  // Synchronize loop settings with the playback engine.
  // setLoopRange and setLoopEnabled must be stable
  // callbacks in usePlayback to avoid render loops.
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

  // Select loop boundaries directly on the sheet.
  function handleMeasureClick(measureNumber: number) {
    setLoopEnabledState(true);

    if (selectionAnchor === null) {
      // First click: establish loop start.
      setSelectionAnchor(measureNumber);
      setLoopStart(measureNumber);
      setLoopEnd(measureNumber);
    } else {
      // Second click: complete selection.
      setLoopStart(
        Math.min(selectionAnchor, measureNumber),
      );

      setLoopEnd(
        Math.max(selectionAnchor, measureNumber),
      );

      setSelectionAnchor(null);
    }
  }

  // --------------------------------
  // Fullscreen workspace
  // --------------------------------

  const workspaceRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(
        document.fullscreenElement ===
          workspaceRef.current,
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
      if (
        document.fullscreenElement ===
        workspaceRef.current
      ) {
        await document.exitFullscreen();
      } else if (!document.fullscreenElement) {
        await workspaceRef.current?.requestFullscreen();
      }
    } catch (error) {
      console.error(
        "Unable to toggle fullscreen:",
        error,
      );
    }
  }

  // --------------------------------
  // Highway renderer
  // --------------------------------

  function renderHighway() {
    switch (highwayMode) {
      case "fingering":
        return (
          <HighwayView
            song={testSong}
            currentTimeMs={currentTimeMs}
          />
        );

      case "pitch":
        return (
          <PitchHighwayView
            song={testSong}
            currentTimeMs={currentTimeMs}
          />
        );

      case "combined":
      default:
        return (
          <CombinedHighwayView
            song={testSong}
            currentTimeMs={currentTimeMs}
            isFullscreen={isFullscreen}
          />
        );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* --------------------------------
          SONG INFORMATION
      -------------------------------- */}

      <div className="mx-auto max-w-6xl px-6 pb-6 pt-10">
        <p className="text-sm font-medium text-cyan-400">
          Ocarina Trainer
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          {testSong.title}
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          {testSong.tempo} BPM
          {" · "}
          {testSong.timeSignature.beats}/
          {testSong.timeSignature.beatValue}
          {" · "}
          {testSong.instrument}
        </p>
      </div>

      {/* --------------------------------
          SHEET MUSIC
      -------------------------------- */}

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Sheet Music
          </h2>

          <p className="text-xs text-slate-400">
            Click two measures to select a loop
          </p>
        </div>

        <SheetView
          song={testSong}
          activeNoteId={
            activeNote?.note.id ?? null
          }
          loopEnabled={loopEnabled}
          loopStartMeasure={loopStart}
          loopEndMeasure={loopEnd}
          onMeasureClick={handleMeasureClick}
        />

        {selectionAnchor !== null && (
          <p className="mt-3 text-sm text-cyan-400">
            Measure {selectionAnchor} selected.
            Click another measure to complete the loop.
          </p>
        )}
      </section>

      {/* --------------------------------
          PRACTICE WORKSPACE
          Fullscreen includes highway + dock.
      -------------------------------- */}

      <div
        ref={workspaceRef}
        className={[
          "relative bg-slate-950",
          isFullscreen
            ? "flex h-dvh max-h-dvh flex-col overflow-hidden"
            : "mx-auto max-w-6xl px-6",
        ].join(" ")}
      >
        {/* Highway header and mode selector */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 py-3">
          <h2 className="text-lg font-semibold">
            Highway
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Highway modes */}
            <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
              {(
                [
                  ["fingering", "Fingering"],
                  ["pitch", "Pitch"],
                  ["combined", "Combined"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setHighwayMode(mode)}
                  aria-pressed={highwayMode === mode}
                  className={[
                    "rounded-md px-3 py-2 text-sm font-medium",
                    "transition-colors",
                    highwayMode === mode
                      ? "bg-cyan-500 text-slate-950"
                      : "text-slate-300 hover:bg-slate-800",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
            >
              {isFullscreen
                ? "Exit Fullscreen"
                : "Fullscreen"}
            </button>
          </div>
        </div>

        {/* Highway content */}
        <div
          className={[
            "relative min-h-0",
            isFullscreen
              ? "h-0 flex-1 overflow-hidden"
              : "",
          ].join(" ")}
        >
          {/*
            Combined mode fills the available
            height when fullscreen is active.
          */}
          {renderHighway()}

          {/* Visual count-in overlay */}
          {isCountingIn && (
            <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
              <div className="pointer-events-auto max-w-[90%] rounded-2xl border border-cyan-500/50 bg-slate-950/90 p-4 shadow-2xl">
                <CountInDisplay
                  isCountingIn={isCountingIn}
                  countInBeat={countInBeat}
                  beats={testSong.timeSignature.beats}
                  isPlaying={isPlaying}
                />
              </div>
            </div>
          )}
        </div>

        {/* --------------------------------
            PERSISTENT PLAYBACK DOCK
        -------------------------------- */}

        <PracticeDock
          song={testSong}
          isFullscreen={isFullscreen}
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
            setSelectionAnchor(null);
          }}
          onLoopRangeChange={(start, end) => {
            setLoopStart(start);
            setLoopEnd(end);
            setSelectionAnchor(null);
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
      </div>

      {/* Space for the fixed dock in normal mode */}
      <div className="h-44" aria-hidden="true" />
    </main>
  );
}

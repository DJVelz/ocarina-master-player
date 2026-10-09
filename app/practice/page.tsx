"use client";

import SheetView from "@/components/music/SheetView";
import PlaybackControls from "@/components/practice/PlaybackControls";
import HighwayView from "@/components/music/HighwayView";
import TempoControl from "@/components/practice/TempoControl";
import CountInDisplay from "@/components/practice/CountInDisplay";

import { testSong } from "@/data/testSong";

import {
    buildSongTimeline,
    getSongDurationMs,
    getActiveNote,
} from "@/lib/music/timeline";

import {
  usePlayback,
} from "@/lib/music/usePlayback";

import MetronomeControl from "@/components/practice/MetronomeControl";

import { useEffect, useState } from "react";

import LoopControl from "@/components/practice/LoopControl";
import { durationInBeats } from "@/lib/music/timing";

export default function PracticePage() {
  const {
    currentTimeMs,
    isPlaying,
    isCountingIn,
    countInBeat,
    countInEnabled,
    playbackRate,
    metronomeMode,
    setLoopEnabled,
    setLoopRange,
    setMetronomeMode,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate,
    setCountInEnabled,
  } = usePlayback({
    tempo: testSong.tempo,
    beats: testSong.timeSignature.beats,
    beatValue: testSong.timeSignature.beatValue,
  });

    const durationMs =
    getSongDurationMs(testSong);

    const timeline =
    buildSongTimeline(testSong);

    const activeNote =
    getActiveNote(
        timeline,
        currentTimeMs,
    );

    const [loopEnabled, setLoopEnabledState] =
      useState(false);

    const [loopStart, setLoopStart] =
      useState(1);

    const [loopEnd, setLoopEnd] =
      useState(testSong.measures.length);

    const measureStartBeat = (measureIndex: number) =>
      testSong.measures
        .slice(0, measureIndex)
        .flatMap((measure) => measure.notes)
        .reduce(
          (total, note) => total + durationInBeats(note),
          0,
        );

    const loopStartMs =
      measureStartBeat(loopStart - 1) *
      (60_000 / testSong.tempo);

    const loopEndMs =
      measureStartBeat(loopEnd) *
      (60_000 / testSong.tempo);

    useEffect(() => {
      setLoopRange(loopStartMs, loopEndMs);
      setLoopEnabled(loopEnabled);
    }, [
      loopStartMs,
      loopEndMs,
      loopEnabled,
      setLoopEnabled,
      setLoopRange,
    ]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-cyan-400">
            Ocarina Trainer
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
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

        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              Sheet Music
            </h2>

            <SheetView
            song={testSong}
            activeNoteId={
                activeNote?.note.id ?? null
            }
            />
          </section>
          <CountInDisplay
            isCountingIn={isCountingIn}
            countInBeat={countInBeat}
            beats={testSong.timeSignature.beats}
            isPlaying={isPlaying}
          />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              Highway
            </h2>

            <HighwayView
              song={testSong}
              currentTimeMs={currentTimeMs}
            />
          </section>


          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-white">
            <input
              type="checkbox"
              checked={countInEnabled}
              onChange={(event) =>
                setCountInEnabled(event.target.checked)
              }
              className="h-4 w-4 accent-cyan-400"
            />

            Enable Count-in
          </label>

          <TempoControl
            originalTempo={testSong.tempo}
            playbackRate={playbackRate}
            onChange={setPlaybackRate}
          />

          <MetronomeControl
            mode={metronomeMode}
            onChange={setMetronomeMode}
          />

          <LoopControl
            enabled={loopEnabled}
            startMeasure={loopStart}
            endMeasure={loopEnd}
            totalMeasures={testSong.measures.length}
            onEnabledChange={setLoopEnabledState}
            onRangeChange={(start, end) => {
              setLoopStart(start);
              setLoopEnd(end);
            }}
          />
          
          <PlaybackControls
            isPlaying={isPlaying}
            currentTimeMs={currentTimeMs}
            durationMs={durationMs}
            onPlay={play}
            onPause={pause}
            onStop={stop}
            onSeek={seek}
          />
        </div>
      </div>
    </main>
  );
}
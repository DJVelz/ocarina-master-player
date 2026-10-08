"use client";

import SheetView from "@/components/music/SheetView";
import PlaybackControls from "@/components/practice/PlaybackControls";
import HighwayView from "@/components/music/HighwayView";

import { testSong } from "@/data/testSong";

import {
    buildSongTimeline,
    getSongDurationMs,
    getActiveNote,
} from "@/lib/music/timeline";

import {
  usePlayback,
} from "@/lib/music/usePlayback";

export default function PracticePage() {
  const {
    currentTimeMs,
    isPlaying,
    play,
    pause,
    stop,
    seek,
  } = usePlayback();

    const durationMs =
    getSongDurationMs(testSong);

    const timeline =
    buildSongTimeline(testSong);

    const activeNote =
    getActiveNote(
        timeline,
        currentTimeMs,
    );

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
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">
              Highway
            </h2>

            <HighwayView
              song={testSong}
              currentTimeMs={currentTimeMs}
            />
          </section>

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
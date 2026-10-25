
"use client";

import { useState } from "react";

import type { OcarinaSong } from "@/lib/music/types";
import type { MetronomeMode } from "@/lib/music/metronome";

import PlaybackControls from "./PlaybackControls";
import TempoControl from "./TempoControl";
import MetronomeControl from "./MetronomeControl";
import LoopControl from "./LoopControl";

type PracticeDockProps = {
  song: OcarinaSong;
  isFullscreen: boolean;

  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;

  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;

  countInEnabled: boolean;
  onCountInChange: (enabled: boolean) => void;

  metronomeMode: MetronomeMode;
  onMetronomeModeChange: (mode: MetronomeMode) => void;

  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;

  onLoopEnabledChange: (enabled: boolean) => void;
  onLoopRangeChange: (start: number, end: number) => void;

  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (timeMs: number) => void;
};

export default function PracticeDock({
  song,
  isFullscreen,
  currentTimeMs,
  durationMs,
  isPlaying,
  playbackRate,
  onPlaybackRateChange,
  countInEnabled,
  onCountInChange,
  metronomeMode,
  onMetronomeModeChange,
  loopEnabled,
  loopStart,
  loopEnd,
  onLoopEnabledChange,
  onLoopRangeChange,
  onPlay,
  onPause,
  onStop,
  onSeek,
}: PracticeDockProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      className={[
        "z-50 w-full border-t border-slate-700",
        "bg-slate-900 text-white shadow-2xl",
        isFullscreen
          ? "absolute inset-x-0 bottom-0"
          : "fixed inset-x-0 bottom-0",
      ].join(" ")}
    >
      {/* Expandable settings */}
      {settingsOpen && (
        <div className="max-h-[55dvh] overflow-y-auto border-b border-slate-700 bg-slate-950/95">
          <div className="mx-auto grid max-w-6xl gap-3 p-4 md:grid-cols-3">

            {/* Count-in */}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm">
              <input
                type="checkbox"
                checked={countInEnabled}
                onChange={(event) =>
                  onCountInChange(event.target.checked)
                }
                className="h-4 w-4 accent-cyan-400"
              />

              Enable Count-in
            </label>

            {/* Metronome */}
            <MetronomeControl
              mode={metronomeMode}
              onChange={onMetronomeModeChange}
            />

            {/* Measure looping */}
            <LoopControl
              enabled={loopEnabled}
              startMeasure={loopStart}
              endMeasure={loopEnd}
              totalMeasures={song.measures.length}
              onEnabledChange={onLoopEnabledChange}
              onRangeChange={onLoopRangeChange}
            />
          </div>
        </div>
      )}

      {/* Main toolbar */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">

        <div className="min-w-0 flex-[2_1_320px]">
          <PlaybackControls
            isPlaying={isPlaying}
            currentTimeMs={currentTimeMs}
            durationMs={durationMs}
            onPlay={onPlay}
            onPause={onPause}
            onStop={onStop}
            onSeek={onSeek}
          />
        </div>

        <div className="min-w-0 flex-[1_1_250px]">
          <TempoControl
            originalTempo={song.tempo}
            playbackRate={playbackRate}
            onChange={onPlaybackRateChange}
          />
        </div>

        <button
          type="button"
          onClick={() => setSettingsOpen((open) => !open)}
          aria-expanded={settingsOpen}
          aria-controls="practice-settings"
          className={[
            "rounded-lg border px-4 py-3 text-sm font-semibold",
            "transition-colors",
            settingsOpen
              ? "border-cyan-400 bg-cyan-500 text-slate-950"
              : "border-slate-600 bg-slate-800 text-white hover:bg-slate-700",
          ].join(" ")}
        >
          {settingsOpen ? "Close Settings" : "Settings"}
        </button>

      </div>
    </div>
  );
}

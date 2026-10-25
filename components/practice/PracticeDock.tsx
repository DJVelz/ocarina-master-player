
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
          ? "relative shrink-0"
          : "fixed inset-x-0 bottom-0",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl flex-col">

        {/* TOP: PRACTICE SPEED */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-700 px-4 py-2">
          <div className="min-w-0 flex-1">
            <TempoControl
              originalTempo={song.tempo}
              playbackRate={playbackRate}
              onChange={onPlaybackRateChange}
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setSettingsOpen((previous) => !previous)
            }
            aria-expanded={settingsOpen}
            aria-controls="practice-settings"
            className={[
              "shrink-0 rounded-lg border px-4 py-2",
              "text-sm font-semibold transition-colors",
              settingsOpen
                ? "border-cyan-400 bg-cyan-500 text-slate-950"
                : "border-slate-600 bg-slate-800 text-white hover:bg-slate-700",
            ].join(" ")}
          >
            {settingsOpen ? "Hide Settings" : "Settings"}
          </button>
        </div>

        {/* MIDDLE: EXPANDABLE SETTINGS */}
        {settingsOpen && (
          <div
            id="practice-settings"
            className="max-h-[45dvh] overflow-y-auto border-b border-slate-700 bg-slate-950/95 p-4"
          >
            <div className="flex flex-col gap-3">

              {/* Count-in */}
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm">
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

              {/* Loop */}
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

        {/* BOTTOM: PLAYBACK CONTROLS */}
        <div className="px-4 py-3">
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

      </div>
    </div>
  );
}

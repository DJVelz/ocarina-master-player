
"use client";

import { useEffect, useState } from "react";

import type { OcarinaSong } from "@/lib/music/types";
import type { MetronomeMode } from "@/lib/music/metronome";

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

  noteAudioEnabled: boolean;
  onNoteAudioChange: (enabled: boolean) => void;
};

function formatTime(timeMs: number) {
  const totalSeconds = Math.floor(
    Math.max(0, timeMs) / 1000,
  );

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

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
  noteAudioEnabled,
  onNoteAudioChange,
}: PracticeDockProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [speedInput, setSpeedInput] = useState(
    String(Math.round(playbackRate * 100)),
  );

  // Keep input synchronized when speed changes externally.
  useEffect(() => {
    setSpeedInput(
      String(Math.round(playbackRate * 100)),
    );
  }, [playbackRate]);

  const effectiveTempo = song.tempo * playbackRate;

  const progress = durationMs > 0
    ? Math.min(
        100,
        Math.max(0, (currentTimeMs / durationMs) * 100),
      )
    : 0;

  const measureOptions = Array.from(
    { length: song.measures.length },
    (_, index) => index + 1,
  );

  const inputClass =
    "rounded-md border border-slate-600 " +
    "bg-slate-800 px-2 py-1.5 text-sm text-white " +
    "outline-none focus:border-cyan-400 " +
    "disabled:cursor-not-allowed disabled:opacity-40";

  function commitSpeed() {
    const value = Number(speedInput);

    if (
      speedInput.trim() === "" ||
      !Number.isFinite(value)
    ) {
      setSpeedInput(
        String(Math.round(playbackRate * 100)),
      );
      return;
    }

    const percent = Math.max(
      25,
      Math.min(200, Math.round(value)),
    );

    onPlaybackRateChange(percent / 100);
    setSpeedInput(String(percent));
  }

  return (
    <div
      className={[
        "z-50 w-full shrink-0 border-t border-slate-700",
        "bg-slate-900 text-white shadow-2xl",
        isFullscreen
          ? "relative"
          : "fixed inset-x-0 bottom-0",
      ].join(" ")}
    >
      {/* EXPANDABLE SETTINGS PANEL */}
      {settingsOpen && (
        <div
          id="practice-settings"
          className="max-h-[40dvh] overflow-y-auto border-b border-slate-700 bg-slate-950"
        >
          <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Practice Settings
              </h3>

              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Count-in */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <p className="text-sm font-medium">
                  Count-in
                </p>
                <p className="text-xs text-slate-400">
                  Prepare before playback starts
                </p>
              </div>

              <input
                type="checkbox"
                checked={countInEnabled}
                onChange={(event) =>
                  onCountInChange(event.target.checked)
                }
                aria-label="Enable count-in"
                className="h-5 w-5 cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Metronome */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <p className="text-sm font-medium">
                  Metronome
                </p>
                <p className="text-xs text-slate-400">
                  Audible beat guidance
                </p>
              </div>

              <select
                value={metronomeMode}
                onChange={(event) =>
                  onMetronomeModeChange(
                    event.target.value as MetronomeMode,
                  )
                }
                className={inputClass}
                aria-label="Metronome mode"
              >
                <option value="off">Off</option>
                <option value="count-in">
                  Count-in Only
                </option>
                <option value="continuous">
                  Continuous
                </option>
              </select>
            </div>

            {/* Loop practice */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    Loop Practice
                  </p>
                  <p className="text-xs text-slate-400">
                    Repeat selected measures
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={loopEnabled}
                  onChange={(event) =>
                    onLoopEnabledChange(event.target.checked)
                  }
                  aria-label="Enable measure looping"
                  className="h-5 w-5 cursor-pointer accent-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="dock-loop-start"
                    className="text-xs text-slate-400"
                  >
                    From
                  </label>

                  <select
                    id="dock-loop-start"
                    value={loopStart}
                    disabled={!loopEnabled}
                    onChange={(event) => {
                      const start = Number(event.target.value);

                      onLoopRangeChange(
                        start,
                        Math.max(start, loopEnd),
                      );
                    }}
                    className={`${inputClass} w-full`}
                  >
                    {measureOptions.map((number) => (
                      <option key={number} value={number}>
                        Measure {number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="dock-loop-end"
                    className="text-xs text-slate-400"
                  >
                    To
                  </label>

                  <select
                    id="dock-loop-end"
                    value={loopEnd}
                    disabled={!loopEnabled}
                    onChange={(event) => {
                      const end = Number(event.target.value);

                      onLoopRangeChange(
                        Math.min(loopStart, end),
                        end,
                      );
                    }}
                    className={`${inputClass} w-full`}
                  >
                    {measureOptions.map((number) => (
                      <option key={number} value={number}>
                        Measure {number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN DOCK */}
      <div className="mx-auto max-w-6xl">

        {/* TOP ROW: PRACTICE SPEED AND SETTINGS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 px-4 py-2">

          <div className="flex flex-wrap items-center gap-3">

            <label
              htmlFor="dock-practice-speed"
              className="text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              Speed
            </label>

            <div className="flex items-center gap-1">
              <input
                id="dock-practice-speed"
                type="number"
                min={25}
                max={200}
                step={1}
                value={speedInput}
                onChange={(event) =>
                  setSpeedInput(event.target.value)
                }
                onBlur={commitSpeed}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                className={`${inputClass} w-16 text-center font-semibold`}
              />

              <span className="text-sm text-slate-300">
                %
              </span>
            </div>

            <span className="text-xs font-medium text-cyan-400">
              {Number(effectiveTempo.toFixed(1))} BPM
            </span>

            <button
              type="button"
              onClick={() => {
                onPlaybackRateChange(1);
                setSpeedInput("100");
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Reset
            </button>
            <button
                type="button"
                onClick={() => onNoteAudioChange(!noteAudioEnabled)}
                aria-pressed={noteAudioEnabled}
                aria-label={
                    noteAudioEnabled
                    ? "Turn off ocarina note audio"
                    : "Turn on ocarina note audio"
                }
                className={[
                    "flex items-center gap-2 rounded-md border",
                    "px-3 py-1.5 text-xs font-semibold",
                    "transition-colors",
                    noteAudioEnabled
                    ? "border-cyan-400 bg-cyan-500/15 text-cyan-300"
                    : "border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700",
                ].join(" ")}
                >
                {noteAudioEnabled ? (
                    <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    >
                    <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                    <path d="M19 5a10 10 0 0 1 0 14" />
                    </svg>
                ) : (
                    <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    >
                    <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                    <path d="m17 9 5 6" />
                    <path d="m22 9-5 6" />
                    </svg>
                )}

                Note Audio {noteAudioEnabled ? "On" : "Off"}
                </button>
          </div>

          {/* STATUS AND SETTINGS */}
          <div className="flex items-center gap-3">

            {loopEnabled && (
              <span className="hidden text-xs text-cyan-400 sm:inline">
                Loop {loopStart}–{loopEnd}
              </span>
            )}

            <button
              type="button"
              onClick={() =>
                setSettingsOpen((previous) => !previous)
              }
              aria-expanded={settingsOpen}
              aria-controls="practice-settings"
              className={[
                "rounded-md border px-3 py-1.5",
                "text-xs font-semibold transition-colors",
                settingsOpen
                  ? "border-cyan-400 bg-cyan-500 text-slate-950"
                  : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700",
              ].join(" ")}
            >
              {settingsOpen ? "Hide Settings" : "Settings"}
            </button>
          </div>
        </div>

        {/* BOTTOM ROW: PLAYBACK */}
        <div className="flex items-center gap-4 px-4 py-3">

          {/* PLAY / PAUSE */}
          <button
            type="button"
            onClick={isPlaying ? onPause : onPlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500 font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
          >
            {isPlaying ? (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7 4.5a1 1 0 0 1 1.53-.85l11 7.5a1 1 0 0 1 0 1.7l-11 7.5A1 1 0 0 1 7 19.5z" />
              </svg>
            )}
          </button>

          {/* STOP */}
          <button
            type="button"
            onClick={onStop}
            disabled={!isPlaying && currentTimeMs === 0}
            aria-label="Stop playback"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="h-3.5 w-3.5 rounded-sm bg-current" />
          </button>

          {/* PROGRESS AND SEEKING */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">

            <input
              type="range"
              min={0}
              max={Math.max(durationMs, 1)}
              step={10}
              value={Math.min(
                Math.max(currentTimeMs, 0),
                Math.max(durationMs, 1),
              )}
              onChange={(event) =>
                onSeek(Number(event.target.value))
              }
              aria-label="Song playback position"
              className="h-2 w-full cursor-pointer accent-cyan-400"
            />

            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{formatTime(currentTimeMs)}</span>
              <span>{formatTime(durationMs)}</span>
            </div>
          </div>

          <span className="hidden w-10 shrink-0 text-right text-xs tabular-nums text-slate-400 sm:block">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
}

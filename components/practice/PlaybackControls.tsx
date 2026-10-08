"use client";

type PlaybackControlsProps = {
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;

  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (timeMs: number) => void;
};

function formatTime(timeMs: number) {
  const totalSeconds = Math.floor(
    timeMs / 1000,
  );

  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export default function PlaybackControls({
  isPlaying,
  currentTimeMs,
  durationMs,
  onPlay,
  onPause,
  onStop,
  onSeek,
}: PlaybackControlsProps) {
  const progress =
    durationMs > 0
      ? Math.min(
          100,
          (currentTimeMs / durationMs) *
            100,
        )
      : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={
            isPlaying
              ? onPause
              : onPlay
          }
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {isPlaying
            ? "Pause"
            : "Play"}
        </button>

        <button
          type="button"
          onClick={onStop}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Stop
        </button>

        <span className="ml-auto text-sm text-slate-500">
          {formatTime(currentTimeMs)}
          {" / "}
          {formatTime(durationMs)}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(durationMs, 1)}
        value={Math.min(
          currentTimeMs,
          durationMs,
        )}
        onChange={(event) =>
          onSeek(
            Number(event.target.value),
          )
        }
        className="mt-4 w-full"
        aria-label="Song position"
      />

      <div className="mt-1 text-right text-xs text-slate-400">
        {Math.round(progress)}%
      </div>
    </div>
  );
}
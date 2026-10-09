"use client";

import type { MetronomeMode } from "@/lib/music/metronome";

type MetronomeControlProps = {
  mode: MetronomeMode;
  onChange: (mode: MetronomeMode) => void;
};

export default function MetronomeControl({
  mode,
  onChange,
}: MetronomeControlProps) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <label
        htmlFor="metronome-mode"
        className="mb-2 block text-sm font-semibold text-white"
      >
        Metronome
      </label>

      <select
        id="metronome-mode"
        value={mode}
        onChange={(event) =>
          onChange(event.target.value as MetronomeMode)
        }
        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
      >
        <option value="count-in">
          Count-in Only
        </option>

        <option value="continuous">
          Continuous
        </option>

        <option value="off">
          Off
        </option>
      </select>

      <p className="mt-2 text-xs text-slate-400">
        {mode === "count-in"
          ? "Clicks before the song begins."
          : mode === "continuous"
            ? "Clicks during count-in and playback."
            : "No metronome sounds."}
      </p>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

type TempoControlProps = {
  originalTempo: number;
  playbackRate: number;
  onChange: (rate: number) => void;
};

export default function TempoControl({
  originalTempo,
  playbackRate,
  onChange,
}: TempoControlProps) {
  const percentage = Math.round(playbackRate * 100);

  const [inputValue, setInputValue] = useState(
    String(percentage),
  );

  useEffect(() => {
    setInputValue(String(percentage));
  }, [percentage]);

  const effectiveTempo =
    originalTempo * playbackRate;

  function commitPercentage() {
    const parsed = Number(inputValue);

    if (!Number.isFinite(parsed) || inputValue.trim() === "") {
      setInputValue(String(percentage));
      return;
    }

    const clamped = Math.max(
      25,
      Math.min(200, Math.round(parsed)),
    );

    onChange(clamped / 100);
    setInputValue(String(clamped));
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div>
        <label
          htmlFor="practice-speed"
          className="block text-sm font-semibold text-white"
        >
          Practice Speed
        </label>

        <p className="text-xs text-slate-400">
          Original: {originalTempo} BPM
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="practice-speed"
          type="number"
          min={25}
          max={200}
          step={1}
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
          }}
          onBlur={commitPercentage}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="w-20 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-center text-lg font-semibold text-white outline-none focus:border-cyan-400"
        />

        <span className="font-semibold text-white">
          %
        </span>
      </div>

      <div className="text-sm text-cyan-400">
        {Number(effectiveTempo.toFixed(1))} BPM
      </div>

      <button
        type="button"
        onClick={() => {
          onChange(1);
          setInputValue("100");
        }}
        className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
      >
        Reset
      </button>
    </div>
  );
}
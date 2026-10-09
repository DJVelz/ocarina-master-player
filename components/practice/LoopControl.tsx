"use client";

type LoopControlProps = {
  enabled: boolean;
  startMeasure: number;
  endMeasure: number;
  totalMeasures: number;

  onEnabledChange: (enabled: boolean) => void;
  onRangeChange: (
    startMeasure: number,
    endMeasure: number,
  ) => void;
};

export default function LoopControl({
  enabled,
  startMeasure,
  endMeasure,
  totalMeasures,
  onEnabledChange,
  onRangeChange,
}: LoopControlProps) {
  const options = Array.from(
    { length: totalMeasures },
    (_, index) => index + 1,
  );

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <label className="mb-4 flex items-center gap-3 text-sm font-semibold text-white">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) =>
            onEnabledChange(event.target.checked)
          }
          className="h-4 w-4 accent-cyan-400"
        />
        Enable Loop Practice
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="loop-start"
            className="mb-2 block text-xs text-slate-400"
          >
            Start Measure
          </label>

          <select
            id="loop-start"
            value={startMeasure}
            disabled={!enabled}
            onChange={(event) => {
              const start = Number(event.target.value);

              onRangeChange(
                start,
                Math.max(start, endMeasure),
              );
            }}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 p-2 text-white disabled:opacity-50"
          >
            {options.map((number) => (
              <option key={number} value={number}>
                Measure {number}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="loop-end"
            className="mb-2 block text-xs text-slate-400"
          >
            End Measure
          </label>

          <select
            id="loop-end"
            value={endMeasure}
            disabled={!enabled}
            onChange={(event) => {
              const end = Number(event.target.value);

              onRangeChange(
                Math.min(startMeasure, end),
                end,
              );
            }}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 p-2 text-white disabled:opacity-50"
          >
            {options.map((number) => (
              <option key={number} value={number}>
                Measure {number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {enabled && (
        <p className="mt-3 text-xs text-cyan-400">
          Repeating measures {startMeasure}–{endMeasure}
        </p>
      )}
    </div>
  );
}
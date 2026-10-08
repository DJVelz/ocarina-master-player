"use client";

type CountInDisplayProps = {
  isCountingIn: boolean;
  countInBeat: number;
  beats: number;
  isPlaying: boolean;
};

export default function CountInDisplay({
  isCountingIn,
  countInBeat,
  beats,
  isPlaying,
}: CountInDisplayProps) {
  if (!isCountingIn) return null;

  return (
    <div className="rounded-xl border border-cyan-500/40 bg-slate-900 p-5 text-center">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan-400">
        {isPlaying ? "Get Ready" : "Count-in Paused"}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {Array.from(
          { length: beats },
          (_, index) => index + 1,
        ).map((beat) => (
          <div
            key={beat}
            className={[
              "flex h-14 w-14 items-center justify-center",
              "rounded-xl border-2 text-2xl font-bold",
              beat === countInBeat
                ? "scale-110 border-cyan-300 bg-cyan-400 text-slate-950"
                : beat < countInBeat
                  ? "border-slate-600 bg-slate-700 text-slate-400"
                  : "border-slate-700 bg-slate-800 text-slate-500",
            ].join(" ")}
          >
            {beat}
          </div>
        ))}
      </div>
    </div>
  );
}
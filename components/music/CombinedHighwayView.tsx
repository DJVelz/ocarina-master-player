"use client";

import type { OcarinaSong } from "@/lib/music/types";

import HighwayView from "./HighwayView";
import PitchHighwayView from "./PitchHighwayView";

type CombinedHighwayViewProps = {
  song: OcarinaSong;
  currentTimeMs: number;
};

export default function CombinedHighwayView({
  song,
  currentTimeMs,
}: CombinedHighwayViewProps) {
  return (
    <div className="space-y-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Fingerings
        </p>

        <HighwayView
          song={song}
          currentTimeMs={currentTimeMs}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Pitch
        </p>

        <PitchHighwayView
          song={song}
          currentTimeMs={currentTimeMs}
        />
      </div>
    </div>
  );
}
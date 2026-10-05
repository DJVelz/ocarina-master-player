import type { NoteDuration, SongNote } from "./types";

export function durationInBeats(note: Pick<SongNote, "duration" | "dotted">): number {
  const values = { whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25 } as const;
  const base = values[note.duration];
  return note.dotted ? base * 1.5 : base;
}

export function durationInMilliseconds(
  bpm: number,
  note: Pick<SongNote, "duration" | "dotted">,
): number {
  return durationInBeats(note) * (60_000 / bpm);
}

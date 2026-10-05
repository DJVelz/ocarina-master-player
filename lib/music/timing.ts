import type {
  NoteDuration,
  SongNote,
} from "./types";

const durationValues: Record<
  NoteDuration,
  number
> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
};

export function durationInBeats(
  note: Pick<SongNote, "duration" | "dotted">,
): number {
  const base = durationValues[note.duration];

  return note.dotted
    ? base * 1.5
    : base;
}

export function durationInMilliseconds(
  bpm: number,
  note: Pick<SongNote, "duration" | "dotted">,
): number {
  return durationInBeats(note) * (60_000 / bpm);
}

export function measureLengthInBeats(
  notes: SongNote[],
): number {
  return notes.reduce(
    (total, note) =>
      total + durationInBeats(note),
    0,
  );
}

export function expectedMeasureLengthInBeats(
  beats: number,
  beatValue: number,
): number {
  return beats * (4 / beatValue);
}
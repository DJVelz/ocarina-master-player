import type {
  OcarinaSong,
  SongNote,
} from "./types";

import {
  durationInBeats,
  durationInMilliseconds,
} from "./timing";

export type TimedNote = {
  note: SongNote;

  measureNumber: number;
  noteIndex: number;

  startBeat: number;
  durationBeats: number;
  endBeat: number;

  startMs: number;
  durationMs: number;
  endMs: number;
};

export function buildSongTimeline(
  song: OcarinaSong,
): TimedNote[] {
  const timeline: TimedNote[] = [];

  let currentBeat = 0;
  let currentMs = 0;

  song.measures.forEach((measure) => {
    measure.notes.forEach((note, noteIndex) => {
      const noteDurationBeats = durationInBeats(note);

      const noteDurationMs =
        durationInMilliseconds(
          song.tempo,
          note,
        );

      timeline.push({
        note,

        measureNumber: measure.number,
        noteIndex,

        startBeat: currentBeat,
        durationBeats: noteDurationBeats,
        endBeat:
          currentBeat + noteDurationBeats,

        startMs: currentMs,
        durationMs: noteDurationMs,
        endMs:
          currentMs + noteDurationMs,
      });

      currentBeat += noteDurationBeats;
      currentMs += noteDurationMs;
    });
  });

  return timeline;
}

export function getSongDurationMs(
  song: OcarinaSong,
): number {
  const timeline =
    buildSongTimeline(song);

  if (timeline.length === 0) {
    return 0;
  }

  return timeline[timeline.length - 1].endMs;
}
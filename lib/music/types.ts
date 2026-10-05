export type NoteDuration =
  | "whole"
  | "half"
  | "quarter"
  | "eighth"
  | "sixteenth";

export type Accidental =
  | "sharp"
  | "flat"
  | "natural";

export type SongNote = {
  id: string;

  /**
   * "note" produces a pitched note.
   * "rest" produces a musical rest.
   */
  type: "note" | "rest";

  /**
   * Required for notes.
   * Not used for rests.
   *
   * Examples:
   * C5
   * F#5
   * Bb5
   */
  pitch?: string;

  duration: NoteDuration;

  dotted?: boolean;

  /**
   * Optional because the pitch itself may contain
   * an accidental, but keeping it explicit makes
   * the music model easier to work with later.
   */
  accidental?: Accidental;

  tie?: "start" | "continue" | "end";
};

export type Measure = {
  number: number;
  notes: SongNote[];
};

export type OcarinaSong = {
  id: string;
  title: string;
  artist?: string;
  composer?: string;

  tempo: number;

  timeSignature: {
    beats: number;
    beatValue: 2 | 4 | 8 | 16;
  };

  instrument: string;

  measures: Measure[];
};
export type NoteDuration = "whole" | "half" | "quarter" | "eighth" | "sixteenth";
export type Accidental = "sharp" | "flat" | "natural";

export type SongNote = {
  id: string;
  pitch: string;
  duration: NoteDuration;
  dotted?: boolean;
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
  timeSignature: { beats: number; beatValue: 2 | 4 | 8 | 16 };
  instrument: string;
  measures: Measure[];
};

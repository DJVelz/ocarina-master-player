import type {
  Measure,
  OcarinaSong,
} from "./types";

import {
  expectedMeasureLengthInBeats,
  measureLengthInBeats,
} from "./timing";

export type MeasureValidation = {
  valid: boolean;
  actualBeats: number;
  expectedBeats: number;
  difference: number;
};

export function validateMeasure(
  measure: Measure,
  song: Pick<OcarinaSong, "timeSignature">,
): MeasureValidation {
  const expectedBeats =
    expectedMeasureLengthInBeats(
      song.timeSignature.beats,
      song.timeSignature.beatValue,
    );

  const actualBeats =
    measureLengthInBeats(measure.notes);

  const difference =
    actualBeats - expectedBeats;

  return {
    valid: difference === 0,
    actualBeats,
    expectedBeats,
    difference,
  };
}

export function validateSong(
  song: OcarinaSong,
): boolean {
  return song.measures.every(
    (measure) =>
      validateMeasure(measure, song).valid,
  );
}
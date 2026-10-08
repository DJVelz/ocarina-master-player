import { twelveHoleC } from "./twelveHoleC";

export const instruments = {
  "12-hole-c": twelveHoleC,
};

export function getInstrument(instrumentId: string) {
  return instruments[
    instrumentId as keyof typeof instruments
  ];
}
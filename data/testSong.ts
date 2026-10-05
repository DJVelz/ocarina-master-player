import type { OcarinaSong } from "@/lib/music/types";

export const testSong: OcarinaSong = {
  id: "test-song",
  title: "Test Song",
  tempo: 80,
  timeSignature: { beats: 4, beatValue: 4 },
  instrument: "12-hole-c",
  measures: [
    { number: 1, notes: [
      { id: "m1-n1", pitch: "C5", duration: "quarter" },
      { id: "m1-n2", pitch: "D5", duration: "quarter" },
      { id: "m1-n3", pitch: "E5", duration: "half" },
    ]},
    { number: 2, notes: [
      { id: "m2-n1", pitch: "G5", duration: "eighth" },
      { id: "m2-n2", pitch: "A5", duration: "eighth" },
      { id: "m2-n3", pitch: "G5", duration: "quarter" },
      { id: "m2-n4", pitch: "E5", duration: "quarter" },
    ]},
  ],
};

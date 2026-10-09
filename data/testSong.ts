import type { OcarinaSong } from "@/lib/music/types";

export const testSong: OcarinaSong = {
  id: "test-song",
  title: "Test Song",
  tempo: 80,

  timeSignature: {
    beats: 4,
    beatValue: 4,
  },

  instrument: "12-hole-c",

  measures: [
    {
      number: 1,

      notes: [
        {
          id: "m1-n1",
          type: "note",
          pitch: "C5",
          duration: "sixteenth",
        },

        {
          id: "m1-n2",
          type: "rest",
          duration: "sixteenth",
        },

        {
          id: "m1-n3",
          type: "rest",
          duration: "eighth",
        },

        {
          id: "m1-n4",
          type: "note",
          pitch: "D5",
          duration: "quarter",
        },

        {
          id: "m1-n5",
          type: "note",
          pitch: "E5",
          duration: "half",
        },
      ],
    },

    {
      number: 2,

      notes: [
        {
          id: "m2-n1",
          type: "note",
          pitch: "G5",
          duration: "eighth",
        },

        {
          id: "m2-n2",
          type: "rest",
          duration: "eighth",
        },

        {
          id: "m2-n3",
          type: "note",
          pitch: "G5",
          duration: "quarter",
        },

        {
          id: "m2-n4",
          type: "note",
          pitch: "F#5",
          duration: "quarter",
          dotted: true,
        },

        {
          id: "m2-n5",
          type: "note",
          pitch: "E5",
          duration: "eighth",
        },
      ],
    },

    {
      number: 3,
      notes: [
        {
          id: "m3-n1",
          type: "note",
          pitch: "C5",
          duration: "quarter",
        },
        {
          id: "m3-n2",
          type: "note",
          pitch: "E5",
          duration: "quarter",
        },
        {
          id: "m3-n3",
          type: "note",
          pitch: "G5",
          duration: "quarter",
        },
        {
          id: "m3-n4",
          type: "note",
          pitch: "C6",
          duration: "quarter",
        },
      ],
    },

    {
      number: 4,
      notes: [
        {
          id: "m4-n1",
          type: "note",
          pitch: "C6",
          duration: "half",
        },
        {
          id: "m4-n2",
          type: "note",
          pitch: "G5",
          duration: "half",
        },
      ],
    },
    
    {
      number: 5,
      notes: [
        {
          id: "m5-n1",
          type: "note",
          pitch: "F5",
          duration: "quarter",
        },
        {
          id: "m5-n2",
          type: "note",
          pitch: "E5",
          duration: "quarter",
        },
        {
          id: "m5-n3",
          type: "note",
          pitch: "D5",
          duration: "quarter",
        },
        {
          id: "m5-n4",
          type: "note",
          pitch: "C5",
          duration: "quarter",
        },
      ],
    },
  ],
};
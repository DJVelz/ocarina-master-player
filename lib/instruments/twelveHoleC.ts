export type HoleId =
  | "leftThumb"
  | "leftIndex"
  | "leftMiddle"
  | "leftRing"
  | "leftPinky"
  | "leftSubhole"
  | "rightThumb"
  | "rightIndex"
  | "rightMiddle"
  | "rightRing"
  | "rightPinky"
  | "rightSubhole";

export type Fingering = {
  name: string;
  covered: HoleId[];
};

export const twelveHoleC = {
  id: "12-hole-c",
  name: "12-Hole C",

  fingerings: {
    // ─────────────
    // Natural notes
    // ─────────────

    C5: {
      name: "C5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftMiddle",
        "leftRing",
        "leftPinky",
        "rightThumb",
        "rightIndex",
        "rightMiddle",
        "rightRing",
        "rightPinky",
      ],
    },

    D5: {
      name: "D5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftMiddle",
        "leftRing",
        "leftPinky",
        "rightThumb",
        "rightIndex",
        "rightMiddle",
        "rightRing",
      ],
    },

    E5: {
      name: "E5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftMiddle",
        "leftRing",
        "leftPinky",
        "rightThumb",
        "rightIndex",
        "rightMiddle",
      ],
    },

    F5: {
      name: "F5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftMiddle",
        "leftRing",
        "leftPinky",
        "rightThumb",
        "rightIndex",
      ],
    },

    G5: {
      name: "G5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftMiddle",
        "leftRing",
        "leftPinky",
        "rightThumb",
      ],
    },

    A5: {
      name: "A5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftMiddle",
        "leftPinky",
        "rightThumb",
      ],
    },

    B5: {
      name: "B5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftPinky",
        "rightThumb",
      ],
    },

    C6: {
      name: "C6",
      covered: [
        "leftThumb",
        "leftPinky",
        "rightThumb",
      ],
    },

    D6: {
      name: "D6",
      covered: [
        "leftPinky",
        "rightThumb",
      ],
    },

    E6: {
      name: "E6",
      covered: [
        "leftPinky",
      ],
    },

    F6: {
      name: "F6",
      covered: [],
    },

    // ─────────────
    // Chromatic notes
    // ─────────────

    "C#5": {
      name: "C#5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftMiddle",
        "leftRing",
        "leftPinky",
        "rightThumb",
        "rightIndex",
        "rightMiddle",
        "rightRing",
        "rightSubhole",
      ],
    },

    "D#5": {
      name: "D#5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftMiddle",
        "leftRing",
        "leftPinky",
        "rightThumb",
        "rightIndex",
        "rightMiddle",
        "rightSubhole",
      ],
    },

    "F#5": {
      name: "F#5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftMiddle",
        "leftRing",
        "leftPinky",
        "rightThumb",
        "rightRing",
      ],
    },

    "G#5": {
      name: "G#5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftMiddle",
        "leftRing",
        "leftPinky",
        "rightThumb",
        "rightRing",
      ],
    },

    "A#5": {
      name: "A#5",
      covered: [
        "leftThumb",
        "leftIndex",
        "leftMiddle",
        "leftPinky",
        "rightThumb",
        "rightRing",
      ],
    },

    "C#6": {
      name: "C#6",
      covered: [
        "leftThumb",
        "leftPinky",
        "rightThumb",
        "rightRing",
      ],
    },

    "D#6": {
      name: "D#6",
      covered: [
        "leftPinky",
        "rightThumb",
        "rightRing",
      ],
    },
  } satisfies Record<string, Fingering>,
};
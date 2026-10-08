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
  } satisfies Record<string, Fingering>,
};
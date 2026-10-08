export type Fingering = {
  name: string;
  holes: boolean[];
};

export const twelveHoleC = {
  id: "12-hole-c",
  name: "12-Hole C",

  fingerings: {
    C5: {
      name: "C5",
      holes: [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ],
    },

    D5: {
      name: "D5",
      holes: [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
      ],
    },

    E5: {
      name: "E5",
      holes: [
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        false,
      ],
    },

    F5: {
      name: "F5",
      holes: [
        true,
        true,
        true,
        true,
        true,
        false,
        false,
        false,
      ],
    },

    G5: {
      name: "G5",
      holes: [
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
      ],
    },

    A5: {
      name: "A5",
      holes: [
        true,
        true,
        true,
        false,
        false,
        false,
        false,
        false,
      ],
    },
  } satisfies Record<string, Fingering>,
};
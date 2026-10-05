export type Fingering = { name: string; holes: boolean[] };

export const twelveHoleC = {
  id: "12-hole-c",
  name: "12-Hole C",
  fingerings: {
    C5: { name: "C5", holes: [] },
    D5: { name: "D5", holes: [] },
    E5: { name: "E5", holes: [] },
    F5: { name: "F5", holes: [] },
    G5: { name: "G5", holes: [] },
    A5: { name: "A5", holes: [] },
  } satisfies Record<string, Fingering>,
};

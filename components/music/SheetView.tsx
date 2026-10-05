"use client";

import { useEffect, useRef } from "react";
import {
  Accidental,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from "vexflow";
import {
  validateMeasure,
} from "@/lib/music/validation";

import type { OcarinaSong, SongNote } from "@/lib/music/types";

type SheetViewProps = {
  song: OcarinaSong;
};

const durationToVexFlow = {
  whole: "w",
  half: "h",
  quarter: "q",
  eighth: "8",
  sixteenth: "16",
} as const;

function songNoteToVexFlow(note: SongNote) {
  const duration =
    durationToVexFlow[note.duration];

  // Rests use "r" in VexFlow's duration notation.
  if (note.type === "rest") {
    const rest = new StaveNote({
      keys: ["b/4"],
      duration: `${duration}r`,
    });

    if (note.dotted) {
      rest.addDot(0);
    }

    return rest;
  }

  if (!note.pitch) {
    throw new Error(
      `Note ${note.id} is missing a pitch.`,
    );
  }

  const match = note.pitch.match(
    /^([A-Ga-g])([#b]?)(\d)$/,
  );

  if (!match) {
    throw new Error(
      `Invalid pitch: ${note.pitch}`,
    );
  }

  const [, letter, accidental, octave] =
    match;

  const vexNote = new StaveNote({
    keys: [
      `${letter.toLowerCase()}/${octave}`,
    ],
    duration,
  });

  if (accidental) {
    vexNote.addAccidental(
      0,
      new Accidental(accidental),
    );
  }

  if (note.dotted) {
    vexNote.addDot(0);
  }

  return vexNote;
}

export default function SheetView({ song }: SheetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    // Remove the previous SVG when React re-renders.
    container.innerHTML = "";

    const measureHeight = 140;
    const width = 900;
    const height = song.measures.length * measureHeight + 40;

    // VexFlow's low-level Renderer accepts the actual DOM element.
    const renderer = new Renderer(
      container,
      Renderer.Backends.SVG,
    );

    renderer.resize(width, height);

    const context = renderer.getContext();

    song.measures.forEach((measure, index) => {
      const y = 20 + index * measureHeight;

      const stave = new Stave(
        40,
        y,
        800,
      );

      stave.addClef("treble");

      if (index === 0) {
        stave.addTimeSignature(
          `${song.timeSignature.beats}/${song.timeSignature.beatValue}`,
        );
      }

      stave.setContext(context).draw();

      const notes = measure.notes.map(
        songNoteToVexFlow,
      );

      const voice = new Voice({
        numBeats: song.timeSignature.beats,
        beatValue: song.timeSignature.beatValue,
      });

      voice.addTickables(notes);

      new Formatter()
        .joinVoices([voice])
        .format(
          [voice],
          700,
        );

      voice.draw(context, stave);
    });
  }, [song]);

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-6">
      <div ref={containerRef} />
    </div>
  );
}
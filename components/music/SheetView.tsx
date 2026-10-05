"use client";

import { useEffect, useRef } from "react";
import {
  Accidental,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  Voice,
} from "vexflow";

import type {
  OcarinaSong,
  SongNote,
} from "@/lib/music/types";

import { validateMeasure } from "@/lib/music/validation";

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
  const duration = durationToVexFlow[note.duration];

  // -------------------------
  // REST
  // -------------------------

  if (note.type === "rest") {
    const rest = new StaveNote({
      keys: ["b/4"],
      duration: `${duration}r`,
    });

    if (note.dotted) {
      Dot.buildAndAttach([rest], {
        all: true,
      });
    }

    return rest;
  }

  // -------------------------
  // NOTE
  // -------------------------

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

  // -------------------------
  // ACCIDENTAL
  // -------------------------

  if (accidental) {
  vexNote.addModifier(
    new Accidental(accidental),
    0,
  );
}

  // -------------------------
  // DOTTED NOTE
  // -------------------------

  if (note.dotted) {
    Dot.buildAndAttach([vexNote], {
      all: true,
    });
  }

  return vexNote;
}

export default function SheetView({
  song,
}: SheetViewProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) {
      return;
    }

    // Clear previous SVG.
    container.innerHTML = "";

    const measureHeight = 140;
    const width = 900;
    const height =
      song.measures.length *
        measureHeight +
      40;

    const renderer = new Renderer(
      container,
      Renderer.Backends.SVG,
    );

    renderer.resize(width, height);

    const context =
      renderer.getContext();

    song.measures.forEach(
      (measure, index) => {
        const validation =
          validateMeasure(
            measure,
            song,
          );

        if (!validation.valid) {
          console.warn(
            `Measure ${measure.number} is invalid.`,
            validation,
          );

          return;
        }

        const y =
          20 +
          index * measureHeight;

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

        stave
          .setContext(context)
          .draw();

        const notes =
          measure.notes.map(
            songNoteToVexFlow,
          );

        const voice = new Voice({
          numBeats:
            song.timeSignature.beats,
          beatValue:
            song.timeSignature.beatValue,
        });

        voice.addTickables(notes);

        new Formatter()
          .joinVoices([voice])
          .format(
            [voice],
            700,
          );

        voice.draw(
          context,
          stave,
        );
      },
    );
  }, [song]);

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-6">
      <div ref={containerRef} />
    </div>
  );
}
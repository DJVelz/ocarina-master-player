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
  const duration = note.dotted
    ? `${durationToVexFlow[note.duration]}d`
    : durationToVexFlow[note.duration];

  if (note.type === "rest") {
    const rest = new StaveNote({
      keys: ["b/4"],
      duration: `${duration}r`,
    });

    if (note.dotted) {
      Dot.buildAndAttach([rest], { all: true });
    }

    return rest;
  }

  if (!note.pitch) {
    throw new Error(`Note ${note.id} is missing a pitch.`);
  }

  const match = note.pitch.match(/^([A-Ga-g])([#b]?)(\d)$/);

  if (!match) {
    throw new Error(`Invalid pitch: ${note.pitch}`);
  }

  const [, letter, accidental, octave] = match;

  const vexNote = new StaveNote({
    keys: [`${letter.toLowerCase()}/${octave}`],
    duration,
  });

  if (accidental) {
    vexNote.addModifier(
      new Accidental(accidental),
      0,
    );
  }

  if (note.dotted) {
    Dot.buildAndAttach([vexNote], { all: true });
  }

  return vexNote;
}

export default function SheetView({ song }: SheetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    container.innerHTML = "";

    // Layout settings
    const measuresPerRow = 4;
    const measureWidth = 200;
    const measureHeight = 150;

    const leftMargin = 40;
    const topMargin = 30;

    const rowCount = Math.ceil(
      song.measures.length / measuresPerRow,
    );

    const width =
      leftMargin +
      measuresPerRow * measureWidth +
      40;

    const height =
      topMargin +
      rowCount * measureHeight +
      30;

    const renderer = new Renderer(
      container,
      Renderer.Backends.SVG,
    );

    renderer.resize(width, height);

    const context = renderer.getContext();

    song.measures.forEach((measure, index) => {
      const row = Math.floor(index / measuresPerRow);
      const column = index % measuresPerRow;

      const x =
        leftMargin +
        column * measureWidth;

      const y =
        topMargin +
        row * measureHeight;

      const validation = validateMeasure(
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

      const stave = new Stave(
        x,
        y,
        measureWidth,
      );

      // Clef and time signature only appear
      // at the beginning of the song.
      if (index === 0) {
        stave.addClef("treble");

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
          measureWidth - 20,
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
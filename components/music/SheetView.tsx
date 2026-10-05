"use client";

import { useEffect, useRef } from "react";
import {
  Factory,
  Formatter,
  Stave,
  StaveNote,
  Voice,
} from "vexflow";
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
  const match = note.pitch.match(/^([A-G])([#b]?)(\d)$/);

  if (!match) {
    throw new Error(`Invalid pitch: ${note.pitch}`);
  }

  const [, letter, accidental, octave] = match;

  const key = `${letter}${accidental}/${octave}`;

  const vexNote = new StaveNote({
    keys: [key],
    duration: durationToVexFlow[note.duration],
  });

  if (accidental) {
    vexNote.addModifier({
      type: "accidental",
      code: accidental === "#" ? "#" : "b",
    } as never, 0);
  }

  return vexNote;
}

export default function SheetView({ song }: SheetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const container = containerRef.current;

    const width = 900;
    const staveWidth = 800;
    const measureHeight = 140;

    const renderer = new Factory({
      renderer: {
        elementId: container,
        width,
        height: song.measures.length * measureHeight + 40,
      },
    });

    const context = renderer.getContext();

    song.measures.forEach((measure, index) => {
      const y = 20 + index * measureHeight;

      const stave = new Stave(
        40,
        y,
        staveWidth,
      );

      stave.addClef("treble");

      if (index === 0) {
        stave.addTimeSignature(
          `${song.timeSignature.beats}/${song.timeSignature.beatValue}`,
        );
      }

      stave.setContext(context).draw();

      const notes = measure.notes.map(songNoteToVexFlow);

      const voice = new Voice({
        numBeats: song.timeSignature.beats,
        beatValue: song.timeSignature.beatValue,
      });

      voice.addTickables(notes);

      new Formatter()
        .joinVoices([voice])
        .format([voice], staveWidth - 100);

      voice.draw(context, stave);
    });
  }, [song]);

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-6">
      <div ref={containerRef} />
    </div>
  );
}
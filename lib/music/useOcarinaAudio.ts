
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { TimedNote } from "./timeline";
import { getActiveNote } from "./timeline";
import { OcarinaSynth } from "./ocarinaSynth";

type UseOcarinaAudioProps = {
  timeline: TimedNote[];
  currentTimeMs: number;
  isPlaying: boolean;
  isCountingIn: boolean;
  enabled: boolean;
};

export function useOcarinaAudio({
  timeline,
  currentTimeMs,
  isPlaying,
  isCountingIn,
  enabled,
}: UseOcarinaAudioProps) {
  const synthRef = useRef<OcarinaSynth | null>(null);

  const activeNoteIdRef = useRef<string | null>(null);
  const previousTimeRef = useRef(currentTimeMs);

  const [audioReadyVersion, setAudioReadyVersion] =
    useState(0);

  // Call from a user interaction, such as Play.
  // This unlocks audio under browser autoplay rules.
  const unlockAudio = useCallback(async () => {
    if (!synthRef.current) {
      synthRef.current = new OcarinaSynth();
    }

    try {
      await synthRef.current.unlock();

      setAudioReadyVersion((version) => version + 1);
    } catch (error) {
      console.warn("Could not enable note audio:", error);
    }
  }, []);

  useEffect(() => {
    const synth = synthRef.current;

    const movedBackward =
      currentTimeMs < previousTimeRef.current - 20;

    previousTimeRef.current = currentTimeMs;

    // Silence during pauses, stops, count-in,
    // or when the user disables note audio.
    if (!enabled || !isPlaying || isCountingIn) {
      synth?.stop();
      activeNoteIdRef.current = null;
      return;
    }

    const activeNote = getActiveNote(
      timeline,
      currentTimeMs,
    );

    // Rests and empty portions are silent.
    if (
      !activeNote ||
      activeNote.note.type !== "note" ||
      !activeNote.note.pitch
    ) {
      synth?.stop();
      activeNoteIdRef.current = null;
      return;
    }

    // Avoid restarting the same note on every frame.
    // A backwards jump indicates seeking or looping.
    if (
      activeNoteIdRef.current === activeNote.note.id &&
      !movedBackward
    ) {
      return;
    }

    const started = synth?.play(activeNote.note.pitch);

    if (started) {
      activeNoteIdRef.current = activeNote.note.id;
    }
  }, [
    timeline,
    currentTimeMs,
    isPlaying,
    isCountingIn,
    enabled,
    audioReadyVersion,
  ]);

  useEffect(() => {
    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  return {
    unlockAudio,
  };
}

"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  PlaybackEngine,
} from "./playback";

export function usePlayback() {
  const engineRef =
    useRef<PlaybackEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current =
      new PlaybackEngine();
  }

  const engine = engineRef.current;

  const [currentTimeMs, setCurrentTimeMs] =
    useState(0);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [playbackRate, setPlaybackRateState] =
    useState(1);

  useEffect(() => {
    const unsubscribe =
      engine.subscribe((timeMs) => {
        setCurrentTimeMs(timeMs);

        setIsPlaying(
          engine.getState().isPlaying,
        );
      });

    return unsubscribe;
  }, [engine]);

  const setPlaybackRate = (rate: number) => {
    engine.setPlaybackRate(rate);
    setPlaybackRateState(engine.getPlaybackRate());
  };

  return {
    currentTimeMs,
    isPlaying,

    play: () => engine.play(),
    pause: () => engine.pause(),
    stop: () => engine.stop(),

    seek: (timeMs: number) =>
      engine.seek(timeMs),
  };
}
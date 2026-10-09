"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  PlaybackEngine,
  type CountInConfig,
  type PlaybackState,
} from "./playback";

import type { MetronomeMode } from "./metronome";

export function usePlayback(config: CountInConfig) {
  const engineRef = useRef<PlaybackEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new PlaybackEngine(config);
  }

  const engine = engineRef.current;

  const [playbackState, setPlaybackState] =
    useState<PlaybackState>(() => engine.getState());

  const [playbackRate, setPlaybackRateState] =
    useState(1);

  const [countInEnabled, setCountInEnabledState] =
    useState(true);


  const [metronomeMode, setMetronomeModeState] =
    useState<MetronomeMode>("count-in");

  const setMetronomeMode = (mode: MetronomeMode) => {
    engine.setMetronomeMode(mode);
    setMetronomeModeState(mode);
  };

  const setLoopEnabled = (enabled: boolean) => {
    engine.setLoopEnabled(enabled);
  };

  const setLoopRange = (
    startMs: number,
    endMs: number,
  ) => {
    engine.setLoopRange(startMs, endMs);
  };

  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      setPlaybackState(engine.getState());
    });

    return unsubscribe;
  }, [engine]);

  useEffect(() => {
    return () => {
      engine.pause();
    };
  }, [engine]);

  const setPlaybackRate = (rate: number) => {
    engine.setPlaybackRate(rate);
    setPlaybackRateState(engine.getPlaybackRate());
  };

  const setCountInEnabled = (enabled: boolean) => {
    engine.setCountInEnabled(enabled);
    setCountInEnabledState(enabled);
  };

  return {
    ...playbackState,
    playbackRate,
    countInEnabled,
    metronomeMode,

    play: () => engine.play(),
    pause: () => engine.pause(),
    stop: () => engine.stop(),
    seek: (timeMs: number) => engine.seek(timeMs),

    setPlaybackRate,
    setCountInEnabled,
    setMetronomeMode,
    setLoopEnabled,
    setLoopRange,
  };
}
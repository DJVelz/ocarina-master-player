import {
  Metronome,
  type MetronomeMode,
} from "./metronome";

export type PlaybackState = {
  isPlaying: boolean;
  currentTimeMs: number;
  isCountingIn: boolean;
  countInBeat: number;
};

export type PlaybackListener = (
  currentTimeMs: number,
) => void;

export type CountInConfig = {
  tempo: number;
  beats: number;
  beatValue: number;
};

export class PlaybackEngine {
  private isPlaying = false;
  private currentTimeMs = 0;
  private playbackRate = 1;

  private phase: "stopped" | "countdown" | "playing" =
    "stopped";

  private countInEnabled = true;
  private countInProgressBeats = 0;

  private animationFrameId: number | null = null;
  private lastFrameTime = 0;

  private listeners = new Set<PlaybackListener>();

  private metronome = new Metronome();
  private metronomeMode: MetronomeMode = "count-in";  

  dispose() {
    this.pause();
    this.metronome.dispose();
    this.listeners.clear();
  }

  constructor(private countInConfig: CountInConfig) {}

  getState(): PlaybackState {
    return {
      isPlaying: this.isPlaying,
      currentTimeMs: this.currentTimeMs,
      isCountingIn: this.phase === "countdown",
      countInBeat:
        this.phase === "countdown"
          ? Math.min(
              this.countInConfig.beats,
              Math.floor(this.countInProgressBeats) + 1,
            )
          : 0,
    };
  }

  subscribe(listener: PlaybackListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentTimeMs);
    }
  }

  setPlaybackRate(rate: number) {
    if (!Number.isFinite(rate) || rate <= 0) return;

    this.playbackRate = rate;
    this.notify();
  }

  getPlaybackRate() {
    return this.playbackRate;
  }

  setCountInEnabled(enabled: boolean) {
    this.countInEnabled = enabled;

    if (!enabled && this.phase === "countdown") {
      this.phase = this.isPlaying ? "playing" : "stopped";
      this.countInProgressBeats = 0;
    }

    this.notify();
  }

  getCountInEnabled() {
    return this.countInEnabled;
  }

  getMetronomeMode(): MetronomeMode {
  return this.metronomeMode;
  }

  setMetronomeMode(mode: MetronomeMode) {
    this.metronomeMode = mode;
    this.notify();
  }

  private getBeatDurationMs(): number {
    return (
      (60_000 / this.countInConfig.tempo) *
      (4 / this.countInConfig.beatValue)
    );
  }

  private playMetronomeBeat(
    beatIndex: number,
    duringCountIn: boolean,
  ) {
    if (this.metronomeMode === "off") {
      return;
    }

    if (
      !duringCountIn &&
      this.metronomeMode !== "continuous"
    ) {
      return;
    }

    const beatsPerMeasure = this.countInConfig.beats;

    const accent =
      beatIndex % beatsPerMeasure === 0;

    this.metronome.click(accent);
  }

  play() {
    if (this.isPlaying) return;

    // Start unlocking audio during the user's Play interaction.
    void this.metronome.unlock().catch((error) => {
      console.warn("Metronome audio unavailable:", error);
    });

    if (this.phase === "stopped") {
      this.phase =
        this.countInEnabled &&
        this.currentTimeMs === 0 &&
        this.countInConfig.beats > 0
          ? "countdown"
          : "playing";

      this.countInProgressBeats = 0;

      if (this.phase === "countdown") {
        this.playMetronomeBeat(0, true);
      } else if (this.currentTimeMs === 0) {
        this.playMetronomeBeat(0, false);
      }
    }

    this.isPlaying = true;
    this.lastFrameTime = performance.now();

    this.notify();

    this.animationFrameId =
      requestAnimationFrame(this.tick);
  }

  pause() {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.notify();
  }

  stop() {
    this.isPlaying = false;
    this.currentTimeMs = 0;
    this.countInProgressBeats = 0;
    this.phase = "stopped";

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.notify();
  }

  seek(timeMs: number) {
    if (!Number.isFinite(timeMs)) return;

    this.currentTimeMs = Math.max(0, timeMs);
    this.countInProgressBeats = 0;

    // Seeking bypasses the count-in.
    this.phase = this.isPlaying ? "playing" : "stopped";

    this.notify();
  }

  private advanceSongTime(
    elapsedMs: number,
    beatDurationMs: number,
  ) {
    const previousTime = this.currentTimeMs;
    const nextTime = previousTime + elapsedMs;

    if (this.metronomeMode === "continuous") {
      const previousBeat = Math.floor(
        previousTime / beatDurationMs,
      );

      const nextBeat = Math.floor(
        nextTime / beatDurationMs,
      );

      for (
        let beat = previousBeat + 1;
        beat <= nextBeat;
        beat++
      ) {
        this.playMetronomeBeat(beat, false);
      }
    }

    this.currentTimeMs = nextTime;
  }

  private tick = (now: number) => {
    if (!this.isPlaying) return;

    const elapsed = Math.max(
      0,
      now - this.lastFrameTime,
    );

    this.lastFrameTime = now;

    const beatDurationMs = this.getBeatDurationMs();
    const scaledElapsed = elapsed * this.playbackRate;

    if (this.phase === "countdown") {
      const previousBeats =
        this.countInProgressBeats;

      const totalBeats =
        this.countInConfig.beats;

      const advancedBeats =
        scaledElapsed / beatDurationMs;

      const nextBeats =
        previousBeats + advancedBeats;

      // Play clicks for each count-in beat crossed,
      // excluding the song-start boundary.
      const lastCountInBeat = Math.min(
        totalBeats - 1,
        Math.floor(nextBeats),
      );

      for (
        let beat = Math.floor(previousBeats) + 1;
        beat <= lastCountInBeat;
        beat++
      ) {
        this.playMetronomeBeat(beat, true);
      }

      if (nextBeats >= totalBeats) {
        const remainingMs =
          (totalBeats - previousBeats) *
          beatDurationMs;

        const overflowMs = Math.max(
          0,
          scaledElapsed - remainingMs,
        );

        this.phase = "playing";
        this.countInProgressBeats = 0;

        // First beat of the actual song.
        this.playMetronomeBeat(0, false);

        this.advanceSongTime(
          overflowMs,
          beatDurationMs,
        );
      } else {
        this.countInProgressBeats = nextBeats;
      }
    } else {
      this.advanceSongTime(
        scaledElapsed,
        beatDurationMs,
      );
    }

    this.notify();

    this.animationFrameId =
      requestAnimationFrame(this.tick);
  };
}
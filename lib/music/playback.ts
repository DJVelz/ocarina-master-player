export type PlaybackState = {
  isPlaying: boolean;
  currentTimeMs: number;
};

export type PlaybackListener = (
  currentTimeMs: number,
) => void;

export class PlaybackEngine {
  private isPlaying = false;
  private currentTimeMs = 0;
  private playbackRate = 1;

  private animationFrameId: number | null = null;
  private lastFrameTime = 0;

  private listeners = new Set<PlaybackListener>();

  getState(): PlaybackState {
    return {
      isPlaying: this.isPlaying,
      currentTimeMs: this.currentTimeMs,
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

  play() {
    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    this.lastFrameTime = performance.now();

    this.notify();

    this.animationFrameId =
      requestAnimationFrame(
        this.tick,
      );
  }

  pause() {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(
        this.animationFrameId,
      );

      this.animationFrameId = null;
    }

    this.notify();
  }

  stop() {
    this.isPlaying = false;
    this.currentTimeMs = 0;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(
        this.animationFrameId,
      );

      this.animationFrameId = null;
    }

    this.notify();
  }

  seek(timeMs: number) {
    this.currentTimeMs = Math.max(
      0,
      timeMs,
    );

    this.notify();
  }

  private tick = (now: number) => {
    if (!this.isPlaying) {
      return;
    }

    const elapsed =
      now - this.lastFrameTime;

    this.lastFrameTime = now;

    this.currentTimeMs += elapsed * this.playbackRate;

    this.notify();

    this.animationFrameId =
      requestAnimationFrame(
        this.tick,
      );
  };

  setPlaybackRate(rate: number) {
    if (!Number.isFinite(rate) || rate <= 0) {
      return;
    }

    this.playbackRate = rate;
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }
}
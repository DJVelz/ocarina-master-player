export type MetronomeMode =
  | "off"
  | "count-in"
  | "continuous";

export class Metronome {
  private context: AudioContext | null = null;

  async unlock() {
    if (!this.context || this.context.state === "closed") {
      this.context = new AudioContext();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  click(accent = false) {
    const context = this.context;

    if (!context || context.state !== "running") {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    const now = context.currentTime;
    const duration = 0.045;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      accent ? 1200 : 850,
      now,
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      accent ? 0.3 : 0.2,
      now + 0.002,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration,
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  dispose() {
    const context = this.context;
    this.context = null;

    if (context && context.state !== "closed") {
      void context.close();
    }
  }
}
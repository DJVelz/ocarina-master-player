
const NATURAL_NOTES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function pitchToFrequency(pitch: string): number | null {
  const match = pitch.match(/^([A-G])([#b]?)(\d+)$/i);

  if (!match) return null;

  const [, letter, accidental, octave] = match;

  let semitone = NATURAL_NOTES[letter.toUpperCase()];

  if (accidental === "#") semitone += 1;
  if (accidental === "b") semitone -= 1;

  const midi = (Number(octave) + 1) * 12 + semitone;

  // A4 = 440 Hz
  return 440 * Math.pow(2, (midi - 69) / 12);
}

type ActiveVoice = {
  oscillator: OscillatorNode;
  vibrato: OscillatorNode;
  vibratoGain: GainNode;
  envelope: GainNode;
};

export class OcarinaSynth {
  private context: AudioContext | null = null;
  private voice: ActiveVoice | null = null;

  async unlock() {
    if (!this.context || this.context.state === "closed") {
      this.context = new AudioContext();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  play(pitch: string): boolean {
    const frequency = pitchToFrequency(pitch);
    const context = this.context;

    if (
      frequency === null ||
      !context ||
      context.state !== "running"
    ) {
      return false;
    }

    this.stop();

    const now = context.currentTime;

    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    // A mostly pure tone, with subtle harmonics.
    const wave = context.createPeriodicWave(
      new Float32Array([0, 0, 0, 0, 0]),
      new Float32Array([0, 1, 0.13, 0.05, 0.015]),
    );

    oscillator.setPeriodicWave(wave);
    oscillator.frequency.setValueAtTime(frequency, now);

    // Gentle vibrato for a wind-instrument character.
    const vibrato = context.createOscillator();
    const vibratoGain = context.createGain();

    vibrato.frequency.value = 5;
    vibratoGain.gain.value = frequency * 0.002;

    vibrato.connect(vibratoGain);
    vibratoGain.connect(oscillator.frequency);

    // Soft attack; no harsh immediate onset.
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(
      0.16,
      now + 0.045,
    );

    oscillator.connect(envelope);
    envelope.connect(context.destination);

    oscillator.start(now);
    vibrato.start(now);

    const voice: ActiveVoice = {
      oscillator,
      vibrato,
      vibratoGain,
      envelope,
    };

    oscillator.onended = () => {
      oscillator.disconnect();
      vibrato.disconnect();
      vibratoGain.disconnect();
      envelope.disconnect();
    };

    this.voice = voice;
    return true;
  }

  stop() {
    if (!this.voice || !this.context) return;

    const voice = this.voice;
    this.voice = null;

    const now = this.context.currentTime;

    // Gentle release to avoid clicking artifacts.
    voice.envelope.gain.cancelScheduledValues(now);
    voice.envelope.gain.setTargetAtTime(
      0.0001,
      now,
      0.012,
    );

    voice.oscillator.stop(now + 0.09);
    voice.vibrato.stop(now + 0.09);
  }

  dispose() {
    this.stop();

    const context = this.context;
    this.context = null;

    if (context && context.state !== "closed") {
      void context.close();
    }
  }
}

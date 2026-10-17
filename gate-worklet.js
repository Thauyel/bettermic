// Voice gate: opens above threshold, holds open briefly so word tails aren't clipped, then fades out.
class Gate {
  constructor(sampleRate) {
    this.sr = sampleRate;
    this.thresholdDb = -50;
    this.enabled = true;
    this.holdMs = 250;
    this.env = 0;      // smoothed input level (linear)
    this.gain = 0;     // current gate gain 0..1
    this.holdLeft = 0; // samples left before closing
  }

  process(input, output) {
    const thr = Math.pow(10, this.thresholdDb / 20);
    const envCoef = Math.exp(-1 / (0.01 * this.sr));   // 10 ms level follower
    const openCoef = Math.exp(-1 / (0.005 * this.sr)); // 5 ms open
    const closeCoef = Math.exp(-1 / (0.08 * this.sr)); // 80 ms close
    let peak = 0;
    for (let i = 0; i < input.length; i++) {
      const a = Math.abs(input[i]);
      if (a > peak) peak = a;
      this.env = a > this.env ? a : envCoef * this.env + (1 - envCoef) * a;
      if (this.env >= thr) this.holdLeft = (this.holdMs / 1000) * this.sr;
      else if (this.holdLeft > 0) this.holdLeft--;
      const target = !this.enabled || this.holdLeft > 0 ? 1 : 0;
      const c = target > this.gain ? openCoef : closeCoef;
      this.gain = c * this.gain + (1 - c) * target;
      output[i] = input[i] * this.gain;
    }
    return { peak, open: this.gain > 0.5 };
  }
}

if (typeof registerProcessor === 'function') {
  registerProcessor('gate', class extends AudioWorkletProcessor {
    constructor() {
      super();
      this.gate = new Gate(sampleRate);
      this.frames = 0;
      this.peak = 0;
      this.port.onmessage = (e) => Object.assign(this.gate, e.data);
    }
    process([input], [output]) {
      const inp = input?.[0]; // mono: first channel of first input
      const out = output[0];
      if (!inp) return true;
      const { peak, open } = this.gate.process(inp, out);
      for (let ch = 1; ch < output.length; ch++) output[ch].set(out);
      this.peak = Math.max(this.peak, peak);
      if (++this.frames >= 8) { // ~every 21 ms at 48 kHz
        this.port.postMessage({ peak: this.peak, open });
        this.frames = 0;
        this.peak = 0;
      }
      return true;
    }
  });
}

if (typeof module === 'object') module.exports = { Gate };

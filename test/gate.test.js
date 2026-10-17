// Run: npm test
const assert = require('assert');
const { Gate } = require('../src/gate-worklet.js');

const sr = 48000;
const block = (amp, n = 4800) => Float32Array.from({ length: n }, (_, i) => amp * Math.sin(i / 10));
const run = (g, amp) => { const out = new Float32Array(4800); g.process(block(amp), out); return out; };
const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);

const g = new Gate(sr);
g.thresholdDb = -40; // 0.01 linear

assert(rms(run(g, 0.001)) < 1e-4, 'quiet input stays closed');
assert(rms(run(g, 0.5)) > 0.3, 'loud input opens');
assert(rms(run(g, 0.001)) > 5e-4, 'hold keeps gate open right after speech');
for (let i = 0; i < 10; i++) run(g, 0.001);
assert(rms(run(g, 0.001)) < 1e-4, 'gate closes after hold + release');

g.enabled = false;
assert(Math.abs(rms(run(g, 0.001)) - rms(block(0.001))) < 1e-4, 'disabled gate passes audio through');

console.log('gate ok');

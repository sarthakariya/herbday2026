import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!DOCTYPE html><body><div id="mic-level"></div></body>`);
global.document = dom.window.document;

const ITERATIONS = 100000;
const avg = 10; // dummy value

console.log("Starting benchmark...");
console.log(`Running ${ITERATIONS} iterations...`);

// Baseline: Repeated DOM lookup
const startBaseline = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i++) {
    document.getElementById('mic-level').style.width = Math.min(avg * 4, 100) + '%';
}
const endBaseline = process.hrtime.bigint();
const baselineDuration = endBaseline - startBaseline;

// Optimized: Cached DOM element
const micLevel = document.getElementById('mic-level');
const startOptimized = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i++) {
    micLevel.style.width = Math.min(avg * 4, 100) + '%';
}
const endOptimized = process.hrtime.bigint();
const optimizedDuration = endOptimized - startOptimized;

const baselineMs = Number(baselineDuration) / 1e6;
const optimizedMs = Number(optimizedDuration) / 1e6;

console.log(`Baseline (Repeated lookup): ${baselineMs.toFixed(3)} ms`);
console.log(`Optimized (Cached): ${optimizedMs.toFixed(3)} ms`);
console.log(`Improvement: ${(baselineMs / optimizedMs).toFixed(2)}x faster`);

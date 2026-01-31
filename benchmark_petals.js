import { JSDOM } from 'jsdom';
import { performance } from 'perf_hooks';

const dom = new JSDOM(`<!DOCTYPE html><div id="petals-container"></div>`);
const document = dom.window.document;
const petalsContainer = document.getElementById('petals-container');

function runBaseline(iterations) {
    petalsContainer.innerHTML = ''; // Reset
    const start = performance.now();
    for(let i=0; i<iterations; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        const top = Math.random() * 120;
        const left = Math.random() * 100;
        const rot = Math.random() * 360;
        petal.style.top = top + 'px';
        petal.style.left = left + '%';
        petal.style.transform = `rotate(${rot}deg)`;
        const petalColors = ['#e91e63', '#ec407a', '#f48fb1', '#d81b60'];
        petal.style.backgroundColor = petalColors[Math.floor(Math.random()*petalColors.length)];
        petalsContainer.appendChild(petal);
    }
    return performance.now() - start;
}

function runOptimized(iterations) {
    petalsContainer.innerHTML = ''; // Reset
    const start = performance.now();
    const fragment = document.createDocumentFragment();
    for(let i=0; i<iterations; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        const top = Math.random() * 120;
        const left = Math.random() * 100;
        const rot = Math.random() * 360;
        petal.style.top = top + 'px';
        petal.style.left = left + '%';
        petal.style.transform = `rotate(${rot}deg)`;
        const petalColors = ['#e91e63', '#ec407a', '#f48fb1', '#d81b60'];
        petal.style.backgroundColor = petalColors[Math.floor(Math.random()*petalColors.length)];
        fragment.appendChild(petal);
    }
    petalsContainer.appendChild(fragment);
    return performance.now() - start;
}

const ITERATIONS = 10000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);

// Warmup
runBaseline(100);
runOptimized(100);

const baselineTime = runBaseline(ITERATIONS);
console.log(`Baseline (Direct Append): ${baselineTime.toFixed(2)}ms`);

const optimizedTime = runOptimized(ITERATIONS);
console.log(`Optimized (DocumentFragment): ${optimizedTime.toFixed(2)}ms`);

const improvement = ((baselineTime - optimizedTime) / baselineTime) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);

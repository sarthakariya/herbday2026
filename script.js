/* --- CONFIG --- */
const TOTAL_CANDLES = 17;
const BLOW_THRESHOLD = 20; // Reduced from 35 to 20 for easier blowing
const SENSITIVITY_SCALE = 2.5; // Multiplier for visual meter

let audioCtx;
let analyser;
let microphone;
let dataArray;
let isListening = false;
let candlesExtinguished = 0;
let candleElements = [];

/* --- DOM --- */
const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');
const app = document.getElementById('app');
const micMeter = document.getElementById('mic-meter');
const micLevelEl = document.getElementById('mic-level');
const candlesContainer = document.getElementById('candles-container');
const headerText = document.getElementById('header-text');
const replayContainer = document.getElementById('replay-container');
const heartsContainer = document.getElementById('hearts-container');

/* --- INIT --- */
init();

function init() {
    createHearts();
    placeCandles();
    startBtn.addEventListener('click', startApp);
}

function createHearts() {
    for(let i=0; i<30; i++) {
        const h = document.createElement('div');
        h.className = 'heart';
        h.innerHTML = '❤';
        h.style.left = Math.random() * 100 + '%';
        h.style.animationDelay = Math.random() * 5 + 's';
        h.style.fontSize = (10 + Math.random()*20) + 'px';
        heartsContainer.appendChild(h);
    }
}

function placeCandles() {
    // We place candles in an oval shape on top of the cake
    // The cake top center is roughly 50% X, 50% Y within the .cake-stage perspective
    // But since the container is absolute, we calculate relative percentages.
    const centerX = 50; 
    const centerY = 50; 
    const radiusX = 35;
    const radiusY = 15; // Flattened for perspective

    for(let i=0; i<TOTAL_CANDLES; i++) {
        const angle = (i / TOTAL_CANDLES) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;

        const candle = document.createElement('div');
        candle.className = 'candle';
        candle.style.left = x + '%';
        candle.style.top = y + '%';
        candle.style.height = (30 + Math.random() * 15) + 'px';
        candle.style.zIndex = Math.floor(y + 100);
        candle.style.setProperty('--c-color', ['#ff8a80', '#82b1ff', '#b9f6ca', '#ffff8d'][i%4]);

        const flame = document.createElement('div');
        flame.className = 'flame';
        
        const wick = document.createElement('div');
        wick.className = 'absolute bottom-[100%] left-1/2 -translate-x-1/2 w-[2px] h-[5px] bg-[#333]';

        candle.appendChild(wick);
        candle.appendChild(flame);
        candlesContainer.appendChild(candle);

        candleElements.push({ el: candle, flame: flame, active: true, x: x });
    }
}

/* --- START --- */
async function startApp() {
    // 1. Fade Overlay
    startOverlay.style.opacity = '0';
    setTimeout(() => startOverlay.remove(), 1000);

    // 2. Open Curtains
    document.body.classList.add('curtains-open');

    // 3. Audio & Reveal
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        microphone = audioCtx.createMediaStreamSource(stream);

        // Low pass filter to catch "blowing" (wind noise is low freq)
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        
        microphone.connect(filter);
        filter.connect(analyser);
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Wait for curtains (3s) then show UI
        setTimeout(() => {
            app.style.opacity = '1';
            micMeter.style.opacity = '1';
            headerText.style.opacity = '1';
            headerText.style.transform = 'translateY(0)';
            isListening = true;
            loop();
        }, 3000);

    } catch(err) {
        alert("Microphone access is needed to blow out the candles!");
    }
}

/* --- LOOP --- */
function loop() {
    if(!isListening) return;
    requestAnimationFrame(loop);

    analyser.getByteFrequencyData(dataArray);

    // Calculate Average Volume
    let sum = 0;
    const len = dataArray.length;
    for(let i=0; i<len; i++) sum += dataArray[i];
    const avg = sum / len;

    // Visual Meter
    micLevelEl.style.width = Math.min(100, avg * SENSITIVITY_SCALE) + '%';

    // Logic
    if (avg > BLOW_THRESHOLD) {
        // Blowing detected
        
        // 1. Visual Wind Effect
        const intensity = Math.min(1, (avg - BLOW_THRESHOLD) / 50);
        candleElements.forEach(c => {
            if(!c.active) return;
            // Bend flame away from center
            const dir = c.x > 50 ? 1 : -1;
            c.flame.style.transform = `translateX(-50%) rotate(${dir * 20 * intensity}deg) skewX(${dir * 10 * intensity}deg) scale(${1 - intensity * 0.2})`;
            
            // Chance to extinguish (higher vol = higher chance)
            if (Math.random() < 0.05 + (intensity * 0.1)) {
                extinguish(c);
            }
        });
    } else {
        // Reset flames
        candleElements.forEach(c => {
            if(!c.active) return;
            c.flame.style.transform = `translateX(-50%) scale(1)`;
        });
    }

    if (candlesExtinguished >= TOTAL_CANDLES) {
        win();
    }
}

function extinguish(candle) {
    if(!candle.active) return;
    candle.active = false;
    candle.flame.classList.add('out');
    candlesExtinguished++;
    
    // Sound Effect
    const osc = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0; i<d.length; i++) d[i] = Math.random() * 2 - 1;
    osc.buffer = buf;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
}

function win() {
    isListening = false;
    headerText.style.opacity = '0';
    setTimeout(() => {
        headerText.innerHTML = "Happy Birthday<br>My Babyyy! ❤️";
        headerText.style.color = "#e91e63";
        headerText.style.opacity = '1';
    }, 500);

    // Confetti
    const duration = 5000;
    const end = Date.now() + duration;
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());

    // Balloons
    const colors = ['#e91e63', '#9c27b0', '#ffeb3b', '#03a9f4'];
    for(let i=0; i<20; i++) {
        const b = document.createElement('div');
        b.className = 'balloon';
        b.style.left = Math.random() * 100 + '%';
        b.style.background = colors[i % colors.length];
        b.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(b);
    }

    // Music
    playWinMusic();
    
    setTimeout(() => {
        replayContainer.classList.remove('hidden');
        replayContainer.style.opacity = '1';
    }, 2000);
}

function playWinMusic() {
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25];
    notes.forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(0, audioCtx.currentTime + i*0.25);
        g.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + i*0.25 + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i*0.25 + 0.5);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(audioCtx.currentTime + i*0.25);
    });
}

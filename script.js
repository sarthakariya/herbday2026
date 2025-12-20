/* --- CONFIGURATION --- */
const TOTAL_CANDLES = 17;
const BLOW_THRESHOLD = 35; // Sensitivity
const CANDLE_COLORS = ['#F48FB1', '#90CAF9', '#FFF59D', '#A5D6A7'];

/* --- STATE --- */
let audioCtx;
let analyser;
let microphone;
let isListening = false;
let candlesExtinguished = 0;
let candles = [];
let animationFrameId;

/* --- DOM ELEMENTS --- */
const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');
const appStage = document.getElementById('app-stage');
const curtainLeft = document.getElementById('curtain-left');
const curtainRight = document.getElementById('curtain-right');
const micLevelEl = document.getElementById('mic-level');
const micIconEl = document.getElementById('mic-icon');
const headerText = document.getElementById('header-text');
const replayContainer = document.getElementById('replay-container');
const candlesContainer = document.getElementById('candles-container');
const cherriesContainer = document.getElementById('cherries-container');
const particlesContainer = document.getElementById('particles-container');

/* --- INITIALIZATION --- */
window.addEventListener('load', init);

function init() {
    createParticles();
    createCherries();
    createCandles();
    startBtn.addEventListener('click', startApp);
}

function createParticles() {
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'particle text-2xl';
        p.innerText = Math.random() > 0.5 ? '♥' : '★';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (10 + Math.random() * 10) + 's';
        p.style.animationDelay = (Math.random() * 5) + 's';
        particlesContainer.appendChild(p);
    }
}

function createCherries() {
    // 12 Cherries in a circle
    const count = 12;
    const radius = 46; // %
    
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;
        
        const el = document.createElement('div');
        el.className = 'cherry';
        el.style.left = x + '%';
        el.style.top = y + '%';
        // Z-index based on Y to simulate 3D occlusion
        el.style.zIndex = Math.floor(y);
        
        cherriesContainer.appendChild(el);
    }
}

function createCandles() {
    // 17 Candles in a circle (inner)
    const radius = 35; // %
    
    for (let i = 0; i < TOTAL_CANDLES; i++) {
        const angle = (i / TOTAL_CANDLES) * Math.PI * 2;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;
        const color = CANDLE_COLORS[i % CANDLE_COLORS.length];
        const height = 40 + Math.random() * 10;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'candle-wrapper';
        wrapper.style.left = x + '%';
        wrapper.style.top = y + '%';
        wrapper.style.zIndex = Math.floor(y + 10); // Candles in front of cherries if lower
        
        wrapper.innerHTML = `
            <div class="candle-stick" style="height: ${height}px; background: linear-gradient(90deg, rgba(255,255,255,0.6), ${color}, rgba(0,0,0,0.1));"></div>
            <div class="wick"></div>
            <div class="flame" id="flame-${i}">
                <div class="flame-inner"></div>
            </div>
        `;
        
        candlesContainer.appendChild(wrapper);
        candles.push({
            id: i,
            el: wrapper,
            flameEl: wrapper.querySelector('.flame'),
            isLit: true
        });
    }
}

/* --- APP START --- */
async function startApp() {
    // 1. Hide Overlay
    startOverlay.style.opacity = '0';
    setTimeout(() => startOverlay.style.display = 'none', 1000);

    // 2. Open Curtains
    curtainLeft.classList.add('curtain-open-left');
    curtainRight.classList.add('curtain-open-right');

    // 3. Audio Context Setup
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        microphone = audioCtx.createMediaStreamSource(stream);

        // Low pass filter for wind noise
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        microphone.connect(filter);
        filter.connect(analyser);
        analyser.fftSize = 256;

        // 4. Reveal Stage
        setTimeout(() => {
            appStage.style.opacity = '1';
            isListening = true;
            micIconEl.classList.add('text-green-400');
            micIconEl.classList.remove('text-gray-500');
            detectBlow();
        }, 1000); // Wait for curtain start

    } catch (err) {
        console.error("Mic Error", err);
        alert("Please allow microphone access to blow out the candles!");
    }
}

/* --- MICROPHONE LOOP --- */
function detectBlow() {
    if (!isListening) return;
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    // Focus on lower frequencies for "blowing" sound
    const binCount = Math.floor(dataArray.length / 4); 
    for (let i = 0; i < binCount; i++) sum += dataArray[i];
    const average = sum / binCount;

    // Visual Meter
    micLevelEl.style.width = Math.min(average * 3, 100) + '%';

    if (average > BLOW_THRESHOLD) {
        // Blow detected!
        extinguishCandles();
    }

    animationFrameId = requestAnimationFrame(detectBlow);
}

function extinguishCandles() {
    // Randomly extinguish 1-2 candles if any are left
    const litCandles = candles.filter(c => c.isLit);
    if (litCandles.length === 0) return;

    // Trigger visual flicker on all
    litCandles.forEach(c => {
         c.flameEl.style.transform = `translateX(-50%) skewX(${Math.random() * 20 - 10}deg) scale(1.1)`;
    });

    // Actually put out
    const amount = Math.min(litCandles.length, Math.floor(Math.random() * 2) + 1);
    
    for (let i = 0; i < amount; i++) {
        // Pick a random candle from the lit ones
        const idx = Math.floor(Math.random() * litCandles.length);
        const candle = litCandles[idx];
        
        candle.isLit = false;
        candle.flameEl.classList.add('extinguished');
        
        // Create smoke
        const smoke = document.createElement('div');
        smoke.className = 'smoke';
        candle.el.appendChild(smoke);
        
        // Remove from local list to avoid picking again immediately
        litCandles.splice(idx, 1);
        candlesExtinguished++;
        
        playPuffSound();
    }

    // Check Win
    if (candlesExtinguished >= TOTAL_CANDLES) {
        winSequence();
    }
}

function playPuffSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
    osc.buffer = buffer;
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
}

/* --- WIN SEQUENCE --- */
function winSequence() {
    isListening = false;
    cancelAnimationFrame(animationFrameId);
    micLevelEl.style.width = '0%';
    
    // Header Change
    headerText.innerHTML = "Happy Birthday to you My Babyyyyy ❤️";
    headerText.classList.add('text-pink-500');
    
    // Music
    playWinMusic();
    
    // Confetti
    const duration = 5000;
    const end = Date.now() + duration;
    
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ffc107', '#f48fb1'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ffc107', '#f48fb1'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());

    // Show Replay
    setTimeout(() => {
        replayContainer.classList.remove('hidden');
    }, 2000);
}

function playWinMusic() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    // Simple chime melody
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25];
    notes.forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = f;
        gain.gain.setValueAtTime(0, t + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.1, t + i * 0.2 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 1.0);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t + i * 0.2);
    });
}

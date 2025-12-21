/* --- CONFIG --- */
const TOTAL_CANDLES = 17;
const BLOW_THRESHOLD = 30;

/* --- STATE --- */
let audioCtx;
let analyser;
let microphone;
let isListening = false;
let candlesExtinguished = 0;
let candles = [];
let animationFrameId;

/* --- ELEMENTS --- */
const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');
const room = document.getElementById('room');
const micLevelEl = document.getElementById('mic-level');
const candlesContainer = document.getElementById('candles-container');
const sparklesContainer = document.getElementById('sparkles-container');
const balloonContainer = document.getElementById('balloon-container');
const openCardBtn = document.getElementById('open-card-btn');
const cardModal = document.getElementById('card-modal');
const bookWrapper = document.getElementById('book-wrapper');
const closeCardBtn = document.getElementById('close-card-btn');
const headerText = document.getElementById('header-text');

/* --- INIT --- */
window.addEventListener('load', () => {
    initScene();
    startBtn.addEventListener('click', startExperience);
    
    // Card Interactions
    openCardBtn.addEventListener('click', () => {
        cardModal.classList.remove('hidden');
        void cardModal.offsetWidth; // force reflow
        cardModal.classList.remove('opacity-0');
    });
    
    closeCardBtn.addEventListener('click', () => {
        cardModal.classList.add('opacity-0');
        setTimeout(() => {
            cardModal.classList.add('hidden');
            bookWrapper.querySelector('.book').classList.remove('open');
        }, 500);
    });

    bookWrapper.addEventListener('click', () => {
        bookWrapper.querySelector('.book').classList.toggle('open');
    });
});

function initScene() {
    // Generate Candles
    for(let i=0; i<TOTAL_CANDLES; i++) {
        const angle = (i / TOTAL_CANDLES) * Math.PI * 2;
        const radius = 40; // % of container
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const color = ['#F48FB1', '#90CAF9', '#FFF59D'][i%3];
        
        const el = document.createElement('div');
        el.className = 'candle-wrapper';
        el.style.left = `calc(50% + ${x}%)`;
        el.style.top = `calc(50% + ${y}%)`;
        el.style.zIndex = Math.floor(y + 50);
        
        el.innerHTML = `
            <div class="candle-stick" style="background: linear-gradient(90deg, #fff, ${color}, #ddd)"></div>
            <div class="wick"></div>
            <div class="flame-real">
                <div class="flame-inner"></div>
            </div>
        `;
        
        // Click to blow fallback
        el.addEventListener('click', () => blowCandle(i));
        
        candlesContainer.appendChild(el);
        candles.push({ id: i, el: el, lit: true });
    }

    // Generate Sparkles
    for(let i=0; i<15; i++) {
        const s = document.createElement('div');
        s.className = 'sparkle';
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 100 + '%';
        s.style.animationDelay = Math.random() * 2 + 's';
        sparklesContainer.appendChild(s);
    }

    // Generate Balloons
    const balloonColors = ['#e91e63', '#2196f3', '#ffeb3b', '#4caf50'];
    for(let i=0; i<10; i++) {
        const b = document.createElement('div');
        b.className = 'balloon';
        b.style.left = (10 + i * 10) + '%';
        b.style.setProperty('--color', balloonColors[i%4]);
        b.style.setProperty('--duration', (15 + Math.random()*10) + 's');
        b.style.setProperty('--delay', (i * 2) + 's');
        balloonContainer.appendChild(b);
    }
}

/* --- AUDIO & MIC --- */
async function startExperience() {
    startOverlay.style.opacity = '0';
    setTimeout(() => startOverlay.style.display = 'none', 700);
    
    // Immediate Scene Show
    room.style.opacity = '1';
    
    // Open Curtains Fast
    setTimeout(() => {
        document.getElementById('curtain-left').classList.add('curtain-open-left');
        document.getElementById('curtain-right').classList.add('curtain-open-right');
    }, 200);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        microphone = audioCtx.createMediaStreamSource(stream);
        
        // Low pass filter to catch "blow" sound (bass)
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        microphone.connect(filter);
        filter.connect(analyser);
        analyser.fftSize = 256;
        
        isListening = true;
        micIconEl.innerText = "🎤";
        detectBlow();
    } catch (e) {
        console.warn("Mic error", e);
        alert("Microphone not detected. You can tap candles to blow them out!");
    }
}

function detectBlow() {
    if(!isListening) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    
    // Calculate volume
    let sum = 0;
    const bins = Math.floor(data.length / 3);
    for(let i=0; i<bins; i++) sum += data[i];
    const avg = sum / bins;
    
    micLevelEl.style.width = Math.min(avg * 3, 100) + '%';
    
    if(avg > BLOW_THRESHOLD) {
        extinguishRandomCandles();
    }
    
    animationFrameId = requestAnimationFrame(detectBlow);
}

function extinguishRandomCandles() {
    const lit = candles.filter(c => c.lit);
    if(lit.length === 0) return;
    
    const count = Math.ceil(Math.random() * 2); // Blow 1-2 at a time
    for(let i=0; i<count; i++) {
        if(lit.length > 0) {
            const idx = Math.floor(Math.random() * lit.length);
            blowCandle(lit[idx].id);
            lit.splice(idx, 1);
        }
    }
}

function blowCandle(id) {
    const candle = candles[id];
    if(!candle.lit) return;
    
    candle.lit = false;
    candlesExtinguished++;
    
    const flame = candle.el.querySelector('.flame-real');
    flame.classList.add('out');
    
    // Smoke Effect
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    candle.el.appendChild(smoke);
    
    // Sound
    playPuff();
    
    if(candlesExtinguished >= TOTAL_CANDLES) {
        win();
    }
}

function playPuff() {
    if(!audioCtx) return;
    const osc = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0; i<buffer.length; i++) data[i] = Math.random() * 2 - 1;
    osc.buffer = buffer;
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
}

function win() {
    isListening = false;
    cancelAnimationFrame(animationFrameId);
    micLevelEl.style.width = '0%';
    headerText.innerText = "Happy Birthday My Love! ❤️";
    
    // Confetti
    const duration = 5000;
    const end = Date.now() + duration;
    
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
    
    // Play Birthday Tune
    playMelody();
    
    setTimeout(() => {
        openCardBtn.classList.remove('hidden');
    }, 1500);
}

function playMelody() {
    if(!audioCtx) return;
    const t = audioCtx.currentTime;
    // Simple Happy Birthday notes
    const notes = [
        {f: 392, d:0.2}, {f: 392, d:0.2}, {f: 440, d:0.4}, {f: 392, d:0.4}, {f: 523, d:0.4}, {f: 493, d:0.8}
    ];
    let time = t;
    notes.forEach(n => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.frequency.value = n.f;
        osc.type = 'triangle';
        g.gain.setValueAtTime(0.1, time);
        g.gain.exponentialRampToValueAtTime(0.01, time + n.d - 0.05);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + n.d);
        time += n.d;
    });
}

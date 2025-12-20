/* --- CONFIGURATION --- */
const TOTAL_CANDLES = 17;
const BLOW_THRESHOLD = 30; 
const CANDLE_COLORS = ['#ff80ab', '#82b1ff', '#ffff8d', '#b9f6ca'];

/* --- STATE --- */
let audioCtx;
let analyser;
let microphone;
let isListening = false;
let candlesExtinguished = 0;
let candles = [];
let animationFrameId;
let winTriggered = false;

/* --- DOM ELEMENTS --- */
const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');
const room = document.getElementById('room');
const micLevelEl = document.getElementById('mic-level');
const micIconEl = document.getElementById('mic-icon');
const headerText = document.getElementById('header-text');
const candlesContainer = document.getElementById('candles-container');
const cherriesContainer = document.getElementById('cherries-container');
const balloonContainer = document.getElementById('balloon-container');

// Button Elements
const openCardBtn = document.getElementById('open-card-btn');
const replayBtn = document.getElementById('replay-btn');
const cardModal = document.getElementById('card-modal');
const bookElement = document.getElementById('book-element');
const closeCardBtn = document.getElementById('close-card-btn');

/* --- INITIALIZATION --- */
window.addEventListener('load', init);

function init() {
    createCherries();
    createCandles();
    createDecorations();
    startBtn.addEventListener('click', startApp);
    
    // Card Event Listeners
    openCardBtn.addEventListener('click', showCard);
    closeCardBtn.addEventListener('click', hideCard);
    
    // Book Hinge Logic
    bookElement.addEventListener('click', () => {
        bookElement.classList.toggle('open');
    });
}

function createDecorations() {
    const colors = ['#f48fb1', '#ce93d8', '#fff59d', '#80cbc4'];
    for(let i=0; i<15; i++) {
        const b = document.createElement('div');
        b.className = 'balloon';
        b.style.left = (Math.random() * 95) + '%';
        b.style.bottom = '-100px';
        b.style.width = '50px'; b.style.height = '65px';
        b.style.background = `radial-gradient(circle at 30% 30%, #fff, ${colors[i%4]})`;
        b.style.borderRadius = '50% 50% 50% 50% / 40% 40% 60% 60%';
        b.style.opacity = '0.6';
        b.style.animation = `float-up ${20 + Math.random() * 10}s linear infinite`;
        b.style.animationDelay = `${Math.random() * 10}s`;
        
        b.style.transition = 'transform 10s linear';
        
        balloonContainer.appendChild(b);
    }
}

function createCherries() {
    const count = 12;
    const radius = 46; 
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;
        
        const el = document.createElement('div');
        el.className = 'cherry';
        el.style.left = x + '%';
        el.style.top = y + '%';
        el.style.width = '20px'; el.style.height = '20px';
        el.style.background = 'radial-gradient(circle at 30% 30%, #ff1744, #b71c1c)';
        el.style.borderRadius = '50%';
        el.style.position = 'absolute';
        el.style.transform = 'translate(-50%, -50%) rotateX(-20deg)';
        el.style.zIndex = Math.floor(y + 50);
        
        cherriesContainer.appendChild(el);
    }
}

function createCandles() {
    const radius = 38; 
    
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
        wrapper.style.zIndex = Math.floor(y + 100);
        
        wrapper.innerHTML = `
            <div class="candle-stick" style="height: ${height}px; background: linear-gradient(90deg, rgba(255,255,255,0.8), ${color}, rgba(0,0,0,0.1));"></div>
            <div class="wick"></div>
            <div class="flame-3d" id="flame-${i}">
                <div class="flame-plane" style="--ry: 0deg;"></div>
                <div class="flame-plane" style="--ry: 90deg;"></div>
            </div>
        `;
        
        // Manual click fallback
        wrapper.addEventListener('click', () => {
            if(candles[i].isLit) {
                doExtinguish(candles[i]);
                checkWin();
            }
        });

        candlesContainer.appendChild(wrapper);
        candles.push({
            id: i,
            el: wrapper,
            flameEl: wrapper.querySelector('.flame-3d'),
            isLit: true
        });
    }
}

/* --- LOGIC --- */
async function startApp() {
    startOverlay.style.opacity = '0';
    setTimeout(() => startOverlay.style.display = 'none', 1000);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        microphone = audioCtx.createMediaStreamSource(stream);
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; 
        
        microphone.connect(filter);
        filter.connect(analyser);
        analyser.fftSize = 256;

        setTimeout(() => {
            room.style.opacity = '1';
            isListening = true;
            micIconEl.classList.add('text-green-400');
            micIconEl.classList.remove('text-gray-400');
            detectBlow();
        }, 800);

    } catch (err) {
        console.warn(err);
        setTimeout(() => {
            room.style.opacity = '1';
            alert("Mic access denied or error. Tap the candles to blow them out!");
        }, 1000);
    }
}

function detectBlow() {
    if (!isListening) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    const binCount = Math.floor(dataArray.length / 2); 
    for (let i = 0; i < binCount; i++) sum += dataArray[i];
    const average = sum / binCount;
    
    micLevelEl.style.width = Math.min(average * 4, 100) + '%';
    
    if (average > BLOW_THRESHOLD) extinguishCandles();
    animationFrameId = requestAnimationFrame(detectBlow);
}

function extinguishCandles() {
    const litCandles = candles.filter(c => c.isLit);
    if (litCandles.length === 0) return;
    
    litCandles.forEach(c => {
         c.flameEl.style.transform = `translateX(-50%) scale(${1 + Math.random() * 0.4}) skewX(${Math.random()*10 - 5}deg)`;
    });

    const amount = Math.min(litCandles.length, Math.floor(Math.random() * 2) + 1);
    for (let i = 0; i < amount; i++) {
        const idx = Math.floor(Math.random() * litCandles.length);
        const candle = litCandles[idx];
        doExtinguish(candle);
        litCandles.splice(idx, 1);
    }
    checkWin();
}

function doExtinguish(candle) {
    candle.isLit = false;
    candle.flameEl.classList.add('out');
    candle.el.classList.add('extinguished');
    playPuffSound();
    createSmoke(candle.el);
    candlesExtinguished++;
}

function createSmoke(parent) {
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    parent.appendChild(smoke);
    setTimeout(() => smoke.remove(), 2500);
}

function checkWin() {
    if (candlesExtinguished >= TOTAL_CANDLES && !winTriggered) {
        winTriggered = true;
        winSequence();
    }
}

/* --- AUDIO & CELEBRATION --- */

function playPuffSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createBufferSource();
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
    osc.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
}

function playPartyHorn() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(300, t);
    osc1.frequency.linearRampToValueAtTime(500, t + 0.1);
    
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(305, t);
    osc2.frequency.linearRampToValueAtTime(510, t + 0.1);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.8);
    osc2.stop(t + 0.8);
}

function playHappyBirthdaySong() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime + 0.5;
    
    // Upbeat Melody
    const song = [
        {f: 392.00, d: 0.25}, {f: 392.00, d: 0.25}, {f: 440.00, d: 0.5}, {f: 392.00, d: 0.5}, {f: 523.25, d: 0.5}, {f: 493.88, d: 1.0},
        {f: 392.00, d: 0.25}, {f: 392.00, d: 0.25}, {f: 440.00, d: 0.5}, {f: 392.00, d: 0.5}, {f: 587.33, d: 0.5}, {f: 523.25, d: 1.0},
        {f: 392.00, d: 0.25}, {f: 392.00, d: 0.25}, {f: 783.99, d: 0.5}, {f: 659.25, d: 0.5}, {f: 523.25, d: 0.5}, {f: 493.88, d: 0.5}, {f: 440.00, d: 0.5}
    ];

    let cursor = t;
    song.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = note.f;
        osc.type = 'sawtooth'; // Bright, happy sound
        
        gain.gain.setValueAtTime(0, cursor);
        gain.gain.linearRampToValueAtTime(0.1, cursor + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, cursor + note.d * 0.9);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(cursor);
        osc.stop(cursor + note.d);
        cursor += note.d;
    });
}

function winSequence() {
    isListening = false;
    cancelAnimationFrame(animationFrameId);
    micLevelEl.style.width = '0%';
    
    headerText.innerHTML = "I Love You My Babyyy! ❤️";
    headerText.classList.add('scale-110', 'text-[#ffc107]', 'transition-transform');
    
    playPartyHorn();
    playHappyBirthdaySong();
    
    // Confetti
    const end = Date.now() + 5000;
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ffeb3b', '#f48fb1'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ffeb3b', '#f48fb1'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());

    // Show Card Button after delay
    setTimeout(() => {
        openCardBtn.classList.remove('hidden');
        replayBtn.classList.remove('hidden');
    }, 2000);
}

/* --- CARD MODAL LOGIC --- */
function showCard() {
    cardModal.classList.remove('hidden');
    // Force reflow for opacity transition
    void cardModal.offsetWidth; 
    cardModal.classList.remove('opacity-0');
}

function hideCard() {
    cardModal.classList.add('opacity-0');
    setTimeout(() => {
        cardModal.classList.add('hidden');
        // Reset card flip
        bookElement.classList.remove('open');
    }, 500);
}

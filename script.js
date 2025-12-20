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
    createDecorations();
    startBtn.addEventListener('click', startApp);
}

function createDecorations() {
    const balloonContainer = document.getElementById('balloon-container');
    const colors = ['#f48fb1', '#ce93d8', '#fff59d', '#80cbc4'];
    for(let i=0; i<10; i++) {
        const b = document.createElement('div');
        b.className = 'balloon';
        b.style.left = (Math.random() * 95) + '%';
        b.style.bottom = '-100px';
        b.style.width = '50px'; b.style.height = '65px';
        b.style.background = `radial-gradient(circle at 30% 30%, #fff, ${colors[i%4]})`;
        b.style.borderRadius = '50% 50% 50% 50% / 40% 40% 60% 60%';
        b.style.opacity = '0.6';
        b.style.animation = `float-up ${15 + Math.random() * 10}s linear infinite`;
        b.style.animationDelay = `${Math.random() * 10}s`;
        balloonContainer.appendChild(b);
    }
}

function createParticles() {
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.style.position = 'absolute';
        p.style.fontSize = (Math.random() * 20 + 10) + 'px';
        p.style.color = '#f8bbd0';
        p.innerText = Math.random() > 0.5 ? '♥' : '✨';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = '100%';
        p.style.animation = `float-up ${8 + Math.random() * 10}s linear infinite`;
        p.style.animationDelay = (Math.random() * 5) + 's';
        particlesContainer.appendChild(p);
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
        const height = 35 + Math.random() * 10;
        
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
        
        wrapper.addEventListener('click', () => {
            if(candles[i].isLit) manualExtinguish(i);
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

    // Open Curtains
    curtainLeft.classList.add('curtain-open-left');
    curtainRight.classList.add('curtain-open-right');

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
            appStage.style.opacity = '1';
            isListening = true;
            micIconEl.classList.add('text-green-400');
            micIconEl.classList.remove('text-gray-400');
            detectBlow();
        }, 1200);

    } catch (err) {
        setTimeout(() => {
            appStage.style.opacity = '1';
            alert("Please allow microphone access or tap candles to blow them out!");
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

function manualExtinguish(index) {
    if(!candles[index].isLit) return;
    doExtinguish(candles[index]);
    checkWin();
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
    if (candlesExtinguished >= TOTAL_CANDLES) winSequence();
}

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

function winSequence() {
    isListening = false;
    cancelAnimationFrame(animationFrameId);
    micLevelEl.style.width = '0%';
    headerText.innerHTML = "I Love You My Babyyy! ❤️";
    headerText.classList.add('scale-110', 'text-[#ffc107]', 'transition-transform');
    playHappyBirthdaySong();
    
    const end = Date.now() + 5000;
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ffeb3b', '#f48fb1'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ffeb3b', '#f48fb1'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
    setTimeout(() => replayContainer.classList.remove('hidden'), 4000);
}

function playHappyBirthdaySong() {
    if (!audioCtx) return;
    const t = audioCtx.currentTime + 0.5;
    const song = [
        {f: 392.00, d: 0.3, s: 0}, {f: 392.00, d: 0.3, s: 0.4}, {f: 440.00, d: 0.6, s: 0.8},
        {f: 392.00, d: 0.6, s: 1.6}, {f: 523.25, d: 0.6, s: 2.4}, {f: 493.88, d: 1.0, s: 3.2},
        {f: 392.00, d: 0.3, s: 4.5}, {f: 392.00, d: 0.3, s: 4.9}, {f: 440.00, d: 0.6, s: 5.3},
        {f: 392.00, d: 0.6, s: 6.1}, {f: 587.33, d: 0.6, s: 6.9}, {f: 523.25, d: 1.0, s: 7.7},
        {f: 392.00, d: 0.3, s: 9.0}, {f: 392.00, d: 0.3, s: 9.4}, {f: 783.99, d: 0.6, s: 9.8},
        {f: 659.25, d: 0.6, s: 10.6}, {f: 523.25, d: 0.6, s: 11.4}, {f: 493.88, d: 0.6, s: 12.2},
        {f: 440.00, d: 1.0, s: 13.0}, {f: 698.46, d: 0.3, s: 14.3}, {f: 698.46, d: 0.3, s: 14.7},
        {f: 659.25, d: 0.6, s: 15.1}, {f: 523.25, d: 0.6, s: 15.9}, {f: 587.33, d: 0.6, s: 16.7},
        {f: 523.25, d: 1.5, s: 17.5}
    ];
    song.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = note.f;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0, t + note.s);
        gain.gain.linearRampToValueAtTime(0.2, t + note.s + 0.05);
        gain.gain.setValueAtTime(0.2, t + note.s + note.d - 0.05);
        gain.gain.linearRampToValueAtTime(0, t + note.s + note.d);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t + note.s);
        osc.stop(t + note.s + note.d + 0.1);
    });
}

/* --- CONFIG --- */
const TOTAL_CANDLES = 17; 
const BLOW_THRESHOLD = 35; // Lower = easier to blow
const BLOW_MAX = 80;       // Max intensity for bending flames

let audioCtx, analyser, microphone, dataArray;
let isListening = false;
let candlesExtinguished = 0;
let candleElements = [];
let sparklesInterval;

/* --- DOM --- */
const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('start-overlay');
const app = document.getElementById('app');
const micMeter = document.getElementById('mic-meter');
const micLevelEl = document.getElementById('mic-level');
const candlesLayer = document.getElementById('candles-layer');
const sparklesLayer = document.getElementById('sparkles-container');
const headerText = document.getElementById('header-text');
const replayContainer = document.getElementById('replay-container');
const balloonsContainer = document.getElementById('balloons-container');
const heartsContainer = document.getElementById('hearts-container');

/* --- INIT --- */
init();

function init() {
    createHeartsBg();
    placeCandles();
    startSparkles(); // Magic effect immediately
    startBtn.addEventListener('click', startGame);
}

function createHeartsBg() {
    for(let i=0; i<40; i++) {
        const h = document.createElement('div');
        h.className = 'heart-float';
        h.innerHTML = Math.random() > 0.5 ? '❤' : '♥';
        h.style.left = Math.random() * 100 + '%';
        h.style.animationDelay = Math.random() * 5 + 's';
        h.style.fontSize = (Math.random() * 20 + 10) + 'px';
        heartsContainer.appendChild(h);
    }
}

function startSparkles() {
    sparklesInterval = setInterval(() => {
        const s = document.createElement('div');
        s.className = 'sparkle';
        // Random position over the cake area
        s.style.left = (20 + Math.random() * 60) + '%';
        s.style.top = (20 + Math.random() * 60) + '%';
        sparklesLayer.appendChild(s);
        setTimeout(() => s.remove(), 2000);
    }, 300);
}

function placeCandles() {
    // Elliptical placement to match the 3D perspective of the cake top
    const centerX = 50; 
    const centerY = 35;
    const rx = 22; // Radius X
    const ry = 14; // Radius Y (compressed)
    
    for(let i=0; i<TOTAL_CANDLES; i++) {
        const angle = (i / TOTAL_CANDLES) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * rx;
        const y = centerY + Math.sin(angle) * ry;

        const container = document.createElement('div');
        container.className = 'candle-container';
        container.style.left = x + '%';
        container.style.top = y + '%';
        container.style.zIndex = Math.floor(y); // Depth sorting

        const flame = document.createElement('div');
        flame.className = 'flame';
        
        const wick = document.createElement('div');
        wick.className = 'wick';
        
        const wax = document.createElement('div');
        wax.className = 'wax';
        wax.style.setProperty('--candle-color', ['#ff80ab', '#80d8ff', '#ffff8d'][i%3]);

        container.appendChild(wax);
        container.appendChild(wick);
        container.appendChild(flame);
        candlesLayer.appendChild(container);

        candleElements.push({ el: container, flame: flame, active: true, x: x });
    }
}

/* --- GAME START --- */
async function startGame() {
    startOverlay.style.opacity = '0';
    setTimeout(() => startOverlay.remove(), 1000);

    // Curtain Reveal
    document.body.classList.add('curtains-open');

    // Audio Setup
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        microphone = audioCtx.createMediaStreamSource(stream);
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Isolate blow noise
        
        microphone.connect(filter);
        filter.connect(analyser);
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Show UI after curtains
        setTimeout(() => {
            app.style.opacity = '1';
            micMeter.style.opacity = '1';
            headerText.style.opacity = '1';
            headerText.style.transform = 'translateY(0)';
            isListening = true;
            loop();
        }, 3000); // 3s curtain wait
    } catch(e) {
        alert("Please allow the microphone to blow out the candles!");
    }
}

/* --- MAIN LOOP --- */
function loop() {
    if(!isListening) return;
    requestAnimationFrame(loop);

    analyser.getByteFrequencyData(dataArray);
    
    // Compute volume
    let sum = 0;
    const bins = dataArray.length;
    for(let i=0; i<bins; i++) sum += dataArray[i];
    const avg = sum / bins;
    
    // UI Meter
    micLevelEl.style.width = Math.min(100, (avg / 60) * 100) + '%';

    // Physics
    const intensity = Math.min(1, (avg - BLOW_THRESHOLD) / (BLOW_MAX - BLOW_THRESHOLD));
    
    candleElements.forEach(c => {
        if(!c.active) return;
        
        if (avg > BLOW_THRESHOLD) {
            // Shake/Bend Flames based on position relative to center (blowing effect)
            const dir = (c.x > 50) ? 1 : -1;
            const bend = 10 + (intensity * 40);
            
            // Apply complex transform for windy look
            c.flame.style.animation = 'none'; // Stop idle wave
            c.flame.style.transform = `translateX(-50%) rotate(${dir * bend}deg) skewX(${dir * bend}deg) scale(${1 - intensity * 0.3})`;
            c.flame.style.opacity = 1 - (intensity * 0.5);

            // Extinguish Check
            // The harder you blow, higher chance to kill flame
            if (avg > 50 && Math.random() < 0.03 + (intensity * 0.1)) {
                extinguish(c);
            }
        } else {
            // Restore idle
            c.flame.style.animation = 'waveFlame 2s ease-in-out infinite';
            c.flame.style.opacity = '0.9';
        }
    });

    // Check Win
    if(candlesExtinguished >= TOTAL_CANDLES && isListening) {
        win();
    }
}

function extinguish(candle) {
    if(!candle.active) return;
    candle.active = false;
    candle.flame.classList.add('out');
    candlesExtinguished++;
    
    // Smoke
    const smoke = document.createElement('div');
    smoke.className = 'smoke-puff';
    // Random offset
    const dx = (Math.random() - 0.5) * 20;
    smoke.style.transform = `translate(${dx}px, 0)`;
    candle.el.appendChild(smoke);
    
    // Sound
    playPuff();
}

function playPuff() {
    // Simple white noise burst
    const osc = audioCtx.createBufferSource();
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0; i<d.length; i++) d[i] = Math.random() * 2 - 1;
    osc.buffer = buf;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
}

/* --- WINNING --- */
function win() {
    isListening = false;
    
    // 1. Text Change
    headerText.style.opacity = 0;
    setTimeout(() => {
        headerText.innerHTML = "Happy Birthday<br>My Babyyy! ❤️";
        headerText.style.color = "#ff4081";
        headerText.style.opacity = 1;
    }, 500);

    // 2. Balloons
    balloonsContainer.classList.remove('hidden');
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#ffeb3b', '#03a9f4'];
    for(let i=0; i<30; i++) {
        const b = document.createElement('div');
        b.className = 'balloon';
        b.style.left = Math.random() * 100 + '%';
        b.style.background = colors[Math.floor(Math.random()*colors.length)];
        b.style.color = b.style.background; // For the knot color
        b.style.animationDelay = Math.random() * 2 + 's';
        b.style.animationDuration = (4 + Math.random() * 4) + 's';
        balloonsContainer.appendChild(b);
    }

    // 3. Fireworks / Confetti
    const duration = 5000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#ffeb3b', '#ff4081', '#ffffff']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#ffeb3b', '#ff4081', '#ffffff']
        });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());

    // 4. Music
    playWinMusic();
    
    // 5. Replay Button
    setTimeout(() => {
        replayContainer.classList.remove('hidden');
        replayContainer.style.opacity = '1';
    }, 2000);
}

function playWinMusic() {
    // Simple chime melody
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25];
    notes.forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(0, audioCtx.currentTime + i*0.2);
        g.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + i*0.2 + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i*0.2 + 0.8);
        o.connect(g);
        g.connect(audioCtx.destination);
        o.start(audioCtx.currentTime + i*0.2);
        o.stop(audioCtx.currentTime + i*0.2 + 1);
    });
}

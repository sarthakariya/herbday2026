/* 
 * MAIN SCRIPT - VANILLA JS 
 * No React, No Build Tools. Works everywhere.
 */

const CONFIG = {
    candleCount: 17,
    micThreshold: 20,
    blowCooldown: 100
};

const state = {
    isListening: false,
    audioCtx: null,
    analyser: null,
    candlesExtinguished: 0,
    candles: []
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    generateCandles();
    
    // Start Button
    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio();
        startExperience();
    });

    // Card Interaction
    document.getElementById('card-wrapper').addEventListener('click', function() {
        this.classList.toggle('open');
    });
});

// --- SCENE SETUP ---
function generateCandles() {
    const holder = document.getElementById('candles-holder');
    const radius = 60; // Radius on top tier

    for(let i=0; i<CONFIG.candleCount; i++) {
        const angle = (i / CONFIG.candleCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        const el = document.createElement('div');
        el.className = 'candle';
        // Adjust transform to sit on the top tier surface
        // The container is tilted, so we just translate x/z (which maps to visual circle)
        // Note: The z-index trickery in CSS 3D is hard, so we just place them.
        el.style.transform = `translateX(${x}px) translateZ(${z}px) translateY(-40px)`;
        
        // Colors
        const hue = (i * 40) % 360;
        el.style.background = `linear-gradient(to right, #fff, hsl(${hue}, 70%, 80%), #eee)`;

        const wick = document.createElement('div');
        wick.className = 'wick';
        
        const flame = document.createElement('div');
        flame.className = 'flame';
        flame.id = `flame-${i}`;

        el.appendChild(wick);
        el.appendChild(flame);
        holder.appendChild(el);

        state.candles.push({ id: i, active: true, el: flame });
    }
}

function startExperience() {
    // Hide Start Screen
    const startScreen = document.getElementById('start-screen');
    startScreen.style.opacity = '0';
    setTimeout(() => startScreen.style.display = 'none', 1000);

    // Show HUD
    document.getElementById('hud').classList.remove('hidden');

    // Open Curtains after delay
    setTimeout(() => {
        document.body.classList.add('curtains-open');
        playMusic();
    }, 500);

    // Start Loop
    loop();
}

// --- AUDIO ENGINE ---
async function initAudio() {
    try {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (state.audioCtx.state === 'suspended') await state.audioCtx.resume();

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = state.audioCtx.createMediaStreamSource(stream);
        state.analyser = state.audioCtx.createAnalyser();
        state.analyser.fftSize = 256;
        
        // Low pass filter for "blowing" sound
        const filter = state.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        source.connect(filter);
        filter.connect(state.analyser);
        
        state.isListening = true;
    } catch (e) {
        console.error("Mic Error", e);
        alert("Please allow microphone access to blow out candles! 🎂");
    }
}

function playMusic() {
    if(!state.audioCtx) return;
    // Simple synthesized intro tune
    const now = state.audioCtx.currentTime;
    [261.6, 261.6, 293.6, 261.6, 349.2, 329.6].forEach((freq, i) => {
        const osc = state.audioCtx.createOscillator();
        const g = state.audioCtx.createGain();
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.05, now + i*0.4);
        g.gain.exponentialRampToValueAtTime(0.001, now + i*0.4 + 0.3);
        osc.connect(g);
        g.connect(state.audioCtx.destination);
        osc.start(now + i*0.4);
        osc.stop(now + i*0.4 + 0.4);
    });
}

// --- LOGIC LOOP ---
function loop() {
    if(!state.isListening) {
        requestAnimationFrame(loop);
        return;
    }

    const data = new Uint8Array(state.analyser.frequencyBinCount);
    state.analyser.getByteFrequencyData(data);
    
    // Average volume
    let sum = 0;
    for(let i=0; i<data.length; i++) sum += data[i];
    const avg = sum / data.length;

    // Update HUD
    const level = Math.min(avg * 3, 100);
    document.getElementById('mic-level').style.width = level + '%';

    // Blow Detection
    if(avg > CONFIG.micThreshold) {
        blowCandles();
    }

    requestAnimationFrame(loop);
}

function blowCandles() {
    const active = state.candles.filter(c => c.active);
    if(active.length === 0) return;

    // Blow 1 at a time for realism
    const idx = Math.floor(Math.random() * active.length);
    const target = active[idx];
    
    target.active = false;
    target.el.classList.add('out');
    state.candlesExtinguished++;
    
    // Sound fx
    playPuff();

    if(state.candlesExtinguished >= CONFIG.candleCount) {
        triggerWin();
    }
}

function playPuff() {
    if(!state.audioCtx) return;
    const t = state.audioCtx.currentTime;
    const osc = state.audioCtx.createBufferSource();
    const b = state.audioCtx.createBuffer(1, state.audioCtx.sampleRate * 0.1, state.audioCtx.sampleRate);
    const d = b.getChannelData(0);
    for(let i=0; i<b.length; i++) d[i] = Math.random() * 2 - 1;
    osc.buffer = b;
    const g = state.audioCtx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.01, t+0.1);
    osc.connect(g);
    g.connect(state.audioCtx.destination);
    osc.start();
}

function triggerWin() {
    state.isListening = false;
    document.getElementById('main-title').innerText = "Happy Birthday!";
    
    // Sound
    playClapping();

    // Confetti
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());

    // Show Card after 2s
    setTimeout(() => {
        document.getElementById('card-modal').classList.remove('hidden');
    }, 2000);
}

function playClapping() {
    // Simple noise burst loop
    if(!state.audioCtx) return;
    for(let i=0; i<20; i++) {
        setTimeout(playPuff, i * 100);
    }
}

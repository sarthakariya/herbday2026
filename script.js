/* MAIN SCRIPT */

const CONFIG = {
    candleCount: 17,
    micThreshold: 15,
};

const state = {
    listening: false,
    audioCtx: null,
    analyser: null,
    extinguished: 0,
    candles: []
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Generate Candles on the Top Tier Oval
    const holder = document.getElementById('candles-container');
    const rx = 60; 
    const ry = 20;

    for(let i=0; i<CONFIG.candleCount; i++) {
        const angle = (i / CONFIG.candleCount) * Math.PI * 2;
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;

        const el = document.createElement('div');
        el.className = 'candle';
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.zIndex = Math.floor(y + 100);

        // Random color
        const hue = (i * 40) % 360;
        el.style.background = `linear-gradient(to right, #fff, hsl(${hue}, 70%, 80%), #eee)`;

        const wick = document.createElement('div');
        wick.className = 'wick';
        const flame = document.createElement('div');
        flame.className = 'flame';
        
        el.appendChild(wick);
        el.appendChild(flame);
        holder.appendChild(el);

        state.candles.push({ el: flame, active: true });
    }

    // 2. Start Interaction
    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio();
        
        // Hide Start text
        document.getElementById('start-screen').style.opacity = 0;
        setTimeout(() => document.getElementById('start-screen').remove(), 1000);

        // Open Curtains
        document.body.classList.add('open');
        
        // Show HUD
        document.getElementById('hud').classList.remove('hidden');
        
        // Play Music
        setTimeout(playBirthdayTune, 500);

        // Start Mic
        loop();
    });

    const card = document.getElementById('card-wrapper');
    card.addEventListener('click', () => card.classList.toggle('open'));
});

// --- AUDIO SYSTEM ---
async function initAudio() {
    try {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(state.audioCtx.state === 'suspended') await state.audioCtx.resume();
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = state.audioCtx.createMediaStreamSource(stream);
        state.analyser = state.audioCtx.createAnalyser();
        state.analyser.fftSize = 256;
        
        // Filter for "blowing" (low freq noise)
        const filter = state.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        
        source.connect(filter);
        filter.connect(state.analyser);
        state.listening = true;
    } catch(e) {
        console.log("Mic Error: ", e);
        alert("Microphone needed to blow out candles! 🎂");
    }
}

function playBirthdayTune() {
    if(!state.audioCtx) return;
    const now = state.audioCtx.currentTime;
    // "Happy Birthday" Notes (approx freq)
    // C4, C4, D4, C4, F4, E4
    const notes = [261.6, 261.6, 293.6, 261.6, 349.2, 329.6];
    const timings = [0, 0.4, 0.8, 1.6, 2.4, 3.2];

    notes.forEach((freq, i) => {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.1, now + timings[i]);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timings[i] + 0.6);
        
        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        
        osc.start(now + timings[i]);
        osc.stop(now + timings[i] + 0.7);
    });
}

function playPuffSound() {
    if(!state.audioCtx) return;
    const t = state.audioCtx.currentTime;
    const bufferSize = state.audioCtx.sampleRate * 0.1; // 0.1 sec
    const buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // White noise
    }

    const noise = state.audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = state.audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    noise.connect(gain);
    gain.connect(state.audioCtx.destination);
    noise.start();
}

function playApplause() {
    if(!state.audioCtx) return;
    // Simulate clapping by playing multiple random puffs rapidly
    for(let i=0; i<30; i++) {
        setTimeout(playPuffSound, Math.random() * 2000);
    }
}

// --- LOGIC ---
function loop() {
    if(state.listening && state.analyser) {
        const data = new Uint8Array(state.analyser.frequencyBinCount);
        state.analyser.getByteFrequencyData(data);
        
        let sum = 0;
        for(let i=0; i<data.length; i++) sum += data[i];
        const avg = sum / data.length;

        // Visual Meter
        const pct = Math.min(avg * 4, 100);
        document.getElementById('mic-level').style.width = pct + "%";

        if(avg > CONFIG.micThreshold) {
            blowOutCandle();
        }
    }
    requestAnimationFrame(loop);
}

function blowOutCandle() {
    const active = state.candles.filter(c => c.active);
    if(active.length === 0) return;

    // Pick random candle to extinguish
    const idx = Math.floor(Math.random() * active.length);
    const target = active[idx];
    
    target.active = false;
    target.el.classList.add('out');
    playPuffSound();
    state.extinguished++;
    
    if(state.extinguished === CONFIG.candleCount) {
        win();
    }
}

function win() {
    state.listening = false;
    playApplause();
    
    // Confetti
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    
    setTimeout(() => {
        document.getElementById('card-modal').classList.remove('hidden');
    }, 1500);
}

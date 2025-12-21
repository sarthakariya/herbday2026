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
    // Top tier is width 180px, height 60px (in CSS).
    // So visual radii are: rx = 70 (padding), ry = 20 (padding)
    const holder = document.getElementById('candles-container');
    const rx = 60; 
    const ry = 20;

    for(let i=0; i<CONFIG.candleCount; i++) {
        const angle = (i / CONFIG.candleCount) * Math.PI * 2;
        // Basic Ellipse math
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;

        const el = document.createElement('div');
        el.className = 'candle';
        // Position relative to center. 
        // Note: Y in CSS is down, but for 2.5D stacking, "back" is negative Y visually on the oval.
        // We use standard left/top positioning or transform.
        el.style.transform = `translate(${x}px, ${y}px)`;
        // Z-index sorting: candles in "front" (higher y) should be on top of candles in "back"
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

    // 2. Event Listeners
    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio();
        document.getElementById('start-screen').style.opacity = 0;
        setTimeout(() => document.getElementById('start-screen').remove(), 1000);
        document.getElementById('hud').classList.remove('hidden');
        loop();
    });

    const card = document.getElementById('card-wrapper');
    card.addEventListener('click', () => card.classList.toggle('open'));
});

// --- AUDIO ---
async function initAudio() {
    try {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        await state.audioCtx.resume();
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
        alert("Microphone needed to blow out candles!");
    }
}

function loop() {
    if(state.listening && state.analyser) {
        const data = new Uint8Array(state.analyser.frequencyBinCount);
        state.analyser.getByteFrequencyData(data);
        
        // Calculate average volume
        let sum = 0;
        for(let i=0; i<data.length; i++) sum += data[i];
        const avg = sum / data.length;

        // Visual Meter
        const pct = Math.min(avg * 4, 100);
        document.getElementById('mic-level').style.width = pct + "%";

        // Threshold check
        if(avg > CONFIG.micThreshold) {
            blowOutCandle();
        }
    }
    requestAnimationFrame(loop);
}

function blowOutCandle() {
    // Find active candles
    const active = state.candles.filter(c => c.active);
    if(active.length === 0) return;

    // Pick random one
    const idx = Math.floor(Math.random() * active.length);
    const target = active[idx];
    
    target.active = false;
    target.el.classList.add('out');
    state.extinguished++;
    
    // Check Win
    if(state.extinguished === CONFIG.candleCount) {
        win();
    }
}

function win() {
    state.listening = false;
    document.querySelector('.wall-banner').innerText = "Hooray!";
    
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    
    setTimeout(() => {
        document.getElementById('card-modal').classList.remove('hidden');
    }, 1500);
}

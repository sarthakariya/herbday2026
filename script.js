// --- Config ---
const CONFIG = {
    candleCount: 17,
    // Threshold (0-100). Higher = less sensitive.
    // We also use a smoothing history buffer, so this can be moderately high.
    blowThreshold: 55, 
    colors: ['#ef9a9a', '#90caf9', '#a5d6a7', '#fff59d', '#ce93d8']
};

// --- Sound Manager (Web Audio API - No assets needed) ---
class SoundFX {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playBlow() {
        if(this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createBufferSource();
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        // White noise
        for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        osc.buffer = buffer;
        
        // Lowpass filter for "air" sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
    }

    playJingle() {
        if(this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        // Simple major arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, t + i*0.15);
            gain.gain.linearRampToValueAtTime(0.2, t + i*0.15 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + i*0.15 + 0.8);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + i*0.15);
            osc.stop(t + i*0.15 + 1);
        });
    }
}

// --- State ---
let state = {
    listening: false,
    extinguished: 0,
    won: false,
    audioCtx: null,
    analyser: null,
    mic: null,
    sound: null,
    volumeHistory: new Array(10).fill(0) // Rolling buffer for smoothing
};

// --- Elements ---
const els = {
    candleCont: document.getElementById('candle-container'),
    sparkleCont: document.getElementById('sparkle-container'),
    micBar: document.getElementById('mic-level-bar'),
    micInd: document.getElementById('mic-indicator'),
    hint: document.getElementById('unlock-audio-layer'),
    win: document.getElementById('win-message'),
    canvas: document.getElementById('confetti-canvas'),
    ctx: document.getElementById('confetti-canvas').getContext('2d'),
    bunting: document.getElementById('bunting-container')
};

// --- Init ---
function init() {
    setupBunting();
    setupCandles();
    startSparkles();
    
    // Unlock Audio Context on interaction
    document.body.addEventListener('click', startAudio, { once: true });
    document.body.addEventListener('touchstart', startAudio, { once: true });
}

function setupBunting() {
    const colors = ['#e53935', '#1e88e5', '#fdd835', '#43a047'];
    for(let i=0; i<15; i++) {
        const flag = document.createElement('div');
        flag.style.cssText = `
            position: absolute; top: 0; left: ${i * 7}%;
            width: 0; height: 0;
            border-left: 20px solid transparent;
            border-right: 20px solid transparent;
            border-top: 40px solid ${colors[i%4]};
            transform-origin: top;
            animation: swing 3s infinite ease-in-out ${i*0.1}s;
            opacity: 0.8;
        `;
        const style = document.createElement('style');
        style.textContent = `@keyframes swing {0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)}}`;
        document.head.appendChild(style);
        els.bunting.appendChild(flag);
    }
}

function setupCandles() {
    const { candleCount } = CONFIG;
    const w = 380; // Container width
    const h = 80;  // Container height (oval depth)
    
    // Distribute in two rings for depth
    const rings = [
        { count: 12, rx: w/2 - 20, ry: h/2 - 10 },
        { count: 5,  rx: w/4,      ry: h/4 }
    ];

    let cIndex = 0;
    rings.forEach(ring => {
        for(let i=0; i<ring.count; i++) {
            if(cIndex >= candleCount) break;
            
            const angle = (i / ring.count) * Math.PI * 2;
            // Ellipse parametric eq: x = a cos(t), y = b sin(t)
            // Center is (w/2, h/2)
            const left = (w/2) + Math.cos(angle) * ring.rx;
            const top = (h/2) + Math.sin(angle) * ring.ry;
            
            // Z-Index based on Y (closer items cover back items)
            // Important: Candles at the "bottom" of the oval (higher Y value) are closer to viewer
            const z = Math.floor(top);

            const c = document.createElement('div');
            c.className = 'candle';
            c.style.left = left + 'px';
            c.style.top = top + 'px'; // Base position
            c.style.zIndex = z;
            c.style.setProperty('--c-color', CONFIG.colors[cIndex % 5]);
            
            // Shift up so the 'top' coordinate is the base of the candle
            c.style.transform = "translate(-50%, -100%)"; 

            const flame = document.createElement('div');
            flame.className = 'flame';
            c.appendChild(flame);
            els.candleCont.appendChild(c);
            cIndex++;
        }
    });
}

function startSparkles() {
    setInterval(() => {
        if(state.won) return;
        const s = document.createElement('div');
        s.className = 'sparkle';
        // Random pos within cake container
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 100 + '%';
        els.sparkleCont.appendChild(s);
        setTimeout(() => s.remove(), 1500);
    }, 300);
}

// --- Audio ---
async function startAudio() {
    if(state.listening) return;
    
    // Init Sound FX
    state.sound = new SoundFX();
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        state.analyser = state.audioCtx.createAnalyser();
        state.mic = state.audioCtx.createMediaStreamSource(stream);
        
        // Filter: Low pass to detect breath (blowing is low freq noise)
        // High frequencies (claps, squeaks) are ignored
        const filter = state.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        state.mic.connect(filter);
        filter.connect(state.analyser);
        
        state.analyser.fftSize = 256;
        state.listening = true;
        
        els.hint.style.display = 'none';
        els.micInd.classList.remove('hidden');
        
        loop();
    } catch(e) {
        console.error(e);
        els.hint.innerHTML = '<div class="tap-hint-box" style="background:red">Microphone Blocked 😕</div>';
    }
}

function loop() {
    if(!state.listening || state.won) return;
    
    const arr = new Uint8Array(state.analyser.frequencyBinCount);
    state.analyser.getByteFrequencyData(arr);
    
    // Calculate average volume
    let sum = 0;
    for(let i=0; i<arr.length; i++) sum += arr[i];
    const instantVol = sum / arr.length;
    
    // Smoothing buffer
    state.volumeHistory.push(instantVol);
    state.volumeHistory.shift();
    const avgVol = state.volumeHistory.reduce((a,b)=>a+b) / state.volumeHistory.length;
    
    // Visual feedback
    els.micBar.style.width = Math.min(100, avgVol * 1.5) + '%';
    
    // Blow detection logic
    // 1. High enough volume
    // 2. Consistent volume (Standard deviation low? Or just buffer avg)
    // We use avgVol to ensure it's a sustained breath, not a clap.
    if(avgVol > CONFIG.blowThreshold) {
        const flames = document.querySelectorAll('.flame:not(.out)');
        if(flames.length > 0) {
            // Blow effect
            flames.forEach(f => {
                f.style.transform = `translateX(-50%) skewX(${(Math.random()-0.5)*40}deg) scale(0.9)`;
                f.style.opacity = 0.7;
            });
            
            // Random extinguish chance based on intensity
            if(Math.random() > 0.85) {
                const idx = Math.floor(Math.random() * flames.length);
                extinguish(flames[idx]);
            }
        }
    } else {
        // Reset flame tilt
        const flames = document.querySelectorAll('.flame:not(.out)');
        flames.forEach(f => {
            f.style.transform = `translateX(-50%) scale(1)`;
            f.style.opacity = 1;
        });
    }
    
    requestAnimationFrame(loop);
}

function extinguish(flame) {
    if(flame.classList.contains('out')) return;
    
    flame.classList.add('out');
    state.sound.playBlow(); // Sound Effect
    
    // Smoke
    const smoke = document.createElement('div');
    smoke.style.cssText = `
        position: absolute; top: -30px; left: 50%; width: 10px; height: 10px;
        background: rgba(255,255,255,0.5); border-radius: 50%;
        animation: puff 1s forwards;
    `;
    const style = document.createElement('style');
    style.textContent = `@keyframes puff { to { transform: translate(-50%, -50px) scale(3); opacity: 0; } }`;
    document.head.appendChild(style);
    
    flame.parentElement.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1000);
    
    state.extinguished++;
    if(state.extinguished >= CONFIG.candleCount) {
        win();
    }
}

function win() {
    state.won = true;
    state.sound.playJingle(); // Celebration Sound
    els.micInd.style.opacity = 0;
    setTimeout(() => {
        els.win.classList.remove('hidden');
        startConfetti();
    }, 500);
}

// --- Confetti ---
let particles = [];
function startConfetti() {
    els.canvas.width = window.innerWidth;
    els.canvas.height = window.innerHeight;
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    
    for(let i=0; i<300; i++) {
        particles.push({
            x: els.canvas.width/2, y: els.canvas.height/2,
            vx: (Math.random()-0.5)*20, vy: (Math.random()-1)*20,
            c: colors[Math.floor(Math.random()*colors.length)],
            size: Math.random()*8+4
        });
    }
    renderConfetti();
}
function renderConfetti() {
    els.ctx.clearRect(0,0,els.canvas.width,els.canvas.height);
    particles.forEach((p,i) => {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.5;
        els.ctx.fillStyle=p.c;
        els.ctx.fillRect(p.x,p.y,p.size,p.size);
        if(p.y>els.canvas.height) particles.splice(i,1);
    });
    if(particles.length) requestAnimationFrame(renderConfetti);
}

init();
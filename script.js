const CONFIG = { candleCount: 17, micThreshold: 15 };
const state = { listening: false, audioCtx: null, analyser: null, extinguished: 0, candles: [], fireworksActive: false };

document.getElementById('start-btn').addEventListener('click', () => {
    // 1. Play Background Music Immediately
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.volume = 0.6;
        bgMusic.play().catch(e => console.error("Music play failed:", e));
    }

    // 2. Initialize Microphone
    initAudio();

    // 3. UI Transition
    document.getElementById('start-screen').style.opacity = '0';
    setTimeout(() => document.getElementById('start-screen').remove(), 1000);
    document.body.classList.add('open');
    document.getElementById('hud').classList.remove('hidden');

    // 4. Start Background Animations
    loop();
});

async function initAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = state.audioCtx.createMediaStreamSource(stream);
        state.analyser = state.audioCtx.createAnalyser();
        state.analyser.fftSize = 256;
        source.connect(state.analyser);
        state.listening = true;
    } catch (e) {
        console.log("Mic blocked, using click-to-blow instead.");
    }
}

function loop() {
    if (state.listening && state.analyser) {
        const data = new Uint8Array(state.analyser.frequencyBinCount);
        state.analyser.getByteFrequencyData(data);
        let sum = data.reduce((a, b) => a + b, 0);
        let avg = sum / data.length;
        document.getElementById('mic-level').style.width = Math.min(avg * 3, 100) + '%';
        if (avg > CONFIG.micThreshold) blowCandle();
    }
    requestAnimationFrame(loop);
}

// Generate Candles
const candleContainer = document.getElementById('candles-container');
for (let i = 0; i < CONFIG.candleCount; i++) {
    const candle = document.createElement('div');
    candle.className = 'candle';
    const angle = (i / CONFIG.candleCount) * Math.PI * 2;
    candle.style.left = Math.cos(angle) * 60 + 'px';
    candle.style.top = Math.sin(angle) * 20 + 'px';
    const flame = document.createElement('div');
    flame.className = 'flame';
    candle.appendChild(flame);
    candleContainer.appendChild(candle);
    state.candles.push({ active: true, flame: flame, el: candle });
    
    candle.onclick = () => { if(state.candles[i].active) extinguish(state.candles[i]); };
}

function blowCandle() {
    const activeOnes = state.candles.filter(c => c.active);
    if (activeOnes.length > 0) {
        extinguish(activeOnes[Math.floor(Math.random() * activeOnes.length)]);
    }
}

function extinguish(candleObj) {
    candleObj.active = false;
    candleObj.flame.classList.add('out');
    state.extinguished++;
    if (state.extinguished >= CONFIG.candleCount) finishParty();
}

function finishParty() {
    state.listening = false;
    document.getElementById('bg-music').volume = 1.0;
    
    // Play SFX
    document.getElementById('clapping-sfx').play();
    document.getElementById('cheer-sfx').play();
    document.getElementById('fireworks-sfx').play();
    
    // Confetti
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    
    // Show Greeting & Card
    document.getElementById('big-greeting').classList.remove('hidden');
    startRealFireworks();
    
    setTimeout(() => {
        document.getElementById('card-modal').classList.remove('hidden');
    }, 4000);
}

// FIREWORKS ENGINE (Simplified & No Flashing)
let canvas = document.getElementById('fireworks-canvas');
let ctx = canvas.getContext('2d');
let particles = [];

function startRealFireworks() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderFw();
}

function renderFw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (Math.random() < 0.05) spawnRocket();
    
    particles = particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.alpha -= 0.01;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
        return p.alpha > 0;
    });
    requestAnimationFrame(renderFw);
}

function spawnRocket() {
    const x = Math.random() * canvas.width;
    const y = canvas.height;
    const color = `hsl(${Math.random()*360}, 100%, 60%)`;
    for(let i=0; i<30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        particles.push({ x: x, y: y/3, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, alpha: 1, color: color });
    }
}

document.getElementById('card-wrapper').onclick = function() {
    this.classList.toggle('open');
};

// --- Configuration for Realism ---
const CONFIG = {
    candleCount: 17,
    // Extremely high threshold: User must blow aggressively directly into mic
    blowThreshold: 90, 
    colors: ['#ef9a9a', '#90caf9', '#a5d6a7', '#fff59d', '#ce93d8']
};

// --- State ---
let state = {
    listening: false,
    extinguished: 0,
    won: false,
    audioCtx: null,
    analyser: null,
    mic: null
};

// --- Elements ---
const els = {
    decorations: document.getElementById('decorations-container'),
    micBar: document.getElementById('mic-level-bar'),
    micInd: document.getElementById('mic-indicator'),
    hint: document.getElementById('unlock-audio-layer'),
    win: document.getElementById('win-message'),
    canvas: document.getElementById('confetti-canvas'),
    ctx: document.getElementById('confetti-canvas').getContext('2d')
};

// --- Initialization ---
function init() {
    setupCandlesAndTreats();
    setupBunting();
    
    // One-time unlock listener
    document.body.addEventListener('click', startAudio, { once: true });
    document.body.addEventListener('touchstart', startAudio, { once: true });
}

function setupBunting() {
    const container = document.getElementById('bunting-container');
    const colors = ['#d32f2f', '#1976d2', '#fbc02d', '#388e3c'];
    for(let i=0; i<10; i++) {
        const flag = document.createElement('div');
        // Simple bunting style for background
        flag.style.position = 'absolute';
        flag.style.top = '10px';
        flag.style.left = (i * 10) + '%';
        flag.style.width = '0'; 
        flag.style.height = '0';
        flag.style.borderLeft = '40px solid transparent';
        flag.style.borderRight = '40px solid transparent';
        flag.style.borderTop = `60px solid ${colors[i%4]}`;
        flag.style.opacity = '0.7';
        flag.style.transformOrigin = 'top center';
        flag.style.animation = `swing 3s infinite ease-in-out ${i*0.2}s`;
        container.appendChild(flag);
    }
}

// --- 3D Placement Logic ---
function setupCandlesAndTreats() {
    const { candleCount } = CONFIG;
    const centerX = 200; // Half of cake width (400px)
    const centerY = 55;  // Half of cake top height (110px)

    // Perspective Ratio for Oval (Width vs Height visual)
    const Rx_Outer = 180; 
    const Ry_Outer = 40; 
    
    const Rx_Inner = 100;
    const Ry_Inner = 20;

    // Distribute 17 candles: 12 outer ring, 5 inner ring
    const outerCount = 12;
    const innerCount = 5;

    // Outer Ring
    for(let i=0; i<outerCount; i++) {
        placeItem(i, outerCount, Rx_Outer, Ry_Outer, centerX, centerY, true);
    }
    // Inner Ring
    for(let i=0; i<innerCount; i++) {
        placeItem(i, innerCount, Rx_Inner, Ry_Inner, centerX, centerY, true);
    }

    // Treats scattering (Between candles)
    for(let i=0; i<8; i++) {
        const angle = (i / 8) * Math.PI * 2 + 0.2; // Offset
        const x = centerX + Math.cos(angle) * (Rx_Outer - 20);
        const y = centerY + Math.sin(angle) * (Ry_Outer - 10);
        const z = Math.floor(y);
        
        const type = i % 2 === 0 ? 'truffle' : 'macaron';
        const el = document.createElement('div');
        el.className = `treat ${type}`;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.zIndex = z + 5; // Lower than candles
        if(type === 'macaron') el.style.setProperty('--m-col', CONFIG.colors[i%CONFIG.colors.length]);
        els.decorations.appendChild(el);
    }
}

function placeItem(index, total, rx, ry, cx, cy, isCandle) {
    const angle = (index / total) * Math.PI * 2;
    // Basic Oval Math
    const x = cx + Math.cos(angle) * rx;
    const y = cy + Math.sin(angle) * ry;
    
    // Z-Index Hack: Lower Y (visually higher on screen) means further back -> Lower Z-Index
    // But in DOM painting: Elements lower in DOM cover top.
    // We use z-index relative to Y position. Higher Y = Closer to viewer = Higher Z.
    const zIndex = Math.floor(y) + 20;

    if (isCandle) {
        const c = document.createElement('div');
        c.className = 'candle';
        c.style.left = (x - 4) + 'px'; // Center width
        c.style.top = (y - 55) + 'px'; // Base at y, height 60
        c.style.zIndex = zIndex;
        c.style.setProperty('--c-base', CONFIG.colors[index % CONFIG.colors.length]);
        
        // Parts
        const wick = document.createElement('div');
        wick.className = 'wick';
        const flame = document.createElement('div');
        flame.className = 'flame';
        
        c.appendChild(wick);
        c.appendChild(flame);
        els.decorations.appendChild(c);
    }
}

// --- Audio Physics ---
async function startAudio() {
    if(state.listening) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        state.analyser = state.audioCtx.createAnalyser();
        state.mic = state.audioCtx.createMediaStreamSource(stream);
        state.mic.connect(state.analyser);
        state.analyser.fftSize = 256;
        
        state.listening = true;
        els.hint.style.opacity = '0';
        setTimeout(() => els.hint.style.display = 'none', 500);
        els.micInd.classList.remove('hidden');
        
        loop();
    } catch(e) {
        els.hint.innerHTML = '<div class="tap-hint-box" style="background:red">Mic Denied 😔</div>';
    }
}

function loop() {
    if(!state.listening || state.won) return;
    
    const arr = new Uint8Array(state.analyser.frequencyBinCount);
    state.analyser.getByteFrequencyData(arr);
    
    // Focus on lower spectrum for "blowing" sound (wind noise is low freq)
    let sum = 0;
    const samples = 10;
    for(let i=0; i<samples; i++) sum += arr[i];
    const vol = sum / samples; // 0 - 255
    
    // Visual bar
    els.micBar.style.width = Math.min(100, (vol/120)*100) + '%';
    
    // Realistic Physics: Flames lean away from "wind"
    // We simulate wind direction as purely random jitter + volume intensity
    const flames = document.querySelectorAll('.flame:not(.out)');
    
    if (vol > 10) {
        flames.forEach(f => {
            const intensity = vol / 20; // Scale 0 to 10ish
            const jitter = (Math.random() - 0.5) * 20;
            // Skew X simulates wind force
            f.style.transform = `translateX(-50%) scale(${1 + Math.random()*0.2}) skewX(${jitter * intensity}deg) rotate(${jitter}deg)`;
        });
    } else {
        // Idle sway
        flames.forEach(f => f.style.transform = 'translateX(-50%)');
    }

    // Extinguish Logic
    if (vol > CONFIG.blowThreshold) {
        // Probability check prevents all going out instantly unless super hard blow
        if (Math.random() > 0.5 && flames.length > 0) {
            // Pick random flame to extinguish
            const idx = Math.floor(Math.random() * flames.length);
            extinguish(flames[idx]);
        }
    }
    
    requestAnimationFrame(loop);
}

function extinguish(flameEl) {
    if(flameEl.classList.contains('out')) return;
    flameEl.classList.add('out');
    
    // Smoke Physics
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    flameEl.parentElement.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1500); // Cleanup DOM
    
    state.extinguished++;
    if(state.extinguished >= CONFIG.candleCount) winGame();
}

function winGame() {
    state.won = true;
    state.listening = false;
    els.micInd.style.opacity = '0';
    
    setTimeout(() => {
        els.win.classList.remove('hidden');
        startConfetti();
    }, 800);
}

// --- Confetti System ---
let particles = [];
function startConfetti() {
    els.canvas.width = window.innerWidth;
    els.canvas.height = window.innerHeight;
    
    // Gold and Pink luxury confetti
    const colors = ['#ffd700', '#d81b60', '#ffffff', '#e1bee7'];
    
    for(let i=0; i<300; i++) {
        particles.push({
            x: els.canvas.width/2, 
            y: els.canvas.height/2,
            vx: (Math.random()-0.5) * 25,
            vy: (Math.random()-1) * 25,
            color: colors[Math.floor(Math.random()*colors.length)],
            size: Math.random()*8 + 4,
            drag: 0.96
        });
    }
    animateConfetti();
}

function animateConfetti() {
    els.ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
    
    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // Gravity
        p.vx *= p.drag;
        p.vy *= p.drag;
        
        els.ctx.fillStyle = p.color;
        els.ctx.beginPath();
        els.ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        els.ctx.fill();
        
        if(p.y > els.canvas.height) particles.splice(i, 1);
    });
    
    if(particles.length > 0) requestAnimationFrame(animateConfetti);
}

init();
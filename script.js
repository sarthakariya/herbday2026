/* MAIN SCRIPT - LIVELY ANIMATIONS PRESERVED */

const CONFIG = {
    candleCount: 16, 
    micThreshold: 12, 
    flickerThreshold: 8,
};

const state = {
    listening: false,
    audioCtx: null,
    analyser: null,
    extinguished: 0,
    candles: [],
    fireworksActive: false,
    won: false,
    isMobile: window.innerWidth < 768
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Generate Candles
    const holder = document.getElementById('candles-container');
    
    // Mobile: Tighter circle for smaller cake
    const rx = state.isMobile ? 30 : 55; 
    const ry = state.isMobile ? 12 : 20; 
    
    const fragment = document.createDocumentFragment();

    for(let i=0; i<CONFIG.candleCount; i++) {
        const angle = (i / CONFIG.candleCount) * Math.PI * 2;
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;

        const el = document.createElement('div');
        el.className = 'candle';
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.zIndex = Math.floor(y + 200);

        if(state.isMobile) {
            el.style.height = "25px"; el.style.width = "6px";
        }

        const hues = [340, 200, 45, 120, 280]; 
        el.style.backgroundColor = `hsl(${hues[i % hues.length]}, 70%, 85%)`;

        const wick = document.createElement('div'); wick.className = 'wick';
        const flame = document.createElement('div'); flame.className = 'flame';
        
        if(state.isMobile) {
            flame.style.width = "10px"; flame.style.height = "20px"; flame.style.top = "-18px";
        }
        
        // Use full animation even on mobile!
        flame.style.animationName = 'flameFlicker'; 

        const delay = Math.random() * 2 + 's';
        flame.style.setProperty('--delay', delay);
        flame.style.animationDelay = delay;
        
        el.addEventListener('click', () => {
            if(state.candles[i].active) {
                extinguishCandle(state.candles[i]);
            }
        });
        
        el.appendChild(wick); el.appendChild(flame);
        fragment.appendChild(el);
        state.candles.push({ el: flame, container: el, active: true });
    }
    holder.appendChild(fragment);

    // 2. Scatter Props
    // We scatter them freely, CSS will handle their sizing
    setupProps('chocolates-container', 'chocolate', 12);
    setupProps('petals-container', 'petal', 15);
    setupProps('magic-dust', 'dust-particle', 30);

    // 3. Bubbles & Confetti
    createBubbles();
    // LAG FIX: Reduce confetti frequency only, keep everything else
    setInterval(spawnFallingBit, state.isMobile ? 1500 : 300); 

    // 4. Fairy Lights
    setupFairyLights();

    // 5. Start Button
    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio(); 
        
        document.getElementById('start-screen').style.opacity = 0;
        setTimeout(() => document.getElementById('start-screen').remove(), 1000);

        document.body.classList.add('open');
        document.getElementById('hud').classList.remove('hidden');
        
        // SONG PLAYS HERE
        const bgAudio = document.getElementById('bg-music');
        if(bgAudio) {
            bgAudio.volume = 1.0; 
            bgAudio.play().catch(e => console.log("Audio play error:", e));
        }
        
        loop();
    });

    const card = document.getElementById('card-wrapper');
    if(card) {
        card.addEventListener('click', () => {
            card.classList.toggle('open');
        });
    }
    
    // Force GIF reload
    document.querySelectorAll('.gif-sticker img').forEach(img => { img.src = img.src; });
});

function setupProps(containerId, className, count) {
    const container = document.getElementById(containerId);
    if(!container) return;
    for(let i=0; i<count; i++) {
        const el = document.createElement('div');
        el.className = className;
        el.style.top = Math.random() * 100 + '%';
        el.style.left = Math.random() * 100 + '%';
        if(className === 'petal') {
             const colors = ['#e91e63', '#ec407a', '#f48fb1', '#d81b60'];
             el.style.backgroundColor = colors[Math.floor(Math.random()*colors.length)];
             el.style.transform = `rotate(${Math.random() * 360}deg)`;
        } else if (className === 'chocolate') {
             el.style.top = (20 + Math.random() * 100) + 'px';
             el.style.left = (60 + Math.random() * 30) + '%';
             const size = 10 + Math.random() * 10;
             el.style.width = size + 'px'; el.style.height = size + 'px';
             el.style.transform = `rotate(${Math.random() * 360}deg)`;
        } else {
             el.style.animationDelay = Math.random() * 5 + 's';
        }
        container.appendChild(el);
    }
}

function setupFairyLights() {
     const lightsContainer = document.getElementById('fairy-lights');
    if(lightsContainer) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%"); height="100%"; svg.style.position="absolute"; svg.style.top="0"; svg.style.left="0";
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M0,0 Q500,150 1000,0"); path.setAttribute("fill", "none"); path.setAttribute("stroke", "#a1887f"); path.setAttribute("stroke-width", "2");
        svg.appendChild(path); lightsContainer.appendChild(svg);
        for(let i=1; i<20; i++) {
            const bulb = document.createElement('div'); bulb.className = 'bulb';
            bulb.style.left = (i * (100 / 20)) + '%';
            const x = i / 20; const y = 150 * (1 - Math.pow(2*x - 1, 2));
            bulb.style.top = y + 'px';
            bulb.style.animationDelay = Math.random() + 's';
            lightsContainer.appendChild(bulb);
        }
    }
}

function createBubbles() {
    const container = document.getElementById('bubbles-container');
    if(!container) return;
    for(let i=0; i<15; i++) spawnBubble(container);
    setInterval(() => { if(!document.hidden) spawnBubble(container); }, 2000);
}

function spawnBubble(container) {
    const bubble = document.createElement('div'); bubble.className = 'bubble';
    const size = 10 + Math.random() * 40;
    bubble.style.width = size + 'px'; bubble.style.height = size + 'px';
    bubble.style.left = Math.random() * 100 + '%';
    bubble.style.animationDuration = (8 + Math.random() * 10) + 's';
    container.appendChild(bubble);
    setTimeout(() => { if(bubble.parentNode) bubble.parentNode.removeChild(bubble); }, 20000);
}

function spawnFallingBit() {
    const container = document.getElementById('continuous-confetti');
    if(!container || document.hidden) return;
    const bit = document.createElement('div'); bit.className = 'falling-bit';
    bit.style.left = Math.random() * 100 + '%';
    bit.style.animationDuration = (5 + Math.random() * 5) + 's';
    const type = Math.random();
    if(type < 0.3) { bit.style.background = '#fbc02d'; bit.style.borderRadius = '50%'; } 
    else if (type < 0.6) { bit.style.background = '#e91e63'; bit.style.width = '8px'; bit.style.height = '8px'; bit.style.transform = 'rotate(45deg)'; } 
    else { bit.style.background = '#388e3c'; bit.style.borderRadius = '0 50% 0 50%'; bit.style.height = '12px'; }
    container.appendChild(bit);
    setTimeout(() => { bit.remove(); }, 10000);
}

// --- AUDIO ---
async function initAudio() {
    try {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(state.audioCtx.state === 'suspended') await state.audioCtx.resume();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = state.audioCtx.createMediaStreamSource(stream);
        state.analyser = state.audioCtx.createAnalyser();
        state.analyser.fftSize = 512;
        state.analyser.smoothingTimeConstant = 0.5;
        const filter = state.audioCtx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 800;
        source.connect(filter); filter.connect(state.analyser);
        state.listening = true;
    } catch(e) {
        console.log("Mic access error.");
    }
}

function playAirSound() {
     if(!state.audioCtx) return;
    const bufferSize = state.audioCtx.sampleRate * 1.5; 
    const buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = state.audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = state.audioCtx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(400, state.audioCtx.currentTime);
    filter.frequency.linearRampToValueAtTime(100, state.audioCtx.currentTime + 1.5);
    const gain = state.audioCtx.createGain();
    gain.gain.setValueAtTime(0, state.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.8, state.audioCtx.currentTime + 0.1); 
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 1.5); 
    noise.connect(filter); filter.connect(gain); gain.connect(state.audioCtx.destination);
    noise.start();
}

function loop() {
    if(state.listening && state.analyser && !state.won) {
        const data = new Uint8Array(state.analyser.frequencyBinCount);
        state.analyser.getByteFrequencyData(data);
        let sum = 0; for(let i=0; i<data.length; i++) sum += data[i];
        const avg = sum / data.length;
        document.getElementById('mic-level').style.width = Math.min(avg * 4, 100) + '%';
        
        if(avg > CONFIG.flickerThreshold && avg < CONFIG.micThreshold) {
             state.candles.forEach(c => { if(c.active) c.el.classList.add('flicker-hard'); });
        } else {
             state.candles.forEach(c => { if(c.active) c.el.classList.remove('flicker-hard'); });
        }
        if(avg > CONFIG.micThreshold) { blowRandomCandle(); }
    }
    if(!state.won) requestAnimationFrame(loop);
}

function extinguishCandle(target) {
    target.active = false;
    target.el.classList.remove('flicker-hard');
    target.el.classList.add('out'); 
    target.container.classList.add('out'); 
    playAirSound(); 
    state.extinguished++;
    if(state.extinguished >= CONFIG.candleCount) {
        if(!state.won) { state.won = true; setTimeout(finishParty, 800); }
    }
}

function blowRandomCandle() {
    const active = state.candles.filter(c => c.active);
    if(active.length === 0) return;
    const amount = Math.floor(Math.random() * 2) + 1;
    for(let i=0; i<amount; i++) {
        if(state.extinguished >= CONFIG.candleCount) break;
        const activeCandidates = state.candles.filter(c => c.active);
        if(activeCandidates.length === 0) break;
        const idx = Math.floor(Math.random() * activeCandidates.length);
        extinguishCandle(activeCandidates[idx]);
    }
}

function finishParty() {
    state.listening = false;
    
    const cheer = document.getElementById('cheer-sfx');
    if(cheer) { cheer.currentTime = 0; cheer.play().catch(e=>{}); }
    const clap = document.getElementById('clapping-sfx');
    if(clap) { clap.currentTime = 0; clap.play().catch(e=>{}); }
    const pop = document.getElementById('pop-sfx');
    if(pop) { pop.currentTime = 0; pop.play().catch(e=>{}); }
    const fwSound = document.getElementById('fireworks-sfx');
    if(fwSound) { fwSound.volume = 0.6; fwSound.play().catch(e=>{}); }

    const music = document.getElementById('bg-music');
    if(music) { music.volume = 0.6; } // Lower music slightly for cheers

    if(typeof confetti !== 'undefined') {
        confetti({ particleCount: state.isMobile? 100:150, spread: 80, origin: { y: 0.6 } });
    }
    startRealFireworks();
    
    document.getElementById('big-greeting').classList.remove('hidden');

    setTimeout(() => {
        const modal = document.getElementById('card-modal');
        if(modal) {
            modal.classList.remove('hidden');
            const book = document.getElementById('card-wrapper');
            if(book) {
                book.classList.add('bounce-anim'); 
                setTimeout(() => book.classList.remove('bounce-anim'), 1000);
            }
        }
    }, 4000);
}

// --- REAL CANVAS FIREWORKS ENGINE ---
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * velocity;
        this.vy = Math.sin(angle) * velocity;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.015;
    }
    draw(ctx) {
        ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.vy += 0.05; this.alpha -= this.decay;
        return this.alpha > 0;
    }
}

class Rocket {
    constructor(ctx, createParticles) {
        this.ctx = ctx; this.createParticles = createParticles;
        this.x = Math.random() * window.innerWidth; this.y = window.innerHeight;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = -(Math.random() * 5 + 12);
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.exploded = false;
    }
    draw() {
        ctx.globalAlpha = 1; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill();
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.vy += 0.2;
        if (this.vy >= 0 && !this.exploded) {
            this.exploded = true;
            this.createParticles(this.x, this.y, this.color);
            return false;
        }
        return true;
    }
}

let fireworksCanvas, fCtx, rockets = [], particles = [], fireworksRunning = false;

function startRealFireworks() {
    fireworksCanvas = document.getElementById('fireworks-canvas');
    if (!fireworksCanvas) return;
    fCtx = fireworksCanvas.getContext('2d');
    fireworksCanvas.width = window.innerWidth; fireworksCanvas.height = window.innerHeight;
    fireworksRunning = true;
    loopFireworks();
}

function loopFireworks() {
    if (!fireworksRunning) return;
    if(state.isMobile) { setTimeout(() => requestAnimationFrame(loopFireworks), 40); } 
    else { requestAnimationFrame(loopFireworks); }
    
    fCtx.globalCompositeOperation = 'destination-out';
    fCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    fCtx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    fCtx.globalCompositeOperation = 'lighter';

    if (Math.random() < 0.05) {
        rockets.push(new Rocket(fCtx, createExplosion));
    }
    rockets = rockets.filter(r => { r.draw(); return r.update(); });
    particles = particles.filter(p => { p.draw(fCtx); return p.update(); });
}

function createExplosion(x, y, color) {
    const count = state.isMobile ? 20 : 40;
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

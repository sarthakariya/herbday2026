/* MAIN SCRIPT */

const CONFIG = {
    candleCount: 17,
    micThreshold: 12, 
    flickerThreshold: 8,
};

const state = {
    listening: false,
    audioCtx: null,
    analyser: null,
    extinguished: 0,
    candles: [],
    fireworksActive: false
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Generate Candles
    const holder = document.getElementById('candles-container');
    const rx = 55; 
    const ry = 20; 

    for(let i=0; i<CONFIG.candleCount; i++) {
        const angle = (i / CONFIG.candleCount) * Math.PI * 2;
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;

        const el = document.createElement('div');
        el.className = 'candle';
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.zIndex = Math.floor(y + 200);

        const hues = [340, 200, 45, 120, 280]; 
        const h = hues[i % hues.length];
        el.style.backgroundColor = `hsl(${h}, 70%, 85%)`;

        const wick = document.createElement('div');
        wick.className = 'wick';
        const flame = document.createElement('div');
        flame.className = 'flame';
        
        const delay = Math.random() * 2 + 's';
        flame.style.setProperty('--delay', delay);
        flame.style.animationDelay = delay;
        
        // Manual blow on click
        el.addEventListener('click', () => {
            if(state.candles[i].active) {
                state.candles[i].active = false;
                flame.classList.add('out');
                el.classList.add('out');
                state.extinguished++;
                if(state.extinguished >= CONFIG.candleCount) finishParty();
            }
        });
        
        el.appendChild(wick);
        el.appendChild(flame);
        holder.appendChild(el);

        state.candles.push({ el: flame, container: el, active: true });
    }

    // 2. Scatter Props
    const chocoContainer = document.getElementById('chocolates-container');
    if(chocoContainer) {
        for(let i=0; i<12; i++) {
            const choco = document.createElement('div');
            choco.className = 'chocolate';
            const top = 20 + Math.random() * 100;
            const left = 60 + Math.random() * 30; 
            const size = 10 + Math.random() * 10;
            const rot = Math.random() * 360;
            choco.style.top = top + 'px';
            choco.style.left = left + '%';
            choco.style.width = size + 'px';
            choco.style.height = size + 'px';
            choco.style.transform = `rotate(${rot}deg)`;
            choco.style.opacity = '0.9';
            chocoContainer.appendChild(choco);
        }
    }

    const petalsContainer = document.getElementById('petals-container');
    if(petalsContainer) {
        for(let i=0; i<15; i++) {
            const petal = document.createElement('div');
            petal.className = 'petal';
            const top = Math.random() * 120;
            const left = Math.random() * 100;
            const rot = Math.random() * 360;
            petal.style.top = top + 'px';
            petal.style.left = left + '%';
            petal.style.transform = `rotate(${rot}deg)`;
            const petalColors = ['#e91e63', '#ec407a', '#f48fb1', '#d81b60'];
            petal.style.backgroundColor = petalColors[Math.floor(Math.random()*petalColors.length)];
            petalsContainer.appendChild(petal);
        }
    }

    const dustContainer = document.getElementById('magic-dust');
    if(dustContainer) {
        const fragment = document.createDocumentFragment();
        for(let i=0; i<30; i++) {
            const particle = document.createElement('div');
            particle.className = 'dust-particle';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 5 + 's';
            fragment.appendChild(particle);
        }
        dustContainer.appendChild(fragment);
    }

    // 3. Bubbles Generator
    createBubbles();

    // 4. Fairy Lights
    const lightsContainer = document.getElementById('fairy-lights');
    if(lightsContainer) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M0,0 Q500,150 1000,0");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#a1887f");
        path.setAttribute("stroke-width", "2");
        svg.appendChild(path);
        lightsContainer.appendChild(svg);
        for(let i=1; i<20; i++) {
            const bulb = document.createElement('div');
            bulb.className = 'bulb';
            const pct = i * (100 / 20);
            bulb.style.left = pct + '%';
            const x = i / 20;
            const y = 150 * (1 - Math.pow(2*x - 1, 2));
            bulb.style.top = y + 'px';
            bulb.style.animationDelay = Math.random() + 's';
            lightsContainer.appendChild(bulb);
        }
    }

    // 5. Start Button Logic - KEY FOR AUDIO
    document.getElementById('start-btn').addEventListener('click', () => {
        // Initialize mic immediately
        initAudio(); 
        
        // UI Transitions
        const screen = document.getElementById('start-screen');
        screen.style.opacity = 0;
        setTimeout(() => screen.remove(), 1000);

        document.body.classList.add('open');
        document.getElementById('hud').classList.remove('hidden');
        
        // Play Background Music Immediately
        const bgAudio = document.getElementById('bg-music');
        if(bgAudio) {
            bgAudio.volume = 0.5;
            bgAudio.play().catch(e => console.log("Audio play error:", e));
        }
        
        // Start loops
        setInterval(spawnFallingBit, 300);
        loop();
    });

    const card = document.getElementById('card-wrapper');
    if(card) {
        card.addEventListener('click', () => {
            card.classList.toggle('open');
        });
    }

    // Force reload GIFs
    document.querySelectorAll('.gif-sticker img').forEach(img => {
        const src = img.src;
        img.src = src; 
    });
});

function createBubbles() {
    const container = document.getElementById('bubbles-container');
    if(!container) return;
    
    for(let i=0; i<15; i++) {
        spawnBubble(container);
    }
    
    setInterval(() => {
        if(document.hidden) return; 
        spawnBubble(container);
    }, 2000);
}

function spawnBubble(container) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const size = 10 + Math.random() * 40;
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = Math.random() * 100 + '%';
    bubble.style.animationDuration = (8 + Math.random() * 10) + 's';
    
    container.appendChild(bubble);
    setTimeout(() => {
        if(bubble.parentNode) bubble.parentNode.removeChild(bubble);
    }, 18000);
}

function spawnFallingBit() {
    const container = document.getElementById('continuous-confetti');
    if(!container) return;
    const bit = document.createElement('div');
    bit.className = 'falling-bit';
    bit.style.left = Math.random() * 100 + '%';
    bit.style.animationDuration = (5 + Math.random() * 5) + 's';
    const type = Math.random();
    if(type < 0.3) {
        bit.style.background = '#fbc02d'; bit.style.borderRadius = '50%';
    } else if (type < 0.6) {
        bit.style.background = '#e91e63'; bit.style.width = '8px'; bit.style.height = '8px'; bit.style.transform = 'rotate(45deg)';
    } else {
        bit.style.background = '#388e3c'; bit.style.borderRadius = '0 50% 0 50%'; bit.style.height = '12px';
    }
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
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        source.connect(filter);
        filter.connect(state.analyser);
        state.listening = true;
    } catch(e) {
        console.error(e);
        console.log("Mic access not granted. Click candles to blow them out.");
    }
}

function playAirSound() {
    if(!state.audioCtx) return;
    const bufferSize = state.audioCtx.sampleRate * 1.5; 
    const buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = state.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = state.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, state.audioCtx.currentTime);
    filter.frequency.linearRampToValueAtTime(100, state.audioCtx.currentTime + 1.5);

    const gain = state.audioCtx.createGain();
    gain.gain.setValueAtTime(0, state.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.8, state.audioCtx.currentTime + 0.1); 
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 1.5); 

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(state.audioCtx.destination);
    
    noise.start();
}

function loop() {
    if(state.listening && state.analyser) {
        const data = new Uint8Array(state.analyser.frequencyBinCount);
        state.analyser.getByteFrequencyData(data);
        
        let sum = 0;
        for(let i=0; i<data.length; i++) sum += data[i];
        const avg = sum / data.length;

        document.getElementById('mic-level').style.width = Math.min(avg * 4, 100) + '%';

        if(avg > CONFIG.flickerThreshold && avg < CONFIG.micThreshold) {
             state.candles.forEach(c => {
                 if(c.active) c.el.classList.add('flicker-hard');
             });
        } else {
             state.candles.forEach(c => {
                 if(c.active) c.el.classList.remove('flicker-hard');
             });
        }

        if(avg > CONFIG.micThreshold) {
            blowRandomCandle();
        }
    }
    requestAnimationFrame(loop);
}

function blowRandomCandle() {
    const active = state.candles.filter(c => c.active);
    if(active.length === 0) return;

    // Blow 1-2 candles at a time
    const amount = Math.floor(Math.random() * 2) + 1;
    
    for(let i=0; i<amount; i++) {
        if(state.extinguished >= CONFIG.candleCount) break;
        
        const activeCandidates = state.candles.filter(c => c.active);
        if(activeCandidates.length === 0) break;

        const idx = Math.floor(Math.random() * activeCandidates.length);
        const target = activeCandidates[idx];
        
        target.active = false;
        target.el.classList.remove('flicker-hard');
        target.el.classList.add('out'); 
        target.container.classList.add('out'); 
        
        playAirSound(); 
        state.extinguished++;
    }
    
    if(state.extinguished >= CONFIG.candleCount) {
        if(!state.won) {
            state.won = true;
            setTimeout(finishParty, 800);
        }
    }
}

function finishParty() {
    state.listening = false;
    
    // 1. Play CLAPPING & CHEERING SFX
    const cheer = document.getElementById('cheer-sfx');
    if(cheer) { cheer.currentTime = 0; cheer.play().catch(e => console.log(e)); }
    
    const clap = document.getElementById('clapping-sfx');
    if(clap) { clap.currentTime = 0; clap.play().catch(e => console.log(e)); }

    const pop = document.getElementById('pop-sfx');
    if(pop) { pop.currentTime = 0; pop.play().catch(e => console.log(e)); }
    
    // 2. Play FIREWORKS SFX
    const fwSound = document.getElementById('fireworks-sfx');
    if(fwSound) {
        fwSound.volume = 0.6;
        fwSound.play().catch(e => console.log(e));
    }

    // 3. Trigger Confetti
    if(typeof confetti !== 'undefined') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 } }), 500);
    }

    // 4. Start Real Fireworks
    startRealFireworks();
    
    // 5. Music Volume Up
    const music = document.getElementById('bg-music');
    if(music) {
        music.volume = 1.0;
    }

    // 6. Show Message
    const bigGreeting = document.getElementById('big-greeting');
    if(bigGreeting) {
        bigGreeting.classList.remove('hidden');
    }

    // 7. Show Card after delay
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
    }, 5000);
}

// --- REAL CANVAS FIREWORKS ENGINE ---
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * velocity;
        this.vy = Math.sin(angle) * velocity;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.015;
    }
    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // gravity
        this.alpha -= this.decay;
        return this.alpha > 0;
    }
}

class Rocket {
    constructor(ctx, createParticles) {
        this.ctx = ctx;
        this.createParticles = createParticles;
        this.x = Math.random() * window.innerWidth;
        this.y = window.innerHeight;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = -(Math.random() * 5 + 12);
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.exploded = false;
    }
    draw() {
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        // trail
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y);
        this.ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
        this.ctx.strokeStyle = this.color;
        this.ctx.stroke();
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // gravity
        if (this.vy >= 0 && !this.exploded) {
            this.exploded = true;
            this.createParticles(this.x, this.y, this.color);
            triggerFlash(); 
            return false;
        }
        return true;
    }
}

let fireworksCanvas, fCtx;
let rockets = [];
let particles = [];
let fireworksRunning = false;

function triggerFlash() {
    const flash = document.getElementById('flash-overlay');
    if(!flash) return;
    flash.style.opacity = 0.6;
    setTimeout(() => {
        flash.style.opacity = 0;
    }, 100);
}

function startRealFireworks() {
    fireworksCanvas = document.getElementById('fireworks-canvas');
    if (!fireworksCanvas) return;
    fCtx = fireworksCanvas.getContext('2d');
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
    fireworksRunning = true;
    requestAnimationFrame(loopFireworks);
}

function loopFireworks() {
    if (!fireworksRunning) return;
    requestAnimationFrame(loopFireworks);
    
    // Fade out trail
    fCtx.globalCompositeOperation = 'destination-out';
    fCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    fCtx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    fCtx.globalCompositeOperation = 'lighter';

    // Spawn rockets randomly
    if (Math.random() < 0.05) {
        rockets.push(new Rocket(fCtx, createExplosion));
        if(Math.random() < 0.3) rockets.push(new Rocket(fCtx, createExplosion));
    }

    rockets = rockets.filter(r => {
        r.draw();
        return r.update();
    });

    particles = particles.filter(p => {
        p.draw(fCtx);
        return p.update();
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 40; i++) {
        particles.push(new Particle(x, y, color));
    }
}

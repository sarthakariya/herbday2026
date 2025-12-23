/* MAIN SCRIPT */

const CONFIG = {
    candleCount: 17,
    // Increased threshold: 5 was too sensitive, 30 requires a deliberate blow close to mic.
    micThreshold: 30, 
    flickerThreshold: 10,
};

const state = {
    listening: false,
    audioCtx: null,
    analyser: null,
    extinguished: 0,
    candles: [],
    musicPlaying: false
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
        
        // Randomize initial animation
        const delay = Math.random() * 2 + 's';
        flame.style.setProperty('--delay', delay);
        flame.style.animationDelay = delay;
        
        el.appendChild(wick);
        el.appendChild(flame);
        holder.appendChild(el);

        state.candles.push({ el: flame, container: el, active: true });
    }

    // 2. Scatter Chocolates
    const chocoContainer = document.getElementById('chocolates-container');
    for(let i=0; i<12; i++) {
        const choco = document.createElement('div');
        choco.className = 'chocolate';
        const top = 20 + Math.random() * 100;
        const left = 5 + Math.random() * 90;
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

    // 3. Scatter Petals
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

    // 4. Magic Dust
    const dustContainer = document.getElementById('magic-dust');
    if(dustContainer) {
        for(let i=0; i<30; i++) {
            const particle = document.createElement('div');
            particle.className = 'dust-particle';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 5 + 's';
            dustContainer.appendChild(particle);
        }
    }

    // 5. Generate Fairy Lights
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

        const bulbCount = 20;
        for(let i=1; i<bulbCount; i++) {
            const bulb = document.createElement('div');
            bulb.className = 'bulb';
            const pct = i * (100 / bulbCount);
            bulb.style.left = pct + '%';
            
            const x = i / bulbCount;
            const y = 150 * (1 - Math.pow(2*x - 1, 2));
            
            bulb.style.top = y + 'px';
            bulb.style.animationDelay = Math.random() + 's';
            lightsContainer.appendChild(bulb);
        }
    }

    // 6. Start Button
    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio(); // Initialize Context for Mic & Music
        
        const screen = document.getElementById('start-screen');
        screen.style.opacity = 0;
        setTimeout(() => screen.remove(), 1000);

        document.body.classList.add('open');
        document.getElementById('hud').classList.remove('hidden');
        
        // Auto start music immediately on click
        toggleMusic(); 
        
        setTimeout(playChime, 800);
        
        // Start Continuous Falling Confetti
        setInterval(spawnFallingBit, 300);

        loop();
    });

    // Card Interaction
    const card = document.getElementById('card-wrapper');
    card.addEventListener('click', () => {
        card.classList.toggle('open');
    });

    // Music Button
    document.getElementById('music-btn').addEventListener('click', toggleMusic);
    
    // Force reload GIFs
    document.querySelectorAll('.gif-sticker img').forEach(img => {
        const src = img.src;
        img.src = src; 
    });
});

// CONTINUOUS FALLING CONFETTI/LEAVES
function spawnFallingBit() {
    const container = document.getElementById('continuous-confetti');
    if(!container) return;
    
    const bit = document.createElement('div');
    bit.className = 'falling-bit';
    
    bit.style.left = Math.random() * 100 + '%';
    bit.style.animationDuration = (5 + Math.random() * 5) + 's';
    
    const type = Math.random();
    if(type < 0.3) {
        bit.style.background = '#fbc02d'; // Deep Gold
        bit.style.borderRadius = '50%';
    } else if (type < 0.6) {
        bit.style.background = '#e91e63'; // Deep Pink
        bit.style.width = '8px';
        bit.style.height = '8px';
        bit.style.transform = 'rotate(45deg)';
    } else {
        bit.style.background = '#388e3c'; // Deep Green (Leaf)
        bit.style.borderRadius = '0 50% 0 50%';
        bit.style.height = '12px';
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
        state.analyser.smoothingTimeConstant = 0.4;
        
        // Create a low-pass filter to isolate wind/breath sounds (low frequency)
        const filter = state.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800; // Focus on lower freq
        
        source.connect(filter);
        filter.connect(state.analyser);
        state.listening = true;
    } catch(e) {
        console.error(e);
        alert("Microphone access is needed for the magic! 🎂");
    }
}

function toggleMusic() {
    const audio = document.getElementById('bg-music');
    if(!audio) return;

    if(state.musicPlaying) {
        audio.pause();
        state.musicPlaying = false;
        document.getElementById('music-btn').innerText = '🎵';
    } else {
        audio.volume = 0.5;
        audio.play().then(() => {
            state.musicPlaying = true;
            document.getElementById('music-btn').innerText = '🔇';
        }).catch(e => console.log("Audio play blocked", e));
    }
}

function playChime() {
    if(!state.audioCtx) return;
    const now = state.audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = state.audioCtx.createOscillator();
        const g = state.audioCtx.createGain();
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.05, now + i*0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 1);
        osc.connect(g);
        g.connect(state.audioCtx.destination);
        osc.start(now + i*0.1);
        osc.stop(now + i*0.1 + 1);
    });
}

// Procedural White Noise "Puff" Sound
function playPuff() {
    if(!state.audioCtx) return;
    const bufferSize = state.audioCtx.sampleRate * 0.5; // 0.5 seconds
    const buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        // White noise
        data[i] = Math.random() * 2 - 1;
    }

    const noiseSrc = state.audioCtx.createBufferSource();
    noiseSrc.buffer = buffer;

    // Filter to make it sound like air
    const noiseFilter = state.audioCtx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = state.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.8, state.audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, state.audioCtx.currentTime + 0.4);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(state.audioCtx.destination);
    noiseSrc.start();
}

function playClapping() {
    if(!state.audioCtx) return;
    // Simulate applause with random noise bursts
    for(let i=0; i<40; i++) {
        setTimeout(playPuff, Math.random() * 2000);
    }
}

// --- LOGIC LOOP ---
function loop() {
    if(state.listening && state.analyser) {
        const data = new Uint8Array(state.analyser.frequencyBinCount);
        state.analyser.getByteFrequencyData(data);
        
        // Calculate average volume
        let sum = 0;
        for(let i=0; i<data.length; i++) sum += data[i];
        const avg = sum / data.length;

        document.getElementById('mic-level').style.width = Math.min(avg * 4, 100) + '%';

        // FLICKER EFFECT: If blowing gently (threshold 10 - 30)
        if(avg > CONFIG.flickerThreshold && avg < CONFIG.micThreshold) {
             state.candles.forEach(c => {
                 if(c.active) c.el.classList.add('flicker-hard');
             });
        } else {
             state.candles.forEach(c => {
                 if(c.active) c.el.classList.remove('flicker-hard');
             });
        }

        // BLOW OUT: If blowing hard (threshold > 30)
        if(avg > CONFIG.micThreshold) {
            blowCandle();
        }
    }
    requestAnimationFrame(loop);
}

function blowCandle() {
    const active = state.candles.filter(c => c.active);
    if(active.length === 0) return;

    // Extinguish 1-3 candles at a time for realism
    const amount = Math.floor(Math.random() * 3) + 1;
    
    for(let i=0; i<amount; i++) {
        if(state.extinguished >= CONFIG.candleCount) break;
        
        // Find a random active candle
        const activeCandidates = state.candles.filter(c => c.active);
        if(activeCandidates.length === 0) break;

        const idx = Math.floor(Math.random() * activeCandidates.length);
        const target = activeCandidates[idx];
        
        target.active = false;
        target.el.classList.remove('flicker-hard'); // Stop flicker
        target.el.classList.add('out'); // Add out (fade + smoke)
        target.container.classList.add('out'); // For smoke effect selector
        
        playPuff(); // Sound
        state.extinguished++;
    }
    
    if(state.extinguished >= CONFIG.candleCount) {
        setTimeout(win, 500); // Slight delay before win state
    }
}

function superCelebration() {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => {
        confetti({ particleCount: 50, spread: 100, origin: { y: 0.6 }, shapes: ['star'], colors: ['#FFD700', '#FFA500'] });
    }, 500);
    setTimeout(() => {
        confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, shapes: ['circle'], colors: ['#e91e63'] });
        confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, shapes: ['circle'], colors: ['#e91e63'] });
    }, 1000);
    setTimeout(() => {
        confetti({ particleCount: 200, spread: 160, origin: { y: 0.3 }, scalar: 1.2 });
    }, 2000);
}

// WIN STATE LOGIC
function win() {
    if(!state.listening) return; // Prevent double trigger
    state.listening = false; // Stop listening
    
    // 1. Trigger Confetti & Clapping
    playClapping();
    superCelebration();
    
    // 2. STOP Background Music
    const bgAudio = document.getElementById('bg-music');
    if(bgAudio) {
        bgAudio.pause();
        bgAudio.currentTime = 0; 
    }

    // 3. START Happy Birthday Song
    const winAudio = document.getElementById('win-music');
    if(winAudio) {
        winAudio.volume = 1.0;
        winAudio.currentTime = 0;
        // Resume context just in case
        if(state.audioCtx && state.audioCtx.state === 'suspended') state.audioCtx.resume();
        
        const playPromise = winAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Auto-play failed:", error);
                // Fallback: Use browser text-to-speech if MP3 fails
                const msg = new SpeechSynthesisUtterance("Happy Birthday My Love!");
                window.speechSynthesis.speak(msg);
            });
        }
    }
    
    // 4. Hide Music Controls
    const musicControl = document.getElementById('music-control');
    if(musicControl) musicControl.style.display = 'none';

    // 5. SHOW Big Greeting Text Overlay immediately
    const bigGreeting = document.getElementById('big-greeting');
    if(bigGreeting) {
        bigGreeting.classList.remove('hidden');
    }

    // 6. SHOW Card Modal after 7 seconds
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
    }, 7000);
}

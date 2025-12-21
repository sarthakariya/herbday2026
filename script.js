/* --- CONFIGURATION --- */
const CONFIG = {
    candleCount: 16,
    micThreshold: 25, // Sensitivity (Lower = easier)
    blowCooldown: 150
};

/* --- STATE MANAGEMENT --- */
const state = {
    audioCtx: null,
    analyser: null,
    micSource: null,
    isListening: false,
    extinguishedCount: 0,
    candles: [],
    lastBlowTime: 0
};

/* --- DOM ELEMENTS --- */
const ui = {
    startScreen: document.getElementById('start-screen'),
    startBtn: document.getElementById('start-btn'),
    micStatus: document.getElementById('mic-status'),
    micBar: document.getElementById('mic-bar'),
    candleContainer: document.getElementById('candle-placement'),
    curtains: document.querySelectorAll('.curtain'),
    messageContainer: document.getElementById('message-container'),
    cardBtn: document.getElementById('card-btn'),
    cardModal: document.getElementById('card-modal'),
    card3d: document.querySelector('.card-3d'),
    closeCard: document.getElementById('close-card')
};

/* --- INITIALIZATION --- */
window.onload = () => {
    generateCandles();
    
    ui.startBtn.addEventListener('click', async () => {
        ui.micStatus.innerText = "Initializing Audio...";
        try {
            await initAudio();
            startExperience();
        } catch (err) {
            console.error(err);
            ui.micStatus.innerText = "Error: " + err.message;
            alert("Could not access microphone. Please allow permissions.");
        }
    });

    // Card Interaction
    ui.cardBtn.addEventListener('click', () => {
        ui.cardModal.classList.remove('hidden');
    });
    ui.card3d.addEventListener('click', () => {
        ui.card3d.classList.toggle('open');
    });
    ui.closeCard.addEventListener('click', () => {
        ui.cardModal.classList.add('hidden');
        ui.card3d.classList.remove('open');
    });
};

/* --- 3D OBJECT GENERATION --- */
function generateCandles() {
    const radius = 90; // Fit on top tier
    
    for (let i = 0; i < CONFIG.candleCount; i++) {
        const angle = (i / CONFIG.candleCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius; // Z axis for depth
        
        const candleWrapper = document.createElement('div');
        candleWrapper.className = 'candle-obj';
        // Translate X and Z to position on circle, translate Y up to sit on cake
        // Note: transform-style preserve-3d is crucial here
        candleWrapper.style.transform = `translateX(${x}px) translateZ(${z}px) rotateX(-90deg) translateY(-50px)`;
        
        // Build 3D Box for Candle
        const candleHTML = `
            <div class="c-side c-front"></div>
            <div class="c-side c-back"></div>
            <div class="c-side c-left"></div>
            <div class="c-side c-right"></div>
            <div class="wick"></div>
            <div class="flame" id="flame-${i}"></div>
        `;
        
        candleWrapper.innerHTML = candleHTML;
        
        // Click fallback
        candleWrapper.addEventListener('click', () => blowOutCandle(i));
        
        ui.candleContainer.appendChild(candleWrapper);
        state.candles.push({ id: i, active: true, el: candleWrapper });
    }
}

/* --- AUDIO ENGINE --- */
async function initAudio() {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Resume context if suspended (browser policy)
    if (state.audioCtx.state === 'suspended') {
        await state.audioCtx.resume();
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.micSource = state.audioCtx.createMediaStreamSource(stream);
    state.analyser = state.audioCtx.createAnalyser();
    state.analyser.fftSize = 256;
    
    // Low pass filter to target "blowing" wind noise (bass frequencies)
    const filter = state.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400; // Focus on < 400Hz

    state.micSource.connect(filter);
    filter.connect(state.analyser);
    
    state.isListening = true;
}

function startExperience() {
    ui.startScreen.style.opacity = 0;
    setTimeout(() => ui.startScreen.style.display = 'none', 1000);
    
    // Open Curtains
    setTimeout(() => {
        document.querySelector('.room-wall').classList.add('curtains-open');
    }, 500);

    loop();
}

/* --- GAME LOOP --- */
function loop() {
    if (!state.isListening) return;
    
    const dataArray = new Uint8Array(state.analyser.frequencyBinCount);
    state.analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    let sum = 0;
    const length = dataArray.length;
    for(let i = 0; i < length; i++) {
        sum += dataArray[i];
    }
    const average = sum / length;
    
    // UI Update
    ui.micBar.style.width = Math.min(average * 3, 100) + '%';
    
    // Detection Logic
    if (average > CONFIG.micThreshold && (Date.now() - state.lastBlowTime > CONFIG.blowCooldown)) {
        triggerBlow();
        state.lastBlowTime = Date.now();
    }
    
    requestAnimationFrame(loop);
}

function triggerBlow() {
    // Find active candles
    const active = state.candles.filter(c => c.active);
    if (active.length === 0) return;
    
    // Blow out 1 to 3 candles at random
    const count = Math.ceil(Math.random() * 3);
    
    for(let k=0; k<count; k++) {
        if(state.candles.filter(c => c.active).length > 0) {
            const randomIdx = Math.floor(Math.random() * active.length);
            const target = active[randomIdx];
            // Remove from local list to avoid double picking
            active.splice(randomIdx, 1); 
            blowOutCandle(target.id);
        }
    }
}

function blowOutCandle(index) {
    const candle = state.candles[index];
    if (!candle.active) return;
    
    candle.active = false;
    state.extinguishedCount++;
    
    const flame = document.getElementById(`flame-${index}`);
    flame.classList.add('out');
    
    // Smoke Particle
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    candle.el.appendChild(smoke);
    
    // Sound Effect (White Noise Burst)
    playPuffSound();

    if (state.extinguishedCount >= CONFIG.candleCount) {
        winSequence();
    }
}

/* --- AUDIO SYNTHESIS --- */
function playPuffSound() {
    if (!state.audioCtx) return;
    const t = state.audioCtx.currentTime;
    const osc = state.audioCtx.createBufferSource();
    const buffer = state.audioCtx.createBuffer(1, state.audioCtx.sampleRate * 0.1, state.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
    
    osc.buffer = buffer;
    const gain = state.audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start();
}

function playClapping() {
    if (!state.audioCtx) return;
    // Generate bursts of noise to simulate clapping
    const count = 30; // Number of claps
    const startT = state.audioCtx.currentTime;
    
    for(let i=0; i<count; i++) {
        const t = startT + Math.random() * 2; // Spread over 2 seconds
        const dur = 0.1 + Math.random() * 0.05;
        
        const osc = state.audioCtx.createBufferSource();
        const buffer = state.audioCtx.createBuffer(1, state.audioCtx.sampleRate * dur, state.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < buffer.length; j++) data[j] = (Math.random() * 2 - 1) * 0.5; // Soften
        
        osc.buffer = buffer;
        
        // Filter to make it sound more like skin/hands
        const filter = state.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        
        const gain = state.audioCtx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(state.audioCtx.destination);
        osc.start(t);
    }
}

/* --- WIN SEQUENCE --- */
function winSequence() {
    state.isListening = false;
    
    setTimeout(() => {
        playClapping();
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
        ui.messageContainer.classList.remove('hidden');
    }, 500);
}

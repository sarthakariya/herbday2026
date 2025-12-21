/* MAIN SCRIPT */
import { GoogleGenAI, Modality } from "https://esm.sh/@google/genai";

const CONFIG = {
    candleCount: 17,
    micThreshold: 10,
};

const state = {
    listening: false,
    audioCtx: null,
    analyser: null,
    extinguished: 0,
    candles: [],
    musicPlaying: false,
    musicNodes: [],
    ttsPlaying: false
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Generate Candles
    const holder = document.getElementById('candles-container');
    const rx = 65; // Radius X
    const ry = 25; // Radius Y (Perspective)

    for(let i=0; i<CONFIG.candleCount; i++) {
        const angle = (i / CONFIG.candleCount) * Math.PI * 2;
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;

        const el = document.createElement('div');
        el.className = 'candle';
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.zIndex = Math.floor(y + 100);

        // Random Candle Colors (Pastels)
        const hues = [340, 200, 45, 120, 280]; // Pink, Blue, Gold, Green, Purple
        const h = hues[i % hues.length];
        el.style.backgroundColor = `hsl(${h}, 70%, 85%)`;

        const wick = document.createElement('div');
        wick.className = 'wick';
        const flame = document.createElement('div');
        flame.className = 'flame';
        
        const delay = Math.random() * 2 + 's';
        flame.style.setProperty('--delay', delay);
        flame.style.animationDelay = delay;
        
        el.appendChild(wick);
        el.appendChild(flame);
        holder.appendChild(el);

        state.candles.push({ el: flame, active: true });
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
            
            // Random petal colors (pinks/reds)
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
        initAudio();
        
        const screen = document.getElementById('start-screen');
        screen.style.opacity = 0;
        setTimeout(() => screen.remove(), 1000);

        document.body.classList.add('open');
        document.getElementById('hud').classList.remove('hidden');
        
        setTimeout(playChime, 800);
        setTimeout(toggleMusic, 2000); // Auto start music softly
        
        // Trigger Gift Animations after delay
        setTimeout(() => {
            document.querySelectorAll('.gift-box').forEach(g => g.classList.add('animated'));
        }, 3000);

        // Start Continuous Falling Confetti (More frequent now)
        setInterval(spawnFallingBit, 400);

        loop();
    });

    // Card Interaction
    const card = document.getElementById('card-wrapper');
    card.addEventListener('click', (e) => {
        // Prevent closing if clicking button
        if(e.target.id === 'tts-btn') return;
        card.classList.toggle('open');
    });

    // TTS Button
    document.getElementById('tts-btn').addEventListener('click', playTTS);

    // Music Button
    document.getElementById('music-btn').addEventListener('click', toggleMusic);
});

// CONTINUOUS FALLING CONFETTI/LEAVES
function spawnFallingBit() {
    const container = document.getElementById('continuous-confetti');
    if(!container) return;
    
    const bit = document.createElement('div');
    bit.className = 'falling-bit';
    
    // Random visual properties
    bit.style.left = Math.random() * 100 + '%';
    bit.style.animationDuration = (5 + Math.random() * 5) + 's';
    
    // Deep colors
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

    // Cleanup
    setTimeout(() => {
        bit.remove();
    }, 10000);
}


// --- AUDIO ---
async function initAudio() {
    try {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(state.audioCtx.state === 'suspended') await state.audioCtx.resume();
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = state.audioCtx.createMediaStreamSource(stream);
        state.analyser = state.audioCtx.createAnalyser();
        state.analyser.fftSize = 256;
        
        const filter = state.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        
        source.connect(filter);
        filter.connect(state.analyser);
        state.listening = true;
    } catch(e) {
        console.error(e);
        alert("Microphone access is needed for the magic! 🎂");
    }
}

// Background Music Logic (Ambient Pads)
function toggleMusic() {
    if(!state.audioCtx) return;

    if(state.musicPlaying) {
        // Stop
        state.musicNodes.forEach(node => {
            try { node.stop(); } catch(e){}
            try { node.disconnect(); } catch(e){}
        });
        state.musicNodes = [];
        state.musicPlaying = false;
        document.getElementById('music-btn').innerText = '🎵';
    } else {
        // Play Ambient Chord (C Major 7 + 9)
        const freqs = [261.63, 329.63, 392.00, 493.88, 587.33]; // C4, E4, G4, B4, D5
        const now = state.audioCtx.currentTime;
        
        const masterGain = state.audioCtx.createGain();
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(0.03, now + 2); // Very soft volume
        masterGain.connect(state.audioCtx.destination);
        state.musicNodes.push(masterGain); // Tracking primarily for disconnect, though gain doesn't have stop()

        freqs.forEach(f => {
            const osc = state.audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            
            // Subtle vibrato
            const lfo = state.audioCtx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 1 + Math.random();
            const lfoGain = state.audioCtx.createGain();
            lfoGain.gain.value = 2; // Hz depth
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start();

            const oscGain = state.audioCtx.createGain();
            oscGain.gain.value = 0.5;

            osc.connect(oscGain);
            oscGain.connect(masterGain);
            osc.start();
            
            state.musicNodes.push(osc);
            state.musicNodes.push(lfo);
            state.musicNodes.push(lfoGain);
            state.musicNodes.push(oscGain);
        });

        state.musicPlaying = true;
        document.getElementById('music-btn').innerText = '🔇';
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

const NOTE = {
    G3: 196, A3: 220, B3: 246.9,
    C4: 261.6, D4: 293.6, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.8, C5: 523.2
};

function playBirthdaySong() {
    if(!state.audioCtx) return;
    const t = state.audioCtx.currentTime;
    
    // Stop background music temporarily to focus on birthday song if desired, 
    // but user asked for background music "throughout". We'll keep it as a bed.
    
    const song = [
        {f: NOTE.G3, d: 0.3}, {f: NOTE.G3, d: 0.3}, {f: NOTE.A3, d: 0.6}, {f: NOTE.G3, d: 0.6}, {f: NOTE.C4, d: 0.6}, {f: NOTE.B3, d: 1.0}, // Happy Birthday to You
        {f: NOTE.G3, d: 0.3}, {f: NOTE.G3, d: 0.3}, {f: NOTE.A3, d: 0.6}, {f: NOTE.G3, d: 0.6}, {f: NOTE.D4, d: 0.6}, {f: NOTE.C4, d: 1.0}, // Happy Birthday to You
        {f: NOTE.G3, d: 0.3}, {f: NOTE.G3, d: 0.3}, {f: NOTE.G4, d: 0.6}, {f: NOTE.E4, d: 0.6}, {f: NOTE.C4, d: 0.6}, {f: NOTE.B3, d: 0.6}, {f: NOTE.A3, d: 0.6}, // Happy Birthday My Baby
        {f: NOTE.F4, d: 0.3}, {f: NOTE.F4, d: 0.3}, {f: NOTE.E4, d: 0.6}, {f: NOTE.C4, d: 0.6}, {f: NOTE.D4, d: 0.6}, {f: NOTE.C4, d: 1.2}  // Happy Birthday to You
    ];

    let cursor = 0;
    song.forEach(note => {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        osc.type = 'triangle'; // Softer, flute-like
        osc.frequency.value = note.f;
        
        gain.gain.setValueAtTime(0.1, t + cursor);
        gain.gain.linearRampToValueAtTime(0.08, t + cursor + note.d * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, t + cursor + note.d);

        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        osc.start(t + cursor);
        osc.stop(t + cursor + note.d);
        
        cursor += note.d + 0.05; // slight gap
    });
}

function playPuff() {
    if(!state.audioCtx) return;
    const t = state.audioCtx.currentTime;
    const buffer = state.audioCtx.createBuffer(1, state.audioCtx.sampleRate * 0.1, state.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i=0; i<data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    
    const src = state.audioCtx.createBufferSource();
    src.buffer = buffer;
    const g = state.audioCtx.createGain();
    
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    
    src.connect(g);
    g.connect(state.audioCtx.destination);
    src.start();
}

function playClapping() {
    if(!state.audioCtx) return;
    for(let i=0; i<80; i++) {
        setTimeout(playPuff, Math.random() * 2500);
    }
}

// --- LOGIC LOOP ---
function loop() {
    if(state.listening && state.analyser) {
        const data = new Uint8Array(state.analyser.frequencyBinCount);
        state.analyser.getByteFrequencyData(data);
        const avg = data.reduce((a,b)=>a+b) / data.length;

        document.getElementById('mic-level').style.width = Math.min(avg * 4, 100) + '%';

        if(avg > CONFIG.micThreshold) {
            blowCandle();
        }
    }
    requestAnimationFrame(loop);
}

function blowCandle() {
    const active = state.candles.filter(c => c.active);
    if(active.length === 0) return;

    const idx = Math.floor(Math.random() * active.length);
    const target = active[idx];
    target.active = false;
    target.el.classList.add('out');
    
    playPuff();
    state.extinguished++;
    
    if(state.extinguished === CONFIG.candleCount) {
        win();
    }
}

function win() {
    state.listening = false;
    
    playClapping();
    confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
    
    setTimeout(playBirthdaySong, 1000);

    setTimeout(() => {
        document.getElementById('card-modal').classList.remove('hidden');
    }, 4000);
}

// --- TTS Logic ---

async function decodeAudioData(base64String, audioContext) {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return await audioContext.decodeAudioData(bytes.buffer);
}

async function playTTS() {
    if(state.ttsPlaying) return;
    const btn = document.getElementById('tts-btn');
    btn.disabled = true;
    btn.innerText = '⏳ Loading...';

    try {
        const text = document.getElementById('card-text').innerText;
        
        // IMPORTANT: In a real app, API_KEY should be handled securely.
        // Assuming process.env.API_KEY is available via bundler replacement.
        // If testing locally without bundler, replace process.env.API_KEY with actual key.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
             const audioBuffer = await decodeAudioData(base64Audio, state.audioCtx);
             const source = state.audioCtx.createBufferSource();
             source.buffer = audioBuffer;
             source.connect(state.audioCtx.destination);
             source.start();
             state.ttsPlaying = true;
             btn.innerText = '🔊 Playing...';
             source.onended = () => {
                 state.ttsPlaying = false;
                 btn.innerText = '🔊 Read';
                 btn.disabled = false;
             };
        } else {
             throw new Error("No audio data returned");
        }

    } catch(e) {
        console.error("TTS Error:", e);
        alert("Could not generate speech. Please check console/API Key.");
        state.ttsPlaying = false;
        btn.innerText = '🔊 Read';
        btn.disabled = false;
    }
}

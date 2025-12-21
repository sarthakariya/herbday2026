/* MAIN SCRIPT */
import { GoogleGenAI, Modality } from "https://esm.sh/@google/genai";

const CONFIG = {
    candleCount: 17,
    micThreshold: 10,
    musicStartSeconds: 80, // 1:20 seconds
};

const state = {
    listening: false,
    audioCtx: null,
    analyser: null,
    extinguished: 0,
    candles: [],
    musicPlaying: false,
    ttsPlaying: false
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Generate Candles
    const holder = document.getElementById('candles-container');
    const rx = 65; 
    const ry = 25; 

    for(let i=0; i<CONFIG.candleCount; i++) {
        const angle = (i / CONFIG.candleCount) * Math.PI * 2;
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;

        const el = document.createElement('div');
        el.className = 'candle';
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.zIndex = Math.floor(y + 100);

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
            const petalColors = ['#e91e63', '#ec407a', '#f48fb1', '#d81b60'];
            petal.style.backgroundColor = petalColors[Math.floor(Math.random()*petalColors.length)];
            petal.style.top = top + 'px';
            petal.style.left = left + '%';
            petal.style.transform = `rotate(${rot}deg)`;
            petalsContainer.appendChild(petal);
        }
    }

    // 4. Magic Dust & Fairy Lights setup (visuals only)
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

    // 6. Start Button Interaction
    document.getElementById('start-btn').addEventListener('click', () => {
        initAudio(); // Initialize Mic
        
        const screen = document.getElementById('start-screen');
        screen.style.opacity = 0;
        setTimeout(() => screen.remove(), 1000);

        document.body.classList.add('open');
        document.getElementById('hud').classList.remove('hidden');
        
        // Start Background Music (Piyu Bole)
        startBackgroundMusic();
        
        setTimeout(playChime, 800);
        
        // Start Continuous Falling Confetti
        setInterval(spawnFallingBit, 300);

        loop();
    });

    // Card Interaction
    const card = document.getElementById('card-wrapper');
    card.addEventListener('click', (e) => {
        if(e.target.id === 'tts-btn') return;
        card.classList.toggle('open');
    });

    // TTS Button
    document.getElementById('tts-btn').addEventListener('click', playTTS);

    // Music Button
    document.getElementById('music-btn').addEventListener('click', toggleBackgroundMusic);
    
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
        bit.style.background = '#ff8a80'; // Heart Red
        bit.style.borderRadius = '50% 50% 0 0'; // fake heart ish
        bit.style.width = '10px';
        bit.style.height = '10px';
    }
    container.appendChild(bit);
    setTimeout(() => { bit.remove(); }, 10000);
}

// --- MUSIC LOGIC ---
function startBackgroundMusic() {
    const audio = document.getElementById('bg-music');
    if(audio) {
        audio.currentTime = CONFIG.musicStartSeconds; // Start from 1:20
        audio.volume = 0.4;
        audio.play().then(() => {
            state.musicPlaying = true;
            document.getElementById('music-btn').innerText = '🔇';
        }).catch(e => console.log("Auto-play blocked:", e));
    }
}

function stopBackgroundMusic() {
    const audio = document.getElementById('bg-music');
    if(audio) {
        // Fade out effect
        let vol = audio.volume;
        const fade = setInterval(() => {
            if(vol > 0.05) {
                vol -= 0.05;
                audio.volume = vol;
            } else {
                clearInterval(fade);
                audio.pause();
                state.musicPlaying = false;
                document.getElementById('music-btn').innerText = '🎵';
            }
        }, 100);
    }
}

function toggleBackgroundMusic() {
    const audio = document.getElementById('bg-music');
    if(!audio) return;
    
    if(state.musicPlaying) {
        audio.pause();
        state.musicPlaying = false;
        document.getElementById('music-btn').innerText = '🎵';
    } else {
        audio.play();
        state.musicPlaying = true;
        document.getElementById('music-btn').innerText = '🔇';
    }
}

// --- MICROPHONE LOGIC ---
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
        alert("Please allow microphone access to blow the candles!");
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
    
    // Simple noise puff
    if(state.audioCtx) {
        const t = state.audioCtx.currentTime;
        const osc = state.audioCtx.createOscillator();
        const g = state.audioCtx.createGain();
        osc.type = 'triangle'; 
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(g); 
        g.connect(state.audioCtx.destination);
        osc.start();
        osc.stop(t+0.1);
    }
    
    state.extinguished++;
    
    if(state.extinguished === CONFIG.candleCount) {
        win();
    }
}

// --- WINNING SCENE ---
function win() {
    state.listening = false;
    
    // STOP Piyu Bole
    stopBackgroundMusic();
    
    // Trigger effects
    superCelebration();
    
    // PLAY Happy Birthday Song (Synth)
    setTimeout(() => {
        playBirthdaySongSynth();
    }, 1000);

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
    }, 5000); // Show card after song intro
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

// SYNTHESIZED HAPPY BIRTHDAY SONG
function playBirthdaySongSynth() {
    if(!state.audioCtx) return;
    const t = state.audioCtx.currentTime;
    const NOTE = { G3: 196, A3: 220, B3: 246.9, C4: 261.6, D4: 293.6, E4: 329.6, F4: 349.2, G4: 392, A4: 440 };
    
    const song = [
        {f: NOTE.G3, d: 0.3}, {f: NOTE.G3, d: 0.3}, {f: NOTE.A3, d: 0.6}, {f: NOTE.G3, d: 0.6}, {f: NOTE.C4, d: 0.6}, {f: NOTE.B3, d: 1.0},
        {f: NOTE.G3, d: 0.3}, {f: NOTE.G3, d: 0.3}, {f: NOTE.A3, d: 0.6}, {f: NOTE.G3, d: 0.6}, {f: NOTE.D4, d: 0.6}, {f: NOTE.C4, d: 1.0},
        {f: NOTE.G3, d: 0.3}, {f: NOTE.G3, d: 0.3}, {f: NOTE.G4, d: 0.6}, {f: NOTE.E4, d: 0.6}, {f: NOTE.C4, d: 0.6}, {f: NOTE.B3, d: 0.6}, {f: NOTE.A3, d: 0.6},
        {f: NOTE.F4, d: 0.3}, {f: NOTE.F4, d: 0.3}, {f: NOTE.E4, d: 0.6}, {f: NOTE.C4, d: 0.6}, {f: NOTE.D4, d: 0.6}, {f: NOTE.C4, d: 1.2}
    ];

    let cursor = 0;
    song.forEach(note => {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = note.f;
        gain.gain.setValueAtTime(0.2, t + cursor); // Louder for celebration
        gain.gain.linearRampToValueAtTime(0.1, t + cursor + note.d * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, t + cursor + note.d);
        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        osc.start(t + cursor);
        osc.stop(t + cursor + note.d);
        cursor += note.d + 0.05;
    });
}


// --- TTS Logic with Fallback ---
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
    const text = document.getElementById('card-text').innerText;

    // 1. Try Google Gemini API
    try {
        if (!process.env.API_KEY) throw new Error("No API Key");
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
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
                 btn.innerText = '🔊 Read Message';
                 btn.disabled = false;
             };
             return; // Success
        }
    } catch(e) {
        console.warn("Gemini TTS failed, falling back to Browser API.", e);
    }

    // 2. Fallback: Browser Web Speech API
    try {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            // Try to find a female voice
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English'));
            if(femaleVoice) utterance.voice = femaleVoice;
            
            utterance.onstart = () => {
                state.ttsPlaying = true;
                btn.innerText = '🔊 Playing...';
            };
            utterance.onend = () => {
                state.ttsPlaying = false;
                btn.innerText = '🔊 Read Message';
                btn.disabled = false;
            };
            
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Sorry, text-to-speech is not supported on this device.");
            btn.disabled = false;
            btn.innerText = '🔊 Read Message';
        }
    } catch (e) {
        console.error("Browser TTS failed", e);
        btn.disabled = false;
        btn.innerText = '🔊 Read Message';
    }
}

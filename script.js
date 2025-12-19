// Configuration
const TOTAL_CANDLES = 17;
const BLOW_THRESHOLD = 30; 

// State
let candlesExtinguished = 0;
let isListening = false;
let audioContext;
let analyser;
let microphone;
let gameWon = false;

// Elements
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('start-overlay');
const candlesContainer = document.getElementById('candles-container');
const headerText = document.getElementById('header-text');
const message = document.getElementById('message');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

// Colors
const candleColors = ['#ff69b4', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'];

// --- Sound Synthesizer ---
const playSound = {
    setup: () => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    blow: () => {
        if(!audioContext) return;
        const t = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        // White noiseish effect using random buffer
        const bufferSize = audioContext.sampleRate * 0.2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        
        noise.start();
    },
    win: () => {
        if(!audioContext) return;
        const t = audioContext.currentTime;
        // Simple "Ta-da" major chord
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; 
        
        notes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.frequency.value = freq;
            osc.type = 'triangle';
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            gain.gain.setValueAtTime(0.1, t + i*0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i*0.1 + 1.5);
            
            osc.start(t + i*0.1);
            osc.stop(t + i*0.1 + 1.5);
        });
    }
};

// --- Initialization ---
function initCandles() {
    for (let i = 0; i < TOTAL_CANDLES; i++) {
        const candle = document.createElement('div');
        candle.className = 'candle';
        const color = candleColors[i % candleColors.length];
        candle.style.setProperty('--c-color', color);
        
        const flame = document.createElement('div');
        flame.className = 'flame';
        flame.id = `flame-${i}`;
        
        candle.appendChild(flame);
        candlesContainer.appendChild(candle);
    }
}

// --- Logic ---
async function startListening() {
    playSound.setup();
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 512;
        
        isListening = true;
        overlay.classList.add('hidden');
        loop();
    } catch (e) {
        alert("Microphone needed to blow candles!");
    }
}

function loop() {
    if (!isListening || gameWon) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    // Check low frequencies for "blowing" sound
    for(let i=0; i<bufferLength/3; i++) sum += dataArray[i];
    const avg = sum / (bufferLength/3);
    
    // Flicker effect
    const flames = document.querySelectorAll('.flame:not(.out)');
    flames.forEach(f => {
        const flicker = (Math.random() - 0.5) * (avg / 5);
        f.style.transform = `translateX(-50%) scale(${1 + avg/100}) rotate(${flicker}deg)`;
    });

    if (avg > BLOW_THRESHOLD) {
        // Blow out 1-2 candles
        if (Math.random() > 0.8 && flames.length > 0) {
             const idx = Math.floor(Math.random() * flames.length);
             extinguish(flames[idx]);
        }
    }
    
    requestAnimationFrame(loop);
}

function extinguish(flameElement) {
    flameElement.classList.add('out');
    candlesExtinguished++;
    playSound.blow();
    
    // Smoke Effect
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    flameElement.parentElement.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1400);

    if (candlesExtinguished >= TOTAL_CANDLES) {
        win();
    }
}

function win() {
    gameWon = true;
    isListening = false;
    headerText.classList.add('hidden');
    playSound.win();
    
    setTimeout(() => {
        message.classList.remove('hidden');
        headerText.style.display = 'none';
        startConfetti();
    }, 500);
}

// --- Confetti ---
const particles = [];
function startConfetti() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Burst
    for(let i=0; i<300; i++) {
        particles.push({
            x: canvas.width/2, 
            y: canvas.height/2,
            vx: (Math.random()-0.5)*20,
            vy: (Math.random()-1)*20,
            color: `hsl(${Math.random()*360}, 100%, 50%)`,
            size: Math.random()*8 + 2
        });
    }
    animateConfetti();
}

function animateConfetti() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i=0; i<particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // Gravity
        
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        
        if(p.y > canvas.height) particles.splice(i--, 1);
    }
    if(particles.length > 0) requestAnimationFrame(animateConfetti);
}

// Bindings
startBtn.addEventListener('click', startListening);
initCandles();
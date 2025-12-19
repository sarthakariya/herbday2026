// Configuration
const TOTAL_CANDLES = 17;
const BLOW_THRESHOLD = 25; // Slightly more sensitive

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
const micIndicator = document.getElementById('mic-indicator');
const micLevelBar = document.getElementById('mic-level-bar');
const candlesContainer = document.getElementById('candles-container');
const headerText = document.getElementById('header-text');
const message = document.getElementById('message');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
const bgDecorations = document.getElementById('background-decorations');

// Colors
const candleColors = ['#ff69b4', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'];
const sprinkleColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

// --- Decoration Init ---
function initDecorations() {
    // Candles
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

    // Sprinkles on cake layers
    document.querySelectorAll('.layer').forEach(layer => {
        for(let i=0; i<15; i++) {
            const s = document.createElement('div');
            s.className = 'sprinkle-dec';
            s.style.backgroundColor = sprinkleColors[Math.floor(Math.random()*sprinkleColors.length)];
            s.style.left = Math.random() * 90 + 5 + '%';
            s.style.top = Math.random() * 80 + 10 + '%';
            layer.appendChild(s);
        }
    });

    // Background Balloons
    const balloonEmojis = ['🎈', '🎉', '🎁', '🎂'];
    for(let i=0; i<15; i++) {
        const b = document.createElement('div');
        b.className = 'balloon';
        b.textContent = balloonEmojis[Math.floor(Math.random()*balloonEmojis.length)];
        b.style.setProperty('--left', Math.random()*100 + '%');
        b.style.setProperty('--delay', Math.random()*5 + 's');
        b.style.setProperty('--duration', (Math.random()*5 + 5) + 's');
        bgDecorations.appendChild(b);
    }
}

// --- Sparkle Effect ---
function spawnSparkle() {
    if(gameWon) return;
    const cakeContainer = document.getElementById('cake-container');
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = Math.random() * 100 + '%';
    sparkle.style.top = Math.random() * 100 + '%';
    cakeContainer.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1500);
    
    setTimeout(spawnSparkle, Math.random() * 1000 + 500);
}

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
        // Simple "Happy Birthday" starting notes ish
        const notes = [523.25, 523.25, 587.33, 523.25, 698.46, 659.25]; 
        
        notes.forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.frequency.value = freq;
            osc.type = 'triangle';
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            gain.gain.setValueAtTime(0.1, t + i*0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i*0.4 + 0.3);
            
            osc.start(t + i*0.4);
            osc.stop(t + i*0.4 + 0.3);
        });
    }
};

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
        micIndicator.classList.remove('hidden');
        spawnSparkle(); // Start sparkles
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
    
    // Update Microphone Visualizer
    const level = Math.min(100, (avg / 50) * 100);
    micLevelBar.style.width = `${level}%`;
    
    // Flicker effect based on input
    const flames = document.querySelectorAll('.flame:not(.out)');
    flames.forEach(f => {
        const flicker = (Math.random() - 0.5) * (avg / 5);
        // Add more chaotic scaling when blowing hard
        const scaleY = 1 + (avg > 20 ? (Math.random() * 0.4) : 0);
        const skew = (Math.random() - 0.5) * (avg / 2);
        f.style.transform = `translateX(-50%) scale(${1 + avg/150}, ${scaleY}) skewX(${skew}deg)`;
    });

    if (avg > BLOW_THRESHOLD) {
        // Blow out 1-3 candles
        if (Math.random() > 0.7 && flames.length > 0) {
             const amount = Math.floor(Math.random() * 2) + 1;
             for(let k=0; k<amount; k++) {
                 if(flames.length > k) {
                    const idx = Math.floor(Math.random() * flames.length);
                    if(!flames[idx].classList.contains('out')) {
                        extinguish(flames[idx]);
                    }
                 }
             }
        }
    }
    
    requestAnimationFrame(loop);
}

function extinguish(flameElement) {
    if(flameElement.classList.contains('out')) return;
    flameElement.classList.add('out');
    candlesExtinguished++;
    playSound.blow();
    
    // Smoke Effect
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    flameElement.parentElement.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1400);

    if (candlesExtinguished >= TOTAL_CANDLES && !gameWon) {
        win();
    }
}

function win() {
    gameWon = true;
    isListening = false;
    headerText.classList.add('hidden');
    micIndicator.classList.add('hidden'); // Hide mic on win
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
            vx: (Math.random()-0.5)*25,
            vy: (Math.random()-1)*25,
            color: `hsl(${Math.random()*360}, 100%, 50%)`,
            size: Math.random()*8 + 3
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
        p.vy += 0.6; // Gravity
        
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        
        if(p.y > canvas.height) particles.splice(i--, 1);
    }
    if(particles.length > 0) requestAnimationFrame(animateConfetti);
}

// Bindings
startBtn.addEventListener('click', startListening);
initDecorations();
